export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentListItem = Pick<DocumentRecord, 'id' | 'title' | 'createdAt'>;
