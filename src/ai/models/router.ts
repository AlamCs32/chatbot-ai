import { aiConfig } from '@/ai/config';
import { getFallbackChain, getModel } from '@/ai/models/registry';
import { AnthropicProvider } from '@/ai/providers/anthropic.provider';
import { GeminiProvider } from '@/ai/providers/gemini.provider';
import { OpenAIProvider } from '@/ai/providers/openai.provider';
import { OpenRouterProvider } from '@/ai/providers/openrouter.provider';
import type { AIProvider, ChatRequest, ChatResponse } from '@/ai/types';
import { RateLimitError } from '@/ai/types';

const providerConstructors: Record<string, () => AIProvider | undefined> = {
  openai: () => (aiConfig.openai.apiKey ? new OpenAIProvider() : undefined),
  anthropic: () => (aiConfig.anthropic.apiKey ? new AnthropicProvider() : undefined),
  gemini: () => (aiConfig.gemini.apiKey ? new GeminiProvider() : undefined),
  openrouter: () =>
    aiConfig.openrouter.apiKey ? new OpenRouterProvider(aiConfig.openrouter.apiKey) : undefined,
};

const providerCache = new Map<string, AIProvider>();

function getProvider(modelId: string): AIProvider | undefined {
  const model = getModel(modelId);
  if (!model) return undefined;

  if (!providerCache.has(model.provider)) {
    try {
      const ctor = providerConstructors[model.provider];
      const provider = ctor?.();
      if (!provider) return undefined;
      providerCache.set(model.provider, provider);
    } catch {
      return undefined;
    }
  }

  return providerCache.get(model.provider);
}

export async function chatWithFallback(
  req: ChatRequest,
): Promise<{ response: ChatResponse; modelUsed: string }> {
  let lastError: Error | null = null;
  const tried = new Set<string>();

  const candidates = [req.model, ...getFallbackChain(req.model)];

  for (const modelId of candidates) {
    if (tried.has(modelId)) continue;
    tried.add(modelId);

    const provider = getProvider(modelId);
    if (!provider) continue;

    try {
      const response = await provider.chat({ ...req, model: modelId });
      return { response, modelUsed: modelId };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!(err instanceof RateLimitError)) break;
    }
  }

  throw lastError ?? new Error('no available model');
}
