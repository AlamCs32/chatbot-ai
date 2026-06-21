import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';

import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import type { DatabaseAdapter } from '@/database/adapter/types';

const { Pool } = pg;

export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient | null = null;
  private pool: pg.Pool;
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  constructor() {
    this.pool = new Pool({
      connectionString: env.SUPABASE_DATABASE_URL || env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    });
  }

  getPool(): pg.Pool {
    return this.pool;
  }

  async connect(): Promise<void> {
    if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
    }

    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false },
    });

    this._isConnected = true;
    logger.info('database connected (supabase)');
  }

  async disconnect(): Promise<void> {
    this.client = null;
    await this.pool.end();
    this._isConnected = false;
    logger.info('database disconnected');
  }

  async query(sql: string, params?: unknown[]): Promise<unknown> {
    return this.pool.query(sql, params);
  }
}
