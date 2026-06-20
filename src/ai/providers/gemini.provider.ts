import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FunctionDeclarationSchema } from '@google/generative-ai';

import { aiConfig } from '@/ai/config';
import type { AIProvider, ChatRequest, ChatResponse, ToolCall } from '@/ai/types';
import { RateLimitError } from '@/ai/types';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const contents = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : ('user' as const),
        parts: [{ text: m.content }],
      }));

    const systemInstruction = req.messages.find((m) => m.role === 'system')?.content;

    const tools = req.tools?.map((t) => ({
      functionDeclarations: [
        {
          name: t.name,
          description: t.description,
          parameters: t.parameters as FunctionDeclarationSchema,
        },
      ],
    }));

    try {
      const model = this.client.getGenerativeModel({ model: req.model });
      const result = await model.generateContent({
        contents,
        systemInstruction: systemInstruction
          ? { role: 'user', parts: [{ text: systemInstruction }] }
          : undefined,
        tools,
      });

      const candidate = result.response.candidates?.[0];
      const content = candidate?.content?.parts?.find((p) => 'text' in p)?.text ?? null;

      const toolCalls: ToolCall[] =
        candidate?.content?.parts
          ?.filter((p) => 'functionCall' in p)
          .map((p) => ({
            id: (p as { functionCall: { name: string; args: object } }).functionCall.name,
            name: (p as { functionCall: { name: string; args: object } }).functionCall.name,
            args: (p as { functionCall: { name: string; args: object } }).functionCall
              .args as Record<string, unknown>,
          })) ?? [];

      return { content, toolCalls };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.toLowerCase().includes('rate')) {
        throw new RateLimitError(req.model);
      }
      throw err;
    }
  }
}
