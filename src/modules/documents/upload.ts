import mammoth from 'mammoth';

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'txt': {
      return buffer.toString('utf-8');
    }

    case 'pdf': {
      const { PDFParse } = await import('pdf-parse');
      const pdf = new PDFParse({ data: buffer });
      const result = await pdf.getText();
      await pdf.destroy();
      return result.text;
    }

    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    default: {
      // Try as plain text
      return buffer.toString('utf-8');
    }
  }
}

export function getTitleFromFilename(filename: string): string {
  const name = filename.split('.').slice(0, -1).join('.');
  return name || 'Untitled';
}
