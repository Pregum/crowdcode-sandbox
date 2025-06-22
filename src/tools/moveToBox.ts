import { createTool } from '@mastra/core';
import { z } from 'zod';

export const moveToBox = createTool({
  id: 'moveToBox',
  description: '指定した箱の位置まで自動で回り込みます',
  inputSchema: z.object({
    boxIndex: z.number().min(0).describe('目標とする箱のインデックス（0から開始）'),
    direction: z.enum(['north', 'south', 'east', 'west']).optional().default('east').describe('箱に対してどちら側に回り込むか'),
    pushAfterMove: z.boolean().optional().default(false).describe('移動後に箱を押すかどうか'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    moves: z.array(z.object({
      dx: z.number(),
      dy: z.number(),
    })).optional(),
    finalPosition: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
    message: z.string().optional(),
  }),
  execute: async ({ boxIndex, direction, pushAfterMove }) => {
    // 実際のパスファインディングはserver.tsで実行される
    // ここでは基本的な移動方向を計算

    const directionMap = {
      north: { dx: 0, dy: -1 },
      south: { dx: 0, dy: 1 },
      east: { dx: 1, dy: 0 },
      west: { dx: -1, dy: 0 },
    };

    const targetDirection = directionMap[direction];

    return {
      success: true,
      moves: [targetDirection], // 実際の経路はサーバーで計算
      message: `箱${boxIndex}の${direction}側に移動中...${pushAfterMove ? '移動後に箱を押します' : ''}`,
    };
  },
});