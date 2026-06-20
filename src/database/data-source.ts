import { DataSource } from 'typeorm';

import { DocumentEntity } from '@/database/entities/document.entity';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatbot_ai';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: connectionString,
  entities: [DocumentEntity],
  synchronize: true,
  logging: false,
});
