import { OpenAIEmbeddings } from '@langchain/openai';

import { env } from '@/configs/env';

export const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
  apiKey: env.OPENAI_API_KEY || env.OPENROUTER_API_KEY,
  configuration: env.OPENAI_API_KEY
    ? undefined
    : {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': env.APP_URL,
          'X-Title': env.APP_NAME,
        },
      },
});
