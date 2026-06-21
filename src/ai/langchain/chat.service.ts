import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage, ToolCall } from '@langchain/core/messages';
import type { ToolDefinition } from '@langchain/core/language_models/base';

import { createLangchainModel } from '@/ai/langchain/models';
import { getAllTools, getTool } from '@/ai/tools/registry';
import { getFallbackChain, getDefaultModelForProvider } from '@/ai/models/registry';
import { retrieveContext } from '@/rag/retriever';
import { memoryStore, createSession } from '@/sessions/memory.store';
import { env } from '@/configs/env';
import type { Session } from '@/sessions/types';
import type { ChatMessage } from '@/ai/types';

function toLangChainMessages(msgs: ChatMessage[]): BaseMessage[] {
  const out: BaseMessage[] = [];

  for (const m of msgs) {
    switch (m.role) {
      case 'system':
        out.push(new SystemMessage(m.content));
        break;
      case 'user':
        out.push(new HumanMessage(m.content));
        break;
      case 'assistant':
        out.push(new AIMessage(m.content));
        break;
      case 'tool':
        out.push(new ToolMessage({ content: m.content, tool_call_id: m.toolCallId! }));
        break;
    }
  }

  return out;
}

function toToolDefinitions(): ToolDefinition[] {
  return getAllTools().map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>,
    },
  }));
}

function findAvailableModel(preferred: string): string | null {
  const candidates = [preferred, ...getFallbackChain(preferred)];
  for (const id of candidates) {
    if (createLangchainModel(id)) return id;
  }
  return null;
}

export async function sendMessage(
  sessionId: string | undefined,
  userMessage: string,
  model?: string,
  provider?: string,
): Promise<{ reply: string; sessionId: string; modelUsed: string }> {
  let session: Session | undefined;
  let isNewSession = false;

  if (sessionId) {
    session = await memoryStore.get(sessionId);
  }

  if (!session) {
    const resolved = provider
      ? getDefaultModelForProvider(provider) || model || env.DEFAULT_MODEL
      : model || env.DEFAULT_MODEL;
    session = createSession(resolved);
    isNewSession = true;
  }

  if (model) {
    session.model = model;
  } else if (provider) {
    session.model = getDefaultModelForProvider(provider) || session.model;
  }

  if (isNewSession) {
    session.messages.push({
      role: 'system',
      content:
        'You are a helpful AI assistant. You remember the full conversation history and use it to provide coherent, context-aware responses.',
    });
    await memoryStore.save(session);
  }

  session.messages.push({ role: 'user', content: userMessage });

  const context = await retrieveContext(userMessage);
  if (context) {
    const ragMsg: ChatMessage = {
      role: 'system',
      content: `Relevant knowledge base context:\n\n${context}`,
    };
    session.messages.push(ragMsg);
  }

  const modelUsed = await runChat(session);

  const reply = [...session.messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

  return { reply, sessionId: session.id, modelUsed };
}

async function runChat(session: Session): Promise<string> {
  const tools = toToolDefinitions();
  const maxTurns = 5;

  for (let turn = 0; turn < maxTurns; turn++) {
    const modelId = findAvailableModel(session.model);
    if (!modelId) throw new Error('no available model');

    const instance = createLangchainModel(modelId)!;
    const messages = toLangChainMessages(session.messages);

    const modelWithTools =
      tools.length > 0 && instance.bindTools ? instance.bindTools(tools) : instance;
    const result = await modelWithTools.invoke(messages);

    const content = typeof result.content === 'string' ? result.content : '';

    const toolCalls = result.tool_calls as ToolCall[] | undefined;

    if (toolCalls && toolCalls.length > 0) {
      session.messages.push({ role: 'assistant', content });

      for (const tc of toolCalls) {
        const tool = getTool(tc.name!);
        if (!tool) continue;

        let output: string;
        try {
          output = await tool.handler((tc.args ?? {}) as Record<string, unknown>);
        } catch {
          output = JSON.stringify({ error: `tool ${tc.name} failed` });
        }

        session.messages.push({
          role: 'tool',
          content: output,
          toolCallId: tc.id!,
        });
      }

      session.model = modelId;
      continue;
    }

    session.messages.push({ role: 'assistant', content });
    session.model = modelId;
    await memoryStore.save(session);

    return modelId;
  }

  throw new Error('max turns exceeded');
}

export async function getHistory(sessionId: string) {
  const session = await memoryStore.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    model: session.model,
    messages: session.messages,
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
