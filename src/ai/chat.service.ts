import { chatWithFallback } from '@/ai/models/router';
import { getAllTools, getTool } from '@/ai/tools/registry';
import type { ChatMessage } from '@/ai/types';
import { memoryStore, createSession } from '@/sessions/memory.store';
import type { Session } from '@/sessions/types';

export async function sendMessage(
  sessionId: string | undefined,
  userMessage: string,
  model?: string,
): Promise<{ reply: string; sessionId: string; modelUsed: string }> {
  let session: Session | undefined;

  if (sessionId) {
    session = await memoryStore.get(sessionId);
  }

  if (!session) {
    session = createSession(model);
  }

  if (model) {
    session.model = model;
  }

  const userMsg: ChatMessage = { role: 'user', content: userMessage };
  session.messages.push(userMsg);

  const tools = getAllTools();

  const { response, modelUsed } = await chatWithFallback({
    messages: session.messages,
    model: session.model,
    tools,
  });

  // Handle tool calls
  if (response.toolCalls.length > 0) {
    const toolResults: ChatMessage[] = [];

    for (const tc of response.toolCalls) {
      const tool = getTool(tc.name);
      if (!tool) continue;

      const result = await tool.handler(tc.args);
      toolResults.push({
        role: 'assistant',
        content: JSON.stringify(tc.args),
        toolCallId: tc.id,
        toolName: tc.name,
      });
      toolResults.push({
        role: 'tool',
        content: result,
        toolCallId: tc.id,
      });
    }

    session.messages.push(...toolResults);

    const { response: finalResponse } = await chatWithFallback({
      messages: session.messages,
      model: modelUsed,
    });

    const reply = finalResponse.content ?? '';
    session.messages.push({ role: 'assistant', content: reply });
    session.model = modelUsed;
    await memoryStore.save(session);

    return { reply, sessionId: session.id, modelUsed };
  }

  const reply = response.content ?? '';
  session.messages.push({ role: 'assistant', content: reply });
  session.model = modelUsed;
  await memoryStore.save(session);

  return { reply, sessionId: session.id, modelUsed };
}

export async function getHistory(sessionId: string) {
  const session = await memoryStore.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    model: session.model,
    messages: session.messages.filter((m) => m.role !== 'system'),
    createdAt: session.createdAt,
  };
}

export async function clearSession(sessionId: string): Promise<boolean> {
  const session = await memoryStore.get(sessionId);
  if (!session) return false;
  session.messages = [];
  await memoryStore.save(session);
  return true;
}
