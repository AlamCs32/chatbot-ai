import { adapter } from '@/database/adapter';
import { DocumentRepository } from '@/database/repositories/document.repository';

export const documentRepo = new DocumentRepository(adapter);

export { DocumentRepository } from '@/database/repositories/document.repository';
export type { DocumentRecord, DocumentListItem } from '@/database/repositories/types';
