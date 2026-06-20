import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { logger } from '@/configs/logger';
import { correlationId } from '@/middlewares/correlationId.middleware';
import { errorHandler } from '@/middlewares/errorHandler.middleware';
import { requestLogger } from '@/middlewares/requestLogger.middleware';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(correlationId);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(port, () => {
  logger.info({ port }, 'server started');
});
