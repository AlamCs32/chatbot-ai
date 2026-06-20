export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface ToolParamProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParamProperty>;
    required: string[];
  };
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ProviderModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  enabled: boolean;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  tools?: ToolDefinition[];
}

export interface ChatResponse {
  content: string | null;
  toolCalls: ToolCall[];
}

export interface AIProvider {
  chat(req: ChatRequest): Promise<ChatResponse>;
}

export class RateLimitError extends Error {
  constructor(
    public model: string,
    public retryAfter?: number,
  ) {
    super(`Rate limit hit for model: ${model}`);
    this.name = 'RateLimitError';
  }
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    public model: string,
    message: string,
  ) {
    super(`[${provider}/${model}] ${message}`);
    this.name = 'ProviderError';
  }
}
