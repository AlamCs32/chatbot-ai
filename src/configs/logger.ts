import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';

import pino from 'pino';
import { createStream } from 'rotating-file-stream';

import { env } from '@/configs/env';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export const asyncCtx = new AsyncLocalStorage<LogContext>();

const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const appLogStream = createStream('app.log', {
  interval: '1d',
  size: '10M',
  compress: 'gzip',
  maxFiles: 30,
  path: logDir,
});

const errorLogStream = createStream('error.log', {
  interval: '1d',
  size: '10M',
  compress: 'gzip',
  maxFiles: 30,
  path: logDir,
});

const serializers = {
  req: pino.stdSerializers.req,
  res: pino.stdSerializers.res,
  err: pino.stdSerializers.err,
};

const redactConfig: pino.redactOptions = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'password',
    'token',
    'secret',
    'creditCard',
    'ssn',
  ],
  censor: '[REDACTED]',
};

const baseConfig: pino.LoggerOptions = {
  serializers,
  redact: redactConfig,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: env.SERVICE_NAME,
    env: env.NODE_ENV,
  },
};

function createBaseLogger(): pino.Logger {
  if (env.NODE_ENV === 'production') {
    return pino(
      {
        ...baseConfig,
        level: env.LOG_LEVEL,
      },
      appLogStream,
    );
  }

  return pino({
    ...baseConfig,
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,service,env',
      },
    },
  });
}

export const logger = createBaseLogger();

export const errorLogger = pino(
  {
    ...baseConfig,
    level: 'error',
  },
  errorLogStream,
);

export function childLogger(bindings: Record<string, unknown>): pino.Logger {
  return logger.child({ ...asyncCtx.getStore(), ...bindings });
}

export function childErrorLogger(bindings: Record<string, unknown>): pino.Logger {
  return errorLogger.child({ ...asyncCtx.getStore(), ...bindings });
}
