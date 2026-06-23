import dns from 'dns';
import { execFileSync } from 'child_process';
import mongoose from 'mongoose';
import pg from 'pg';

import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import type { DatabaseAdapter, AdapterType } from '@/database/adapter/types';

function ensureDnsServers(): void {
  try {
    const servers = dns.getServers();
    if (servers.length === 1 && servers[0] === '127.0.0.1') {
      const script =
        '(Get-DnsClientServerAddress -AddressFamily IPv4).ServerAddresses | Select-Object -First 1';
      const out = execFileSync('powershell', ['-NoProfile', '-Command', script], {
        encoding: 'utf8',
        timeout: 5000,
      }).trim();
      if (out) {
        dns.setServers([out, '8.8.8.8']);
        logger.debug({ server: out }, 'dns servers reconfigured');
      }
    }
  } catch {
    // best-effort
  }
}

export class MongooseAdapter implements DatabaseAdapter {
  readonly type: AdapterType = 'mongoose';
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  getPool(): pg.Pool {
    throw new Error(
      'getPool() is not available for MongooseAdapter — use PostgreSQL-based adapter',
    );
  }

  getMongooseConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  async connect(): Promise<void> {
    const uri = env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is required for MongooseAdapter');
    }

    ensureDnsServers();

    // Ensure the URI includes a database name — MongoDB driver requires it
    let connectUri = uri;
    if (!connectUri.includes('/?') && !connectUri.match(/\/\w+\?/)) {
      const hasTrailingSlash = connectUri.endsWith('/');
      connectUri = `${connectUri}${hasTrailingSlash ? '' : '/'}chatbot_ai`;
    }
    // Handle case where URI has `?` but no database path (e.g. host/?param=val)
    if (
      connectUri === uri &&
      !connectUri.split('?')[0].endsWith('/') &&
      !connectUri.split('?')[0].includes('/')
    ) {
      const qIndex = connectUri.indexOf('?');
      connectUri =
        qIndex === -1
          ? `${connectUri}/chatbot_ai`
          : `${connectUri.slice(0, qIndex)}/chatbot_ai?${connectUri.slice(qIndex + 1)}`;
    }

    await mongoose.connect(connectUri);
    this._isConnected = true;
    logger.info(
      { uri: connectUri.replace(/\/\/[^@]+@/, '//***@') },
      'database connected (mongodb)',
    );
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    this._isConnected = false;
    logger.info('database disconnected');
  }

  async query(sql: string, _params?: unknown[]): Promise<unknown> {
    logger.warn({ sql }, 'query() called on MongooseAdapter — use Mongoose models directly');
    throw new Error('query() is not supported for MongooseAdapter — use Mongoose models');
  }
}
