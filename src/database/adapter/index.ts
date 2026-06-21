import { env } from '@/configs/env';
import { TypeOrmAdapter } from '@/database/adapter/typeorm';
import { SupabaseAdapter } from '@/database/adapter/supabase';
import type { DatabaseAdapter } from '@/database/adapter/types';

const adapter: DatabaseAdapter =
  env.DATABASE_ADAPTER === 'supabase' ? new SupabaseAdapter() : new TypeOrmAdapter();

export { adapter };
export type { DatabaseAdapter };
