import type { Request, Response } from 'express';

import {
  sendMessage,
  sendMessageStream,
  getHistory,
  clearSession,
} from '@/ai/langchain/chat.service';

export async function handleSendMessage(req: Request, res: Response): Promise<void> {
  const { message, sessionId, model, provider, userId } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const result = await sendMessage(sessionId, message, model, provider, userId);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'AI service unavailable', detail: (err as Error).message });
  }
}

export async function handleSendMessageStream(req: Request, res: Response): Promise<void> {
  const { message, sessionId, model, provider, userId } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(':ok\n\n');

  try {
    const { sessionId: newSessionId, modelUsed } = await sendMessageStream(
      sessionId,
      message,
      (token: string) => {
        try {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch {
          /* ignore */
        }
      },
      model,
      provider,
      userId,
    );

    res.write(`data: ${JSON.stringify({ done: true, sessionId: newSessionId, modelUsed })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
    res.end();
  }
}

export async function handleGetHistory(req: Request, res: Response): Promise<void> {
  const history = await getHistory(req.params.sessionId as string);
  if (!history) {
    res.status(404).json({ error: 'session not found' });
    return;
  }
  res.json(history);
}

export async function handleClearSession(req: Request, res: Response): Promise<void> {
  const ok = await clearSession(req.params.sessionId as string);
  res.status(ok ? 200 : 404).json({ ok });
}
