// src/utilities/error.ts
import { Response } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: boolean;
  isOperational: boolean;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = false; // Always false for errors
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  public send(res: Response): void {
    res.status(this.statusCode).json({
      status: this.status,
      message: this.message,
      ...(this.errors && { errors: this.errors })
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors: Record<string, string[]>) {
    super(message, 400);
    this.errors = errors;
  }
}

// Helper functions for common errors
export class ErrorResponse {
  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static tooMany(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500);
  }
}