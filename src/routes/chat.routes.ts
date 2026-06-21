import { Router } from 'express';

import { sendMessage, getHistory, clearSession } from '@/ai/langchain/chat.service';
import { models } from '@/ai/models/registry';

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
 *                 description: The user message
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID to continue a conversation
 *               model:
 *                 type: string
 *                 description: Optional model identifier override
 *               provider:
 *                 type: string
 *                 enum: [openai, anthropic, gemini, openrouter]
 *                 description: Provider to use (picks default model for the provider)
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
router.post('/chat', async (req, res) => {
  const { message, sessionId, model, provider } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const result = await sendMessage(sessionId, message, model, provider);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'AI service unavailable', detail: (err as Error).message });
  }
});

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
 *         description: Session ID
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
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Session not found
 */
router.get('/chat/:sessionId', async (req, res) => {
  const history = await getHistory(req.params.sessionId);
  if (!history) {
    res.status(404).json({ error: 'session not found' });
    return;
  }
  res.json(history);
});

router.delete('/chat/:sessionId', async (req, res) => {
  const ok = await clearSession(req.params.sessionId);
  res.status(ok ? 200 : 404).json({ ok });
});

/**
 * @openapi
 * /api/models:
 *   get:
 *     summary: List enabled AI models
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/models', (_req, res) => {
  res.json(models.filter((m) => m.enabled));
});

export default router;
