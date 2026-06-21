import crypto from 'node:crypto';
import mongoose from 'mongoose';

import { mongoStore } from '@/sessions/mongo.store';
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

function resolveStore(): SessionStore {
  return mongoose.connection.readyState === 1 ? mongoStore : memoryStore;
}

export const sessionStore: SessionStore = {
  async get(id) {
    return resolveStore().get(id);
  },
  async save(session) {
    return resolveStore().save(session);
  },
  async delete(id) {
    return resolveStore().delete(id);
  },
};

export function createSession(model?: string): Session {
  return {
    id: crypto.randomUUID(),
    model: model || 'google/gemini-2.0-flash-exp:free',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  };
}
