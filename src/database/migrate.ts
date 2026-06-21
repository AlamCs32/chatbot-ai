import { adapter } from '@/database/adapter';
import { logger } from '@/configs/logger';

export async function migrate(): Promise<void> {
  await adapter.connect();

  try {
    await adapter.query('CREATE EXTENSION IF NOT EXISTS vector');
  } catch (err) {
    logger.warn({ err }, 'vector extension not available — RAG features disabled');
  }

  logger.info('database migrated');
}
