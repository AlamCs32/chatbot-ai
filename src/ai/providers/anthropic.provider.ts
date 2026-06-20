import Anthropic from '@anthropic-ai/sdk';

import { aiConfig } from '@/ai/config';
import type { AIProvider, ChatRequest, ChatResponse, ToolCall } from '@/ai/types';
import { RateLimitError } from '@/ai/types';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: aiConfig.anthropic.apiKey,
      baseURL: aiConfig.anthropic.baseUrl,
    });
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const systemMsg = req.messages.find((m) => m.role === 'system');
    const otherMsgs = req.messages.filter((m) => m.role !== 'system');

    const messages = otherMsgs.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'user' as const,
          content: [
            { type: 'tool_result' as const, tool_use_id: m.toolCallId!, content: m.content },
          ],
        };
      }
      if (m.role === 'assistant' && m.toolName) {
        return {
          role: 'assistant' as const,
          content: [
            {
              type: 'tool_use' as const,
              id: m.toolCallId!,
              name: m.toolName,
              input: JSON.parse(m.content),
            },
          ],
        };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

    const tools = req.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));

    try {
      const res = await this.client.messages.create({
        model: req.model,
        system: systemMsg?.content,
        messages: messages as Anthropic.MessageParam[],
        tools,
        max_tokens: 4096,
      });

      const contentBlock = res.content.find((c) => c.type === 'text');
      const content = contentBlock?.type === 'text' ? contentBlock.text : null;

      const toolCalls: ToolCall[] = res.content
        .filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')
        .map((tc) => ({
          id: tc.id,
          name: tc.name,
          args: tc.input as Record<string, unknown>,
        }));

      return { content, toolCalls };
    } catch (err: unknown) {
      if (err instanceof Anthropic.RateLimitError) {
        throw new RateLimitError(req.model);
      }
      throw err;
    }
  }
}
