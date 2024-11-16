// src/utilities/request.ts

/** 
 * Custom error class for API requests
 */
export class RequestError extends Error {
  public response: Response;
  public data?: any;
  public status: number;

  constructor(message: string, response: Response, data?: any) {
    super(message);
    this.name = 'RequestError';
    this.response = response;
    this.data = data;
    this.status = response.status;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: any;
  baseURL?: string;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
};

type Headers = Record<string, string>;

/**
 * Parses the response based on content-type
 */
async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  try {
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    if (contentType?.includes('text/plain')) {
      return await response.text();
    }
    if (contentType?.includes('application/octet-stream')) {
      return await response.blob();
    }
    // Default to json
    return await response.json();
  } catch (error) {
    throw new RequestError(
      'Failed to parse response',
      response,
      'Invalid response format'
    );
  }
}

/**
 * Validates response status and throws appropriate error
 */
async function validateResponse(response: Response): Promise<Response> {
  if (response.ok) {
    return response;
  }

  let errorData;
  try {
    errorData = await parseResponse(response);
  } catch {
    errorData = { message: response.statusText };
  }

  throw new RequestError(
    errorData?.message || response.statusText,
    response,
    errorData
  );
}

/**
 * Implements timeout for fetch requests
 */
async function timeoutPromise<T>(
  promise: Promise<T>, 
  timeout: number
): Promise<T> {
  const timeoutError = new RequestError(
    `Request timeout after ${timeout}ms`,
    new Response(null, { status: 408 })
  );

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(timeoutError), timeout);
    })
  ]);
}

/**
 * Retry failed requests
 */
async function retryRequest<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0 || (error instanceof RequestError && error.status === 400)) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
}

/**
 * Main request function with enhanced features
 */
export default async function request<T>(
  url: string, 
  options: RequestOptions = {}
): Promise<T> {
  const {
    baseURL = '',
    timeout = 30000,
    retry = 0,
    retryDelay = 1000,
    headers: customHeaders = {},
    body,
    ...restOptions
  } = options;

  // Default headers
  const defaultHeaders: Headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // Merge headers
  const headers = new Headers({
    ...defaultHeaders,
    ...customHeaders,
  });

  // Process body
  let processedBody = body;
  if (body && !(body instanceof FormData)) {
    if (body instanceof URLSearchParams) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
      processedBody = body.toString();
    } else if (typeof body === 'object' && !Array.isArray(body)) {
      processedBody = JSON.stringify(body);
    }
  }

  // If FormData, let browser handle content-type
  if (body instanceof FormData) {
    headers.delete('Content-Type');
  }

  // Build full URL
  const fullUrl = baseURL ? new URL(url, baseURL).toString() : url;

  // Create fetch promise
  const fetchPromise = async () => {
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers,
      body: processedBody,
    });

    await validateResponse(response);
    return parseResponse(response);
  };

  // Apply timeout and retry if configured
  let promise = timeoutPromise(fetchPromise(), timeout);
  if (retry > 0) {
    promise = retryRequest(() => promise, retry, retryDelay);
  }

  return promise;
}

// Helper methods for common HTTP methods
export const get = <T>(url: string, options?: RequestOptions) => 
  request<T>(url, { ...options, method: 'GET' });

export const post = <T>(url: string, data?: any, options?: RequestOptions) => 
  request<T>(url, { ...options, method: 'POST', body: data });

export const put = <T>(url: string, data?: any, options?: RequestOptions) => 
  request<T>(url, { ...options, method: 'PUT', body: data });

export const patch = <T>(url: string, data?: any, options?: RequestOptions) => 
  request<T>(url, { ...options, method: 'PATCH', body: data });

export const del = <T>(url: string, options?: RequestOptions) => 
  request<T>(url, { ...options, method: 'DELETE' });