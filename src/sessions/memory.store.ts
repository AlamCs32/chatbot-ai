import crypto from 'node:crypto';

import { env } from '@/configs/env';
import { mongoStore } from '@/sessions/mongo.store';
import { logger } from '@/configs/logger';
import type { Session, SessionStore } from '@/sessions/types';

const sessions = new Map<string, Session>();

const memoryStore: SessionStore = {
  async get(id: string) {
    return sessions.get(id);
  },

  async save(session: Session) {
    session.updatedAt = new Date();
    sessions.set(session.id, session);
  },

  async delete(id: string) {
    sessions.delete(id);
  },
};

const useMongo = env.DATABASE_ADAPTER === 'mongoose';

export const sessionStore: SessionStore = {
  async get(id) {
    const fromMemory = await memoryStore.get(id);
    if (fromMemory) return fromMemory;

    if (useMongo) {
      try {
        const fromMongo = await mongoStore.get(id);
        if (fromMongo) {
          await memoryStore.save(fromMongo);
          return fromMongo;
        }
      } catch (err) {
        logger.warn({ err, sessionId: id }, 'failed to read session from mongo, using memory only');
      }
    }

    return undefined;
  },

  async save(session) {
    await memoryStore.save(session);

    if (useMongo) {
      try {
        await mongoStore.save(session);
      } catch (err) {
        logger.warn(
          { err, sessionId: session.id },
          'failed to save session to mongo, memory copy safe',
        );
      }
    }
  },

  async delete(id) {
    await memoryStore.delete(id);

    if (useMongo) {
      try {
        await mongoStore.delete(id);
      } catch (err) {
        logger.warn({ err, sessionId: id }, 'failed to delete session from mongo');
      }
    }
  },
};

export function createSession(model?: string, id?: string): Session {
  return {
    id: id || crypto.randomUUID(),
    model: model || 'google/gemini-2.0-flash-exp:free',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  };
}
