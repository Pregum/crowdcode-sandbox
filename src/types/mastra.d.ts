declare module '@mastra/core' {
  import { z } from 'zod';

  export interface Tool<T = any> {
    id: string;
    description: string;
    inputSchema: z.ZodSchema<T>;
    execute: (input: T) => Promise<{ success: boolean; result: any }>;
  }

  export interface AgentConfig {
    name: string;
    instructions: string;
    model: {
      provider: string;
      name: string;
      toolChoice?: string;
    };
    tools: Tool[];
  }

  export interface ToolCall {
    name: string;
    arguments: any;
  }

  export interface AgentResponse {
    toolCalls?: ToolCall[];
  }

  export class Agent {
    constructor(config: AgentConfig);
    run(params: { messages: Array<{ role: string; content: string }> }): Promise<AgentResponse>;
  }

  export function createTool<T>(config: {
    id: string;
    description: string;
    inputSchema: z.ZodSchema<T>;
    execute: (input: T) => Promise<{ success: boolean; result: any }>;
  }): Tool<T>;
}