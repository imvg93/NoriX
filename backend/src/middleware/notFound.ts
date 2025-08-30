import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

