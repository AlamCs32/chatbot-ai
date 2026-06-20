import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { logger } from '@/configs/logger';
import { correlationId } from '@/middlewares/correlationId.middleware';
import { errorHandler } from '@/middlewares/errorHandler.middleware';
import { requestLogger } from '@/middlewares/requestLogger.middleware';
import chatRoutes from '@/routes/chat.routes';
import documentRoutes from '@/routes/documents.routes';
import { migrate } from '@/database/migrate';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(correlationId);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', chatRoutes);
app.use('/api', documentRoutes);

app.use(errorHandler);

async function start() {
  try {
    await migrate();
  } catch (err) {
    logger.warn({ err }, 'database migration failed — running without db');
  }

  app.listen(port, () => {
    logger.info({ port }, 'server started');
  });
}

start();
