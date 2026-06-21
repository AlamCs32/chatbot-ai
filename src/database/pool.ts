import pg from 'pg';

import { env } from '@/configs/env';
import { logger } from '@/configs/logger';

const { Pool } = pg;

const connectionString = env.DATABASE_URL;

export const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  logger.error({ err }, 'pg pool error');
});
