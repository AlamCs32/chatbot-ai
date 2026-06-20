import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

import { asyncCtx, childLogger } from '@/configs/logger';

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  res.setHeader('x-request-id', requestId);

  asyncCtx.run({ requestId }, () => {
    childLogger({ requestId }).debug(
      { ip: req.ip, method: req.method, url: req.originalUrl },
      'incoming request',
    );
    next();
  });
}
