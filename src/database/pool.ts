import pg from 'pg';

import { logger } from '@/configs/logger';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatbot_ai';

export const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  logger.error({ err }, 'pg pool error');
});
