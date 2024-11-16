// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utilities/error";
import { env } from "../config/env";

export const notFound = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  // Create an error object with a message indicating the requested route was not found
  const error = new Error(`Not found - ${request.originalUrl}`);

  // Set the HTTP status code of the response to 404 (Not Found)
  response.status(404);

  // Pass the error to the next middleware or error handler
  next(error);
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err);

  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      status: false,
      message: err.message,
      errors: err.errors
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: false,
      message: err.message
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    status: false,
    message: env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
};
