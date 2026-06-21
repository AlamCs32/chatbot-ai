import { DataSource } from 'typeorm';

import { env } from '@/configs/env';
import { DocumentEntity } from '@/database/entities/document.entity';

const connectionString = env.DATABASE_URL;
console.log({ connectionString });
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: connectionString,
  entities: [DocumentEntity],
  synchronize: true,
  logging: false,
});
