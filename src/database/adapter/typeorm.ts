import { DataSource } from 'typeorm';
import pg from 'pg';

import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import { DocumentEntity } from '@/database/entities/document.entity';
import type { DatabaseAdapter } from '@/database/adapter/types';

const { Pool } = pg;

export class TypeOrmAdapter implements DatabaseAdapter {
  private ds: DataSource;
  private pool: pg.Pool;
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  constructor() {
    this.ds = new DataSource({
      type: 'postgres',
      url: env.DATABASE_URL,
      entities: [DocumentEntity],
      synchronize: true,
      logging: false,
    });
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    });
  }

  getPool(): pg.Pool {
    return this.pool;
  }

  async connect(): Promise<void> {
    await this.ds.initialize();
    this._isConnected = true;
    logger.info('database connected (typeorm)');
  }

  async disconnect(): Promise<void> {
    await this.ds.destroy();
    await this.pool.end();
    this._isConnected = false;
    logger.info('database disconnected');
  }

  async query(sql: string, params?: unknown[]): Promise<unknown> {
    return this.pool.query(sql, params);
  }
}
