import { SessionModel } from '@/database/models/session.model';
import type { Session, SessionStore } from '@/sessions/types';

export const mongoStore: SessionStore = {
  async get(id: string) {
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
    await SessionModel.deleteOne({ sessionId: id });
  },
};
