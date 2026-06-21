import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { aiConfig } from '@/ai/config';
import { env } from '@/configs/env';

export function createLangchainModel(modelId: string): BaseChatModel | null {
  const openAIKey = aiConfig.openai.apiKey;
  const anthropicKey = aiConfig.anthropic.apiKey;
  const geminiKey = aiConfig.gemini.apiKey;
  const openRouterKey = aiConfig.openrouter.apiKey;

  if (modelId.startsWith('gpt-') || modelId.startsWith('o3') || modelId.startsWith('o4')) {
    if (!openAIKey) return null;
    return new ChatOpenAI({ model: modelId, apiKey: openAIKey });
  }

  if (modelId.startsWith('claude')) {
    if (!anthropicKey) return null;
    return new ChatAnthropic({ model: modelId, apiKey: anthropicKey });
  }

  if (modelId.startsWith('gemini')) {
    if (!geminiKey) return null;
    return new ChatGoogleGenerativeAI({ model: modelId, apiKey: geminiKey });
  }

  if (modelId.includes('/')) {
    if (!openRouterKey) return null;
    return new ChatOpenAI(modelId, {
      apiKey: openRouterKey,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': env.APP_URL,
          'X-Title': env.APP_NAME,
        },
      },
    });
  }

  return null;
}
