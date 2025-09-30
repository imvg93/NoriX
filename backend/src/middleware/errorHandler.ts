import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Custom error class
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Authentication error class
export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

// Authorization error class
export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

// Not found error class
export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

// Duplicate key error class
export class DuplicateKeyError extends CustomError {
  constructor(message: string = 'Duplicate key error') {
    super(message, 409);
  }
}

// Rate limit error class
export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

// Main error handler middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Concise logging + stack for server-side diagnosis
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] ${req.method} ${req.url} -> ${err.message}`);
  if (process.env.NODE_ENV !== 'test') {
    if ((err as any).stack) {
      console.error(`[${timestamp}] Stack:`, (err as any).stack);
    }
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    const message = `${field} already exists`;
    error = new DuplicateKeyError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(', ');
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      error = new ValidationError('File too large');
    } else if ((err as any).code === 'LIMIT_FILE_COUNT') {
      error = new ValidationError('Too many files');
    } else if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
      error = new ValidationError('Unexpected file field');
    } else {
      error = new ValidationError('File upload error');
    }
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Unified, user-friendly error response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' ? { error: { name: err.name } } : {})
  });
};

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error formatter
export const formatValidationErrors = (errors: any): string[] => {
  const formattedErrors: string[] = [];
  
  for (const field in errors) {
    if (errors.hasOwnProperty(field)) {
      const error = errors[field];
      if (error.message) {
        formattedErrors.push(`${field}: ${error.message}`);
      }
    }
  }
  
  return formattedErrors;
};

// Error response helper
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  details?: any
): void => {
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(details && { details })
    }
  });
};

// Success response helper
export const sendSuccessResponse = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    statusCode,
    data,
    ...(process.env.NODE_ENV !== 'production' ? { meta: { timestamp: new Date().toISOString() } } : {})
  });
};
