import { Request, Response, NextFunction } from 'express';

import { errorLogger } from '../configs/logger';

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  errorLogger.error({
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
