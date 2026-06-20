import { getVectorStore } from '@/rag/vector.store';
import { logger } from '@/configs/logger';

export async function retrieveContext(query: string, topK = 3): Promise<string> {
  try {
    const store = await getVectorStore();
    const results = await store.similaritySearch(query, topK);

    if (results.length === 0) return '';

    const context = results
      .map((r, i) => {
        const title = (r.metadata?.title as string) || 'Untitled';
        return `[${i + 1}] ${title}:\n${r.pageContent}`;
      })
      .join('\n\n---\n\n');

    logger.debug({ query, resultCount: results.length }, 'rag retrieved context');
    return context;
  } catch (err) {
    logger.warn({ err }, 'rag retrieval failed');
    return '';
  }
}
