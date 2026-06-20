export const aiConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
  },
  defaultModel: process.env.DEFAULT_MODEL || 'google/gemini-2.0-flash-exp:free',
  maxRetries: Number(process.env.AI_MAX_RETRIES) || 3,
};
