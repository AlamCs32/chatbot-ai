import mongoose from 'mongoose';

import { SessionModel } from '@/database/models/session.model';
import { logger } from '@/configs/logger';
import type { Session, SessionStore } from '@/sessions/types';

export const mongoStore: SessionStore = {
  async get(id: string) {
    if (mongoose.connection.readyState !== 1) {
      logger.warn({ readyState: mongoose.connection.readyState }, 'mongoStore.get — not connected');
      return undefined;
    }

    const doc = await SessionModel.findOne({ sessionId: id }).lean();
    if (!doc) return undefined;

    return {
      id: doc.sessionId,
      model: doc.aiModel,
      messages: doc.messages as Session['messages'],
      metadata: doc.metadata as Record<string, unknown>,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  async save(session: Session) {
    if (mongoose.connection.readyState !== 1) {
      logger.warn(
        { readyState: mongoose.connection.readyState },
        'mongoStore.save — not connected',
      );
      return;
    }

    await SessionModel.updateOne(
      { sessionId: session.id },
      {
        $set: {
          aiModel: session.model,
          messages: session.messages,
          metadata: session.metadata,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  },

  async delete(id: string) {
    if (mongoose.connection.readyState !== 1) return;
    await SessionModel.deleteOne({ sessionId: id });
  },
};
