import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { Document } from '@langchain/core/documents';

import { AppDataSource } from '@/database/data-source';
import { DocumentEntity } from '@/database/entities/document.entity';
import { getVectorStore } from '@/rag/vector.store';
import { chunkText } from '@/rag/chunker';

const router = Router();
const repo = () => AppDataSource.getRepository(DocumentEntity);

/**
 * @openapi
 * /api/documents:
 *   post:
 *     summary: Upload a document (saves to DB + chunks + vector store)
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Document title (defaults to "Untitled")
 *               content:
 *                 type: string
 *                 description: Document content
 *     responses:
 *       200:
 *         description: Document created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 chunks:
 *                   type: integer
 *       400:
 *         description: Missing content
 *       503:
 *         description: Database not available
 *   get:
 *     summary: List all documents
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       503:
 *         description: Database not available
 */
router.post('/documents', async (req, res) => {
  const { title, content } = req.body;

  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  if (!AppDataSource.isInitialized) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const id = uuid();
  const docTitle = title || 'Untitled';

  await repo().save({ id, title: docTitle, content });

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
});

router.get('/documents', async (_req, res) => {
  if (!AppDataSource.isInitialized) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const docs = await repo().find({
    select: { id: true, title: true, createdAt: true },
    order: { createdAt: 'DESC' },
  });
  res.json(docs);
});

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     summary: Get a single document with full content
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document data
 *       404:
 *         description: Document not found
 *       503:
 *         description: Database not available
 *   delete:
 *     summary: Delete a document and its vectors
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Document not found
 *       503:
 *         description: Database not available
 */
router.get('/documents/:id', async (req, res) => {
  if (!AppDataSource.isInitialized) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const doc = await repo().findOneBy({ id: req.params.id });
  if (!doc) {
    res.status(404).json({ error: 'document not found' });
    return;
  }
  res.json(doc);
});

router.delete('/documents/:id', async (req, res) => {
  if (!AppDataSource.isInitialized) {
    res.status(503).json({ error: 'database not available' });
    return;
  }

  const doc = await repo().findOneBy({ id: req.params.id });
  if (!doc) {
    res.status(404).json({ error: 'document not found' });
    return;
  }

  await repo().remove(doc);

  try {
    const store = await getVectorStore();
    await store.delete({ filter: { documentId: req.params.id } });
  } catch {
    // best-effort
  }

  res.json({ ok: true });
});

export default router;
