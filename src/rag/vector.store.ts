import type { Collection } from 'mongodb';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { embeddings } from '@/rag/embeddings';
import { adapter } from '@/database/adapter';

let pgStore: PGVectorStore | null = null;
let mongoStore: MongoDBAtlasVectorSearch | null = null;

export async function getVectorStore(): Promise<PGVectorStore | MongoDBAtlasVectorSearch> {
  if (adapter.type === 'mongoose') {
    if (mongoStore) return mongoStore;

    const conn = adapter.getMongooseConnection();
    const collection = conn.db!.collection('documents_vectors') as unknown as Collection;

    mongoStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection,
      indexName: 'vector_index',
      textKey: 'text',
      embeddingKey: 'embedding',
    });

    return mongoStore;
  }

  if (pgStore) return pgStore;

  pgStore = await PGVectorStore.initialize(embeddings, {
    pool: adapter.getPool(),
    tableName: 'documents_vectors',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
    },
    dimensions: 1536,
  });

  return pgStore;
}

export async function closeVectorStore(): Promise<void> {
  if (pgStore) {
    await pgStore.end();
    pgStore = null;
  }
  mongoStore = null;
}
