import type { ToolDefinition } from '@/ai/types';
import { weatherTool } from '@/ai/tools/weather.tool';

const toolMap = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  toolMap.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return toolMap.get(name);
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(toolMap.values());
}

registerTool(weatherTool);
