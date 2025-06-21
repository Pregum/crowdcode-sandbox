declare module '@mastra/core/agent' {
  import { Tool } from '@mastra/core';

  export interface AgentConfig {
    name: string;
    instructions: string;
    model: any; // AI SDK model
    tools: Record<string, Tool>;
  }

  export interface ToolCall {
    toolName: string;
    args: any;
  }

  export interface AgentResponse {
    toolCalls?: ToolCall[];
    text?: string;
    steps?: Array<{
      stepType: string;
      toolCalls?: ToolCall[];
      [key: string]: any;
    }>;
  }

  export interface GenerateOptions {
    maxSteps?: number;
  }

  export class Agent {
    constructor(config: AgentConfig);
    generate(messages: Array<{ role: string; content: string }>, options?: GenerateOptions): Promise<AgentResponse>;
  }
}