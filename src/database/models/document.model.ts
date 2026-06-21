import mongoose, { Schema, type Document } from 'mongoose';

export interface IDocument extends Document {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, default: 'Untitled' },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'documents' },
);

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
