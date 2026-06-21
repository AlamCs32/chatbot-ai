import { AppDataSource } from '@/database/data-source';
import { pool } from '@/database/pool';
import { logger } from '@/configs/logger';

export async function migrate(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  } catch (err) {
    logger.warn({ err }, 'vector extension not available — RAG features disabled');
  }

  logger.info('database migrated');
}
