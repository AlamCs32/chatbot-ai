import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { createLangchainModel } from '@/ai/langchain/models';
import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import type { ExtractedMemory } from '@/memory/types';

const EXTRACTION_PROMPT = `You are analyzing a conversation exchange to extract long-term memories about the user.

Extract factual information that would help personalize future interactions.
Only extract information that is:
- Explicitly stated by the user (not inferred)
- Likely to be long-term stable (not temporary emotional state)
- Useful for personalization (profession, skills, preferences, goals, tools, projects)

For each memory, return a JSON object with:
- "category": one of "profile", "skill", "preference", "project", "tool", "context"
- "key": a short camelCase identifier (e.g. "profession", "preferredLanguage")
- "value": the factual statement
- "confidence": a number 0.0–1.0 indicating how certain you are

Return a JSON array. If nothing to extract, return an empty array [].

Conversation:
User: {{userMessage}}
Assistant: {{assistantResponse}}`;

function parseJsonArray(text: string): unknown[] {
  const first = text.indexOf('[');
  const last = text.lastIndexOf(']');
  if (first === -1 || last === -1) return [];
  try {
    const parsed = JSON.parse(text.slice(first, last + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function extractMemories(
  userMessage: string,
  assistantResponse: string,
): Promise<ExtractedMemory[]> {
  if (userMessage.length < 5) return [];

  try {
    const model = createLangchainModel(env.MEMORY_EXTRACTION_MODEL);
    if (!model) return [];

    const prompt = EXTRACTION_PROMPT.replace('{{userMessage}}', userMessage).replace(
      '{{assistantResponse}}',
      assistantResponse,
    );

    const result = await model.invoke([
      new SystemMessage('You extract user memories from conversations. Return only valid JSON.'),
      new HumanMessage(prompt),
    ]);

    const content = typeof result.content === 'string' ? result.content : '';
    const items = parseJsonArray(content);

    const memories: ExtractedMemory[] = [];
    const validCategories = new Set([
      'profile',
      'skill',
      'preference',
      'project',
      'tool',
      'context',
    ]);

    for (const item of items) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).key === 'string' &&
        typeof (item as Record<string, unknown>).value === 'string' &&
        validCategories.has((item as Record<string, unknown>).category as string)
      ) {
        memories.push({
          category: (item as Record<string, unknown>).category as ExtractedMemory['category'],
          key: (item as Record<string, unknown>).key as string,
          value: (item as Record<string, unknown>).value as string,
          confidence:
            typeof (item as Record<string, unknown>).confidence === 'number'
              ? ((item as Record<string, unknown>).confidence as number)
              : 0.5,
        });
      }
    }

    logger.debug({ count: memories.length }, 'memory.extraction complete');
    return memories;
  } catch (err) {
    logger.warn({ err }, 'memory.extraction failed');
    return [];
  }
}
