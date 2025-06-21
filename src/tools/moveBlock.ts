import { createTool } from '@mastra/core';
import { z } from 'zod';

export const moveBlock = createTool({
  id: 'moveBlock',
  description: 'Move the block on the grid by specified delta values. Use positive dx for right, negative dx for left, positive dy for down, negative dy for up.',
  inputSchema: z.object({
    dx: z.number().describe('Horizontal movement delta (positive = right, negative = left)'),
    dy: z.number().describe('Vertical movement delta (positive = down, negative = up)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    dx: z.number(),
    dy: z.number(),
  }),
  execute: async ({ dx, dy }) => {
    return {
      success: true,
      dx,
      dy,
    };
  },
});