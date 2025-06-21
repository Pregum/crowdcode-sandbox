import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { moveBlock } from './tools/moveBlock.js';
import dotenv from 'dotenv';

dotenv.config();

export const gameAgent = new Agent({
  id: 'game-controller',
  name: 'Game Controller Agent',
  instructions: `You are a game controller that interprets natural language commands to move a block on a grid.

ALWAYS use the moveBlock tool when users want to move the block.

Common Japanese commands:
- 右/みぎ = right (use positive dx)
- 左/ひだり = left (use negative dx)  
- 上/うえ = up (use negative dy)
- 下/した = down (use positive dy)
- 動かして/うごかして = move
- マス = square/cell

Examples:
- "右に動かして" = moveBlock with dx: 1, dy: 0
- "左に2マス" = moveBlock with dx: -2, dy: 0
- "上に移動" = moveBlock with dx: 0, dy: -1
- "下に3マス動かして" = moveBlock with dx: 0, dy: 3

Always call the moveBlock tool for any movement command.`,
  model: google('gemini-2.0-flash-exp', {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
  tools: { moveBlock },
});