import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { embeddings } from '@/rag/embeddings';
import { pool } from '@/database/pool';

let store: PGVectorStore | null = null;

export async function getVectorStore(): Promise<PGVectorStore> {
  if (store) return store;

  store = await PGVectorStore.initialize(embeddings, {
    pool,
    tableName: 'documents_vectors',
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
    },
    dimensions: 1536,
  });

  return store;
}

export async function closeVectorStore(): Promise<void> {
  if (store) {
    await store.end();
    store = null;
  }
}
