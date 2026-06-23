import { Router } from 'express';

import {
  handleSendMessage,
  handleSendMessageStream,
  handleGetHistory,
  handleClearSession,
} from '@/modules/chat/chat.controller';

const router = Router();

/**
 * @openapi
 * /api/chat:
 *   post:
 *     summary: Send a message to the AI chatbot
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               model:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [openai, anthropic, gemini, openrouter]
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 modelUsed:
 *                   type: string
 *       400:
 *         description: Missing message
 *       503:
 *         description: AI service unavailable
 */
router.post('/chat', handleSendMessage);

/**
 * @openapi
 * /api/chat/stream:
 *   post:
 *     summary: Send a message and receive a streaming (SSE) response
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               model:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [openai, anthropic, gemini, openrouter]
 *     responses:
 *       200:
 *         description: SSE stream of tokens
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Missing message
 *       503:
 *         description: AI service unavailable
 */
router.post('/chat/stream', handleSendMessageStream);

/**
 * @openapi
 * /api/chat/{sessionId}:
 *   get:
 *     summary: Get chat history for a session
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history
 *       404:
 *         description: Session not found
 *   delete:
 *     summary: Clear (reset) a chat session
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session cleared
 *       404:
 *         description: Session not found
 */
router.get('/chat/:sessionId', handleGetHistory);
router.delete('/chat/:sessionId', handleClearSession);

export default router;
