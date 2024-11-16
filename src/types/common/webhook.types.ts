// // src/types/common/auth.types.ts

// src/types/admin/webhook.types.ts
export type WebhookEventType =
  // Bank Transfer
  | 'transfer.initiated'
  | 'transfer.processing'
  | 'transfer.success'
  | 'transfer.failed'
  | 'transfer.reversed'
  // Bills Payment - Electricity
  | 'electricity.initiated'
  | 'electricity.processing'
  | 'electricity.success'
  | 'electricity.failed'
  // Bills Payment - TV Subscription
  | 'tv.initiated'
  | 'tv.processing'
  | 'tv.success'
  | 'tv.failed'
  // Bills Payment - Data Bundle
  | 'data.initiated'
  | 'data.processing'
  | 'data.success'
  | 'data.failed'
  // Bills Payment - Airtime
  | 'airtime.initiated'
  | 'airtime.processing'
  | 'airtime.success'
  | 'airtime.failed';

// Common response interface for all webhook events
interface BaseWebhookResponse {
  status: string;
  message: string;
  reference: string;
  externalReference?: string;
  amount: string;
  fee?: string;
  channel?: string;
  provider?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Bank Transfer specific response
interface BankTransferResponse extends BaseWebhookResponse {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  narration?: string;
  sessionId?: string;
  transferId?: string;
}

// Electricity specific response
interface ElectricityResponse extends BaseWebhookResponse {
  meterNumber: string;
  disco: string;
  token?: string;
  units?: string;
  address?: string;
}

// TV Subscription specific response
interface TVSubscriptionResponse extends BaseWebhookResponse {
  smartCardNumber: string;
  decoder: string; // e.g., DSTV, GOTV, STARTIMES
  bouquet: string;
  period?: string;
  expiryDate?: string;
}

// Data Bundle specific response
interface DataBundleResponse extends BaseWebhookResponse {
  phoneNumber: string;
  network: string;
  plan: string;
  dataAmount: string;
  validityPeriod?: string;
}

// Airtime specific response
interface AirtimeResponse extends BaseWebhookResponse {
  phoneNumber: string;
  network: string;
  airtimeAmount: string;
  bonusAmount?: string;
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: {
    // Common webhook data
    reference: string;
    externalReference?: string;
    amount: string;
    currency?: string;
    fee?: string;
    provider?: string;
    channel?: string;
    status: string;
    message?: string;
    metadata?: Record<string, any>;
    createdAt: string;

    // Bank Transfer specific data
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
    bankName?: string;
    narration?: string;
    sessionId?: string;
    transferId?: string;

    // Electricity specific data
    meterNumber?: string;
    disco?: string;
    token?: string;
    units?: string;
    address?: string;

    // TV Subscription specific data
    smartCardNumber?: string;
    decoder?: string;
    bouquet?: string;
    period?: string;
    expiryDate?: string;

    // Data Bundle specific data
    phoneNumber?: string;
    network?: string;
    plan?: string;
    dataAmount?: string;
    validityPeriod?: string;

    // Airtime specific data
    airtimeAmount?: string;
    bonusAmount?: string;
  };
  createdAt: Date;
}

// Webhook Provider Response Types
export type WebhookResponse = 
  | BankTransferResponse 
  | ElectricityResponse 
  | TVSubscriptionResponse 
  | DataBundleResponse 
  | AirtimeResponse;

// Webhook Log Status
export type WebhookLogStatus = 'pending' | 'processed' | 'failed' | 'retrying';

// Webhook Log Interface
export interface WebhookLog {
  id: string;
  transactionId: string;
  providerId: string;
  event: WebhookEventType;
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: Record<string, any>;
  responseStatus?: number;
  responseBody?: Record<string, any>;
  processingTime?: number;
  status: WebhookLogStatus;
  errorMessage?: string;
  ipAddress?: string;
  signature?: string;
  retryCount: number;
  lastRetryAt?: Date;
  providerReference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Helper type guards for type checking
export const isBankTransferResponse = (
  response: WebhookResponse
): response is BankTransferResponse => {
  return 'accountNumber' in response;
};

export const isElectricityResponse = (
  response: WebhookResponse
): response is ElectricityResponse => {
  return 'meterNumber' in response;
};

export const isTVSubscriptionResponse = (
  response: WebhookResponse
): response is TVSubscriptionResponse => {
  return 'smartCardNumber' in response;
};

export const isDataBundleResponse = (
  response: WebhookResponse
): response is DataBundleResponse => {
  return 'dataAmount' in response;
};

export const isAirtimeResponse = (
  response: WebhookResponse
): response is AirtimeResponse => {
  return 'airtimeAmount' in response;
};