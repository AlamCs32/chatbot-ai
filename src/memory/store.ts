import { MemoryModel } from '@/database/models/memory.model';
import { embeddings } from '@/rag/embeddings';
import { logger } from '@/configs/logger';
import type { UserMemory, MemoryCategory, ExtractedMemory } from '@/memory/types';

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function upsertMemory(
  userId: string,
  category: MemoryCategory,
  key: string,
  value: string,
  confidence: number,
  sourceSessionId: string,
): Promise<void> {
  try {
    const [embedding] = await Promise.all([embeddings.embedQuery(value)]);
    await MemoryModel.updateOne(
      { userId, key },
      {
        $set: {
          category,
          value,
          embedding,
          confidence,
          sourceSessionId,
          lastAccessedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  } catch (err) {
    logger.error({ err, userId, key }, 'memory.upsert failed');
  }
}

export async function bulkUpsertMemories(
  userId: string,
  memories: ExtractedMemory[],
  sourceSessionId: string,
): Promise<void> {
  for (const m of memories) {
    if (m.confidence < 0.3) continue;
    await upsertMemory(userId, m.category, m.key, m.value, m.confidence, sourceSessionId);
  }
}

export async function searchMemories(
  userId: string,
  query: string,
  topK = 8,
): Promise<UserMemory[]> {
  try {
    const [queryEmbedding, allMemories] = await Promise.all([
      embeddings.embedQuery(query),
      MemoryModel.find({ userId }).lean(),
    ]);

    if (allMemories.length === 0) return [];

    const scored = allMemories
      .map((doc) => ({
        memory: doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding ?? []),
      }))
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, topK);

    // update lastAccessedAt for retrieved memories
    const ids = top.map((t) => t.memory._id);
    if (ids.length > 0) {
      await MemoryModel.updateMany({ _id: { $in: ids } }, { $set: { lastAccessedAt: new Date() } });
    }

    return top.map((t) => ({
      userId: t.memory.userId,
      category: t.memory.category as MemoryCategory,
      key: t.memory.key,
      value: t.memory.value,
      confidence: t.memory.confidence,
      sourceSessionId: t.memory.sourceSessionId,
      createdAt: t.memory.createdAt,
      updatedAt: t.memory.updatedAt,
      lastAccessedAt: t.memory.lastAccessedAt,
    }));
  } catch (err) {
    logger.error({ err, userId }, 'memory.search failed');
    return [];
  }
}

export async function deleteMemory(userId: string, key: string): Promise<boolean> {
  try {
    const r = await MemoryModel.deleteOne({ userId, key });
    return r.deletedCount > 0;
  } catch (err) {
    logger.error({ err, userId, key }, 'memory.delete failed');
    return false;
  }
}

export async function deleteUserMemories(userId: string): Promise<void> {
  try {
    await MemoryModel.deleteMany({ userId });
  } catch (err) {
    logger.error({ err, userId }, 'memory.deleteUserMemories failed');
  }
}

export async function getUserMemories(userId: string): Promise<UserMemory[]> {
  try {
    const docs = await MemoryModel.find({ userId }).sort({ updatedAt: -1 }).lean();
    return docs.map((d) => ({
      userId: d.userId,
      category: d.category as MemoryCategory,
      key: d.key,
      value: d.value,
      confidence: d.confidence,
      sourceSessionId: d.sourceSessionId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      lastAccessedAt: d.lastAccessedAt,
    }));
  } catch (err) {
    logger.error({ err, userId }, 'memory.getUserMemories failed');
    return [];
  }
}
