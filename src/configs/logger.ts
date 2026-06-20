import fs from 'node:fs';
import path from 'node:path';

import pino from 'pino';
import { createStream } from 'rotating-file-stream';

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

export const logger =
  process.env.NODE_ENV === 'production'
    ? pino(
        {
          level: process.env.LOG_LEVEL || 'info',
          timestamp: pino.stdTimeFunctions.isoTime,
        },
        appLogStream,
      )
    : pino({
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
      });

export const errorLogger = pino(
  {
    level: 'error',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  errorLogStream,
);
