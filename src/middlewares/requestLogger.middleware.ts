import type { Request, Response, NextFunction } from 'express';

import { childLogger } from '@/configs/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const log = childLogger({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (res.statusCode >= 500) {
      log.error('request failed');
    } else if (res.statusCode >= 400) {
      log.warn('request warning');
    } else {
      log.info('request completed');
    }
  });

  next();
}
