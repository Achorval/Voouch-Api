// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ErrorResponse } from '../utilities/error';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Get the first error message
        const firstError = error.errors[0];
        const message = firstError.message;
        
        // Create error response with just the message
        const errorResponse = ErrorResponse.badRequest(message);
        errorResponse.send(res);
        return;
      }
      return next(error);
    }
  };
};