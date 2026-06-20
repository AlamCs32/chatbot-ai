import { Router } from 'express';

import { sendMessage, getHistory, clearSession } from '@/ai/langchain/chat.service';
import { models } from '@/ai/models/registry';

const router = Router();

router.post('/chat', async (req, res) => {
  const { message, sessionId, model } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const result = await sendMessage(sessionId, message, model);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'AI service unavailable', detail: (err as Error).message });
  }
});

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

router.get('/models', (_req, res) => {
  res.json(models.filter((m) => m.enabled));
});

export default router;
