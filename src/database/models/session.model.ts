import mongoose, { Schema, type Document } from 'mongoose';
import type { ChatMessage } from '@/ai/types';

export interface ISession extends Document {
  sessionId: string;
  aiModel: string;
  messages: ChatMessage[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
    content: { type: String, required: true },
    toolCallId: { type: String },
    toolName: { type: String },
  },
  { _id: false },
);

const sessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true },
    aiModel: { type: String, required: true },
    messages: { type: [chatMessageSchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'sessions' },
);

export const SessionModel = mongoose.model<ISession>('Session', sessionSchema);
