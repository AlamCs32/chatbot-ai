import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Document } from '@langchain/core/documents';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import type { PGVectorStore } from '@langchain/community/vectorstores/pgvector';

import { adapter } from '@/database/adapter';
import { documentRepo } from '@/database/repositories';
import { getVectorStore } from '@/rag/vector.store';
import { chunkText } from '@/rag/chunker';

export async function handleCreateDocument(req: Request, res: Response): Promise<void> {
  const { title, content } = req.body;

  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  if (!adapter.isConnected) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const id = uuid();
  const docTitle = title || 'Untitled';

  await documentRepo.create({ id, title: docTitle, content, metadata: {} });

  const chunks = chunkText(content, docTitle);
  const docs = chunks.map(
    (c) =>
      new Document({
        pageContent: c.content,
        metadata: { ...c.metadata, documentId: id },
      }),
  );
  const store = await getVectorStore();
  await store.addDocuments(docs);

  res.json({ id, title: docTitle, chunks: chunks.length });
}

export async function handleListDocuments(_req: Request, res: Response): Promise<void> {
  if (!adapter.isConnected) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const docs = await documentRepo.list();
  res.json(docs);
}

export async function handleGetDocument(req: Request, res: Response): Promise<void> {
  if (!adapter.isConnected) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const doc = await documentRepo.getById(req.params.id as string);
  if (!doc) {
    res.status(404).json({ error: 'document not found' });
    return;
  }
  res.json(doc);
}

export async function handleDeleteDocument(req: Request, res: Response): Promise<void> {
  if (!adapter.isConnected) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const ok = await documentRepo.delete(req.params.id as string);
  if (!ok) {
    res.status(404).json({ error: 'document not found' });
    return;
  }

  try {
    const store = await getVectorStore();
    if (adapter.type === 'mongoose') {
      await (store as MongoDBAtlasVectorSearch).delete({ ids: [req.params.id as string] });
    } else {
      await (store as PGVectorStore).delete({ filter: { documentId: req.params.id as string } });
    }
  } catch {
    // best-effort
  }

  res.json({ ok: true });
}
