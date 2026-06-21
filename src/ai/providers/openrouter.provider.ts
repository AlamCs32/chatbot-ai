import OpenAI from 'openai';

import type { AIProvider, ChatRequest, ChatResponse, ToolCall } from '@/ai/types';
import { ProviderError } from '@/ai/types';
import { env } from '@/configs/env';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE,
      defaultHeaders: {
        'HTTP-Referer': env.APP_URL,
        'X-Title': env.APP_NAME,
      },
    });
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const messages = req.messages.map((m) => {
      if (m.role === 'tool') {
        return { role: 'tool' as const, content: m.content, tool_call_id: m.toolCallId! };
      }
      return { role: m.role as 'user' | 'assistant' | 'system', content: m.content };
    });

    const tools = req.tools?.map((t) => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    try {
      const res = await this.client.chat.completions.create({
        model: req.model,
        messages,
        tools: tools?.length ? tools : undefined,
      });

      const choice = res.choices[0];
      if (!choice) throw new ProviderError('openrouter', req.model, 'no response');

      const content = choice.message.content;

      const toolCalls: ToolCall[] = (choice.message.tool_calls ?? []).map((tc) => {
        const fc = tc as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;
        return {
          id: fc.id,
          name: fc.function.name,
          args: JSON.parse(fc.function.arguments),
        };
      });

      return { content, toolCalls };
    } catch (err: unknown) {
      if (err instanceof OpenAI.RateLimitError) {
        throw new ProviderError('openrouter', req.model, 'rate limit exceeded');
      }
      throw err;
    }
  }
}
