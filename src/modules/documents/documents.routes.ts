import { Router } from 'express';

import {
  handleCreateDocument,
  handleListDocuments,
  handleGetDocument,
  handleDeleteDocument,
} from '@/modules/documents/documents.controller';

const router = Router();

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
 *               content:
 *                 type: string
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
router.post('/documents', handleCreateDocument);
router.get('/documents', handleListDocuments);

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
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 *       503:
 *         description: Database not available
 */
router.get('/documents/:id', handleGetDocument);
router.delete('/documents/:id', handleDeleteDocument);

export default router;
