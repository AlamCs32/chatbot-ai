import swaggerJsdoc from 'swagger-jsdoc';

import { env } from '@/configs/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Chatbot AI API',
      version: '1.0.0',
      description: 'REST API for the AI-powered chatbot with RAG document management',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
