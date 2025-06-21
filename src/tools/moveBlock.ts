import { createTool } from '@mastra/core';
import { z } from 'zod';

export const moveBlock = createTool({
  id: 'move_block',
  description: 'Move the block on the grid by specified delta values',
  inputSchema: z.object({
    dx: z.number().describe('Horizontal movement delta (positive = right, negative = left)'),
    dy: z.number().describe('Vertical movement delta (positive = down, negative = up)'),
  }),
  execute: async ({ dx, dy }) => {
    return {
      success: true,
      result: { dx, dy },
    };
  },
});