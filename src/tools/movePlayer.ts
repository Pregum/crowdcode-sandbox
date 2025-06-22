import { createTool } from '@mastra/core';
import { z } from 'zod';

export const movePlayer = createTool({
  id: 'movePlayer',
  description: '倉庫番ゲームのプレイヤーを移動させます。箱を押すこともできます。',
  inputSchema: z.object({
    dx: z.number().describe('水平移動量 (正の値=右, 負の値=左)'),
    dy: z.number().describe('垂直移動量 (正の値=下, 負の値=上)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    dx: z.number(),
    dy: z.number(),
    moved: z.boolean().optional(),
    pushedBox: z.boolean().optional(),
    completed: z.boolean().optional(),
    moves: z.number().optional(),
  }),
  execute: async ({ dx, dy }) => {
    // 実際のゲームロジックはserver.tsで処理される
    return {
      success: true,
      dx,
      dy,
    };
  },
});