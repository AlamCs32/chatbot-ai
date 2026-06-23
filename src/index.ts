import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from '@/configs/swagger';
import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import { correlationId } from '@/middlewares/correlationId.middleware';
import { errorHandler } from '@/middlewares/errorHandler.middleware';
import { requestLogger } from '@/middlewares/requestLogger.middleware';
import { migrate } from '@/database/migrate';
import appRoutes from '@/routes';

const app = express();
const port = env.PORT;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(correlationId);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(appRoutes);
app.use(errorHandler);

async function start() {
  let dbConnected = false;
  try {
    await migrate();
    dbConnected = true;
  } catch (err) {
    logger.error(
      { err, adapter: env.DATABASE_ADAPTER },
      'database migration failed — sessions will use in-memory storage only and NOT persist across restarts',
    );
  }

  app.listen(port, () => {
    logger.info({ port, dbConnected }, 'server started');
  });
}

export { app };

start();
