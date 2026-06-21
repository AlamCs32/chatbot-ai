import type pg from 'pg';
import type mongoose from 'mongoose';

export type AdapterType = 'typeorm' | 'supabase' | 'mongoose';

export interface DatabaseAdapter {
  readonly type: AdapterType;
  readonly isConnected: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  /** Returns the pg.Pool. Throws if adapter is not PostgreSQL-based. */
  getPool(): pg.Pool;

  /** Returns the Mongoose connection. Throws if adapter is not MongoDB-based. */
  getMongooseConnection(): mongoose.Connection;

  query(sql: string, params?: unknown[]): Promise<unknown>;
}
