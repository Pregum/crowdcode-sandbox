import { ChatListener } from '@letruxux/youtube-chat';
import { gameAgent } from './agent.js';
import { broadcastOp } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

export async function startChatBridge() {
  const listener = new ChatListener({ videoId: process.env.VIDEO_ID! });

  listener.on('chat', async (chat) => {
    console.log(`[${chat.author.name}]: ${chat.message}`);
    
    try {
      const response = await gameAgent.run({
        messages: [{ role: 'user', content: chat.message }],
      });

      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          if (toolCall.name === 'move_block') {
            broadcastOp({
              name: 'move_block',
              arguments: toolCall.arguments as { dx: number; dy: number },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing chat:', error);
    }
  });

  listener.on('error', (error) => {
    console.error('YouTube chat error:', error);
  });

  await listener.start();
  console.log('YouTube chat listener started');
}