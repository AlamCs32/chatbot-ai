import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_ADAPTER: process.env.DATABASE_ADAPTER || 'typeorm',

  DATABASE_URL:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatbot_ai',

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',

  DEFAULT_PROVIDER: process.env.DEFAULT_PROVIDER || 'openrouter',
  DEFAULT_MODEL: process.env.DEFAULT_MODEL || 'google/gemini-2.0-flash-exp:free',
  AI_MAX_RETRIES: Number(process.env.AI_MAX_RETRIES) || 3,

  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || '',
  SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL || '',
  SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL || '',

  MONGODB_URI: process.env.MONGODB_URI || '',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  SERVICE_NAME: process.env.SERVICE_NAME || 'chatbot-ai',

  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  APP_NAME: process.env.APP_NAME || 'Chatbot AI',
};
