import { env } from '@/configs/env';

export const aiConfig = {
  openai: {
    apiKey: env.OPENAI_API_KEY,
    baseUrl: env.OPENAI_BASE_URL,
  },
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
    baseUrl: env.ANTHROPIC_BASE_URL,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },
  openrouter: {
    apiKey: env.OPENROUTER_API_KEY,
  },
  defaultModel: env.DEFAULT_MODEL,
  maxRetries: env.AI_MAX_RETRIES,
};
