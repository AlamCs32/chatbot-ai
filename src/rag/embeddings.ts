import { OpenAIEmbeddings } from '@langchain/openai';

export const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '',
  configuration: process.env.OPENAI_API_KEY
    ? undefined
    : {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': process.env.APP_NAME || 'Chatbot AI',
        },
      },
});
