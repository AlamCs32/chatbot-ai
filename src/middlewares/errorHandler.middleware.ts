import type { Request, Response, NextFunction } from 'express';

import { childErrorLogger } from '@/configs/logger';

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  childErrorLogger({ err: error, method: req.method, url: req.originalUrl }).error(
    'internal server error',
  );

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
