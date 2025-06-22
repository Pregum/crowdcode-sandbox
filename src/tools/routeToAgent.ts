import { createTool } from '@mastra/core';
import { z } from 'zod';

export const routeToAgent = createTool({
  id: 'routeToAgent',
  description: 'メッセージを適切なエージェントにルーティングします',
  inputSchema: z.object({
    agentId: z.string().describe('ルーティング先のエージェントID'),
    message: z.string().describe('エージェントに送るメッセージ'),
    reason: z.string().optional().describe('このエージェントを選択した理由'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    agentId: z.string(),
    routed: z.boolean(),
  }),
  execute: async ({ agentId, message, reason }) => {
    console.log(`🔀 ルーティング: ${agentId} エージェントへ`);
    if (reason) {
      console.log(`   理由: ${reason}`);
    }
    console.log(`   メッセージ: ${message}`);
    
    return {
      success: true,
      agentId,
      routed: true,
    };
  },
});