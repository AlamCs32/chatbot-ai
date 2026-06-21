import { adapter } from '@/database/adapter';
import { DocumentRepository } from '@/database/repositories/document.repository';
import { MongooseDocumentRepository } from '@/database/repositories/mongoose-document.repository';

export const documentRepo =
  adapter.type === 'mongoose' ? new MongooseDocumentRepository() : new DocumentRepository(adapter);

export { DocumentRepository } from '@/database/repositories/document.repository';
export { MongooseDocumentRepository } from '@/database/repositories/mongoose-document.repository';
export type { DocumentRecord, DocumentListItem } from '@/database/repositories/types';
