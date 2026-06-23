import type { UserMemory } from '@/memory/types';

export function formatMemoriesForPrompt(memories: UserMemory[]): string {
  if (memories.length === 0) return '';

  const lines = memories.map((m, i) => `[${i + 1}] ${m.category}: ${m.value}`);

  return [
    'The following is known about you from previous conversations:',
    '',
    ...lines,
    '',
    'Use this information to provide personalized responses.',
    'If any information seems outdated or incorrect, silently update it during this conversation.',
  ].join('\n');
}
