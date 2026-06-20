export interface Chunk {
  content: string;
  metadata: Record<string, unknown>;
}

export function chunkText(text: string, title = ''): Chunk[] {
  const chunks: Chunk[] = [];
  const maxSize = 1000;
  const overlap = 100;

  const paragraphs = text.split(/\n\s*\n/);
  let current = '';

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    if ((current + '\n\n' + trimmed).length > maxSize && current.length > 0) {
      chunks.push({ content: current, metadata: { title, chunkIndex: chunks.length } });
      current = current.slice(-overlap) + '\n\n' + trimmed;
    } else {
      current = current ? current + '\n\n' + trimmed : trimmed;
    }
  }

  if (current) {
    chunks.push({ content: current, metadata: { title, chunkIndex: chunks.length } });
  }

  return chunks;
}
