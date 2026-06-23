import mongoose, { Schema } from 'mongoose';

import type { MemoryCategory } from '@/memory/types';

export interface IMemory extends mongoose.Document {
  userId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  embedding: number[];
  confidence: number;
  sourceSessionId: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

const memorySchema = new Schema<IMemory>(
  {
    userId: { type: String, required: true },
    category: {
      type: String,
      enum: ['profile', 'skill', 'preference', 'project', 'tool', 'context'],
      required: true,
    },
    key: { type: String, required: true },
    value: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    confidence: { type: Number, default: 1.0, min: 0, max: 1 },
    sourceSessionId: { type: String, required: true },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'user_memories' },
);

memorySchema.index({ userId: 1, key: 1 }, { unique: true });
memorySchema.index({ userId: 1 });

export const MemoryModel = mongoose.model<IMemory>('UserMemory', memorySchema);
