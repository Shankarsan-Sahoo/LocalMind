export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  createdAt: number;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface Settings {
  id?: number; // Single row in db, id=1
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  size: string;
  description?: string;
}
