import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage, ToolCall } from '@langchain/core/messages';
import type { ToolDefinition } from '@langchain/core/language_models/base';

import { createLangchainModel } from '@/ai/langchain/models';
import { getAllTools, getTool } from '@/ai/tools/registry';
import { getFallbackChain, getDefaultModelForProvider } from '@/ai/models/registry';
import { retrieveContext } from '@/rag/retriever';
import { sessionStore, createSession } from '@/sessions/memory.store';
import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import { searchMemories, bulkUpsertMemories } from '@/memory/store';
import { formatMemoriesForPrompt } from '@/memory/retriever';
import { extractMemories } from '@/memory/extractor';
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
  userId?: string,
): Promise<{ reply: string; sessionId: string; modelUsed: string }> {
  let session: Session | undefined;
  let isNewSession = false;

  if (sessionId) {
    session = await sessionStore.get(sessionId);
    if (!session) {
      logger.warn({ sessionId }, 'SESSION DEBUG: provided sessionId NOT FOUND in store');
    }
  }

  if (!session) {
    const resolved = provider
      ? getDefaultModelForProvider(provider) || model || env.DEFAULT_MODEL
      : model || env.DEFAULT_MODEL;
    session = createSession(resolved, sessionId);
    isNewSession = true;
  }

  if (model) {
    session.model = model;
  } else if (provider) {
    session.model = getDefaultModelForProvider(provider) || session.model;
  }

  let memoriesText = '';
  if (userId) {
    const memories = await searchMemories(userId, userMessage, env.MEMORY_RETRIEVAL_COUNT);
    memoriesText = formatMemoriesForPrompt(memories);
  }

  if (isNewSession) {
    session.messages.push({
      role: 'system',
      content:
        'You are a helpful AI assistant. You remember the full conversation history and use it to provide coherent, context-aware responses.',
    });
    await sessionStore.save(session);
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

  const modelUsed = await runChat(session, memoriesText);

  const reply = [...session.messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

  if (userId && reply) {
    const extracted = await extractMemories(userMessage, reply);
    if (extracted.length > 0) {
      await bulkUpsertMemories(userId, extracted, session.id);
    }
  }

  return { reply, sessionId: session.id, modelUsed };
}

async function runChat(session: Session, memoriesText?: string): Promise<string> {
  const tools = toToolDefinitions();
  const maxTurns = 5;

  for (let turn = 0; turn < maxTurns; turn++) {
    const modelId = findAvailableModel(session.model);
    if (!modelId) throw new Error('no available model');

    const instance = createLangchainModel(modelId)!;
    const messages = toLangChainMessages(session.messages);

    if (memoriesText) {
      messages.unshift(new SystemMessage(memoriesText));
    }

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
    await sessionStore.save(session);

    return modelId;
  }

  throw new Error('max turns exceeded');
}

export async function sendMessageStream(
  sessionId: string | undefined,
  userMessage: string,
  onToken: (token: string) => void,
  model?: string,
  provider?: string,
  userId?: string,
): Promise<{ sessionId: string; modelUsed: string }> {
  let session: Session | undefined;
  let isNewSession = false;

  if (sessionId) {
    session = await sessionStore.get(sessionId);
    if (!session) {
      logger.warn({ sessionId }, 'SESSION DEBUG: provided sessionId NOT FOUND in store');
    }
  }

  if (!session) {
    const resolved = provider
      ? getDefaultModelForProvider(provider) || model || env.DEFAULT_MODEL
      : model || env.DEFAULT_MODEL;
    session = createSession(resolved, sessionId);
    isNewSession = true;
  }

  if (model) {
    session.model = model;
  } else if (provider) {
    session.model = getDefaultModelForProvider(provider) || session.model;
  }

  let memoriesText = '';
  if (userId) {
    const memories = await searchMemories(userId, userMessage, env.MEMORY_RETRIEVAL_COUNT);
    memoriesText = formatMemoriesForPrompt(memories);
  }

  if (isNewSession) {
    session.messages.push({
      role: 'system',
      content:
        'You are a helpful AI assistant. You remember the full conversation history and use it to provide coherent, context-aware responses.',
    });
    await sessionStore.save(session);
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

  const modelUsed = await runChatStream(session, onToken, memoriesText);

  const reply = [...session.messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

  if (userId && reply) {
    const extracted = await extractMemories(userMessage, reply);
    if (extracted.length > 0) {
      await bulkUpsertMemories(userId, extracted, session.id);
    }
  }

  return { sessionId: session.id, modelUsed };
}

async function runChatStream(
  session: Session,
  onToken: (token: string) => void,
  memoriesText?: string,
): Promise<string> {
  const tools = toToolDefinitions();
  const maxTurns = 5;

  for (let turn = 0; turn < maxTurns; turn++) {
    const modelId = findAvailableModel(session.model);
    if (!modelId) throw new Error('no available model');

    const instance = createLangchainModel(modelId)!;
    const lcMessages = toLangChainMessages(session.messages);

    if (memoriesText) {
      lcMessages.unshift(new SystemMessage(memoriesText));
    }

    const modelWithTools =
      tools.length > 0 && instance.bindTools ? instance.bindTools(tools) : instance;

    if (tools.length > 0) {
      const result = await modelWithTools.invoke(lcMessages);
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
    }

    const stream = await modelWithTools.stream(lcMessages);
    let fullContent = '';
    for await (const chunk of stream) {
      const chunkContent = typeof chunk.content === 'string' ? chunk.content : '';
      fullContent += chunkContent;
      onToken(chunkContent);
    }

    session.messages.push({ role: 'assistant', content: fullContent });
    session.model = modelId;
    await sessionStore.save(session);

    return modelId;
  }

  throw new Error('max turns exceeded');
}

export async function getHistory(sessionId: string) {
  const session = await sessionStore.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    model: session.model,
    messages: session.messages,
    createdAt: session.createdAt,
  };
}

export async function clearSession(sessionId: string): Promise<boolean> {
  const session = await sessionStore.get(sessionId);
  if (!session) return false;
  session.messages = [];
  await sessionStore.save(session);
  return true;
}
