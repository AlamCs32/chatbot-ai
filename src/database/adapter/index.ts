import { env } from '@/configs/env';
import { TypeOrmAdapter } from '@/database/adapter/typeorm';
import { SupabaseAdapter } from '@/database/adapter/supabase';
import { MongooseAdapter } from '@/database/adapter/mongoose';
import type { DatabaseAdapter } from '@/database/adapter/types';

function createAdapter(): DatabaseAdapter {
  switch (env.DATABASE_ADAPTER) {
    case 'supabase':
      return new SupabaseAdapter();
    case 'mongoose':
      return new MongooseAdapter();
    default:
      return new TypeOrmAdapter();
  }
}

const adapter = createAdapter();

export { adapter };
export type { DatabaseAdapter };
