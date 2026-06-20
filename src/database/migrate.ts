import { AppDataSource } from '@/database/data-source';
import { pool } from '@/database/pool';
import { logger } from '@/configs/logger';

export async function migrate(): Promise<void> {
  await AppDataSource.initialize();

  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

  logger.info('database migrated');
}
