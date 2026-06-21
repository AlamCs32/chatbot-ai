import { DocumentModel } from '@/database/models/document.model';
import type { DocumentRecord, DocumentListItem } from '@/database/repositories/types';

export class MongooseDocumentRepository {
  async create(doc: Omit<DocumentRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    await DocumentModel.create(doc);
  }

  async getById(id: string): Promise<DocumentRecord | null> {
    const doc = await DocumentModel.findOne({ id }).lean();
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata as Record<string, unknown>,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async list(): Promise<DocumentListItem[]> {
    const docs = await DocumentModel.find({}, { id: 1, title: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      createdAt: d.createdAt,
    }));
  }

  async delete(id: string): Promise<boolean> {
    const result = await DocumentModel.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
