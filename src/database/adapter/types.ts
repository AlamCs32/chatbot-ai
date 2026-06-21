import type pg from 'pg';

export interface DatabaseAdapter {
  readonly isConnected: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  getPool(): pg.Pool;

  query(sql: string, params?: unknown[]): Promise<unknown>;
}
