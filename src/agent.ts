import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { moveBlock } from './tools/moveBlock.js';
import dotenv from 'dotenv';

dotenv.config();

export const gameAgent = new Agent({
  name: 'game-controller',
  instructions: `You are a game controller that interprets natural language commands to move a block on a grid.
Common Japanese commands:
- 右/みぎ = right
- 左/ひだり = left  
- 上/うえ = up
- 下/した = down
- 動かして/うごかして = move
- マス = square/cell

Always respond with appropriate tool calls to move the block based on user intent.`,
  model: google('gemini-2.0-flash-exp'),
  tools: { moveBlock },
});