export type MemoryCategory = 'profile' | 'skill' | 'preference' | 'project' | 'tool' | 'context';

export interface UserMemory {
  userId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
  sourceSessionId: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface ExtractedMemory {
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
}
