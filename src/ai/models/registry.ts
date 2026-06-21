import type { ProviderModel } from '@/ai/types';

export const models: ProviderModel[] = [
  // OpenAI (paid)
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128_000, enabled: true },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128_000,
    enabled: true,
  },
  { id: 'o3-mini', name: 'o3 Mini', provider: 'openai', contextWindow: 200_000, enabled: true },

  // Anthropic (paid)
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    contextWindow: 200_000,
    enabled: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200_000,
    enabled: true,
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    contextWindow: 200_000,
    enabled: true,
  },

  // Google (paid)
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    contextWindow: 1_000_000,
    enabled: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    contextWindow: 1_000_000,
    enabled: true,
  },

  // OpenRouter free models
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (free)',
    provider: 'openrouter',
    contextWindow: 128_000,
    enabled: true,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B (free)',
    provider: 'openrouter',
    contextWindow: 32_000,
    enabled: true,
  },
  {
    id: 'microsoft/phi-3-mini-128k-instruct:free',
    name: 'Phi-3 Mini (free)',
    provider: 'openrouter',
    contextWindow: 128_000,
    enabled: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (free)',
    provider: 'openrouter',
    contextWindow: 32_000,
    enabled: true,
  },
  {
    id: 'nousresearch/hermes-2-pro-mistral-7b:free',
    name: 'Hermes 2 Pro 7B (free)',
    provider: 'openrouter',
    contextWindow: 32_000,
    enabled: true,
  },
  {
    id: 'openchat/openchat-7b:free',
    name: 'OpenChat 7B (free)',
    provider: 'openrouter',
    contextWindow: 32_000,
    enabled: true,
  },
  {
    id: 'cognitivecomputations/dolphin-mixtral-8x7b:free',
    name: 'Dolphin Mixtral 8x7B (free)',
    provider: 'openrouter',
    contextWindow: 32_000,
    enabled: true,
  },
  {
    id: 'gryphe/mythomist-7b:free',
    name: 'MythoMist 7B (free)',
    provider: 'openrouter',
    contextWindow: 32_000,
    enabled: true,
  },
  {
    id: 'sophosympatheia/midnight-rose-7b:free',
    name: 'Midnight Rose 7B (free)',
    provider: 'openrouter',
    contextWindow: 32_000,
    enabled: true,
  },
];

export function getModel(id: string): ProviderModel | undefined {
  return models.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): ProviderModel[] {
  return models.filter((m) => m.provider === provider && m.enabled);
}

export function getDefaultModelForProvider(provider: string): string | undefined {
  const candidates = fallbackChains[provider];
  if (candidates && candidates.length > 0) return candidates[0];
  const first = models.find((m) => m.provider === provider && m.enabled);
  return first?.id;
}

const fallbackChains: Record<string, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'o3-mini', 'claude-sonnet-4-20250514', 'gemini-2.5-flash'],
  anthropic: [
    'claude-sonnet-4-20250514',
    'claude-3-5-haiku-20241022',
    'claude-opus-4-20250514',
    'gpt-4o-mini',
    'gemini-2.5-flash',
  ],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o-mini', 'claude-sonnet-4-20250514'],
  openrouter: [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'openchat/openchat-7b:free',
    'nousresearch/hermes-2-pro-mistral-7b:free',
    'cognitivecomputations/dolphin-mixtral-8x7b:free',
    'sophosympatheia/midnight-rose-7b:free',
    'gryphe/mythomist-7b:free',
    'gpt-4o-mini',
    'claude-sonnet-4-20250514',
  ],
};

export function getFallbackChain(modelId: string): string[] {
  const model = getModel(modelId);
  if (!model) return [];

  const chain = fallbackChains[model.provider] ?? [];
  const idx = chain.indexOf(modelId);
  return idx === -1 ? chain : chain.slice(idx + 1);
}
