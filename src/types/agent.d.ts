declare module '@mastra/core/agent' {
  import { Tool } from '@mastra/core';

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
}