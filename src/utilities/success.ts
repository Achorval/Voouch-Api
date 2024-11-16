// src/utilities/success.ts
import { Response } from 'express';

interface SuccessResponseOptions {
  message?: string;
  data?: any;
  meta?: Record<string, any>;
  statusCode?: number;
}

export class SuccessResponse {
  private status: boolean;
  private message?: string;
  private data?: any;
  private meta?: Record<string, any>;
  private statusCode: number;

  constructor(options: SuccessResponseOptions = {}) {
    this.status = true;
    this.statusCode = options.statusCode || 200;
    if (options.message) this.message = options.message;
    if (options.data) this.data = options.data;
    if (options.meta) this.meta = options.meta;
  }

  public send(res: Response): void {
    res.status(this.statusCode).json({
      status: this.status,
      ...(this.message && { message: this.message }),
      ...(this.data && { data: this.data }),
      ...(this.meta && { meta: this.meta })
    });
  }

  static ok(res: Response, options: Omit<SuccessResponseOptions, 'statusCode'> = {}): void {
    new SuccessResponse({ ...options, statusCode: 200 }).send(res);
  }

  static created(res: Response, options: Omit<SuccessResponseOptions, 'statusCode'> = {}): void {
    new SuccessResponse({ ...options, statusCode: 201 }).send(res);
  }

  static accepted(res: Response, options: Omit<SuccessResponseOptions, 'statusCode'> = {}): void {
    new SuccessResponse({ ...options, statusCode: 202 }).send(res);
  }

  static noContent(res: Response): void {
    res.status(204).end();
  }

  static custom(res: Response, statusCode: number, options: Omit<SuccessResponseOptions, 'statusCode'> = {}): void {
    new SuccessResponse({ ...options, statusCode }).send(res);
  }
}
