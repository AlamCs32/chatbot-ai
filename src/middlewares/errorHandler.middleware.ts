import type { Request, Response, NextFunction } from 'express';

import { childErrorLogger } from '@/configs/logger';
import { env } from '@/configs/env';
import { ProviderError, RateLimitError } from '@/ai/types';

const isDev = env.NODE_ENV === 'development';

function statusFromError(error: Error): number {
  if (error instanceof RateLimitError) return 429;
  if (error instanceof ProviderError) return 503;
  if (error.name === 'EntityNotFoundError') return 404;
  if (error.name === 'QueryFailedError') return 409;
  if (error instanceof SyntaxError) return 400;
  return 500;
}

function bodyFromError(error: Error, status: number) {
  const body: Record<string, unknown> = { success: false };

  if (status === 429) {
    body.message = 'Rate limit exceeded. Please try again later.';
  } else if (status === 503) {
    body.message = 'AI service unavailable';
    body.detail = error.message;
  } else if (status === 404) {
    body.message = 'Resource not found';
  } else if (status === 400) {
    body.message = 'Invalid request';
  } else {
    body.message = 'Internal Server Error';
  }

  if (isDev) {
    body.error = error.message;
    body.stack = error.stack;
  }

  return body;
}

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  const status = statusFromError(error);
  const body = bodyFromError(error, status);

  childErrorLogger({ err: error, method: req.method, url: req.originalUrl })[
    status >= 500 ? 'error' : 'warn'
  ](body.message);

  res.status(status).json(body);
}
