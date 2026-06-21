import type { DatabaseAdapter } from '@/database/adapter/types';
import type { DocumentRecord, DocumentListItem } from '@/database/repositories/types';

export class DocumentRepository {
  constructor(private adapter: DatabaseAdapter) {}

  async create(doc: Omit<DocumentRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    const { id, title, content, metadata } = doc;
    await this.adapter.query(
      'INSERT INTO documents (id, title, content, metadata, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [id, title, content, JSON.stringify(metadata)],
    );
  }

  async getById(id: string): Promise<DocumentRecord | null> {
    const result = await this.adapter.query('SELECT * FROM documents WHERE id = $1', [id]);
    const rows = result as { rows: DocumentRecord[] };
    return rows.rows[0] ?? null;
  }

  async list(): Promise<DocumentListItem[]> {
    const result = await this.adapter.query(
      'SELECT id, title, "createdAt" FROM documents ORDER BY "createdAt" DESC',
    );
    const rows = result as { rows: DocumentListItem[] };
    return rows.rows;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.adapter.query('DELETE FROM documents WHERE id = $1 RETURNING id', [
      id,
    ]);
    const rows = result as { rowCount: number };
    return rows.rowCount > 0;
  }
}
