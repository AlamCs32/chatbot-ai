import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ default: '' })
  title!: string;

  @Column('text')
  content!: string;

  @Column('jsonb', { default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
