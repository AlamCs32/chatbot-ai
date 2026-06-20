import type { ChatMessage } from '@/ai/types';

export interface Session {
  id: string;
  userId?: string;
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface SessionStore {
  get(id: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
}
