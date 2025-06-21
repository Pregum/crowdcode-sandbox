import { ChatListener } from '@letruxux/youtube-chat';
import { gameAgent } from './agent.js';
import { broadcastOp } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

export async function startChatBridge() {
  const listener = new ChatListener(process.env.VIDEO_ID!);

  listener.onMessage(async (message) => {
    console.log(`[${message.author}]: ${message.text}`);
    
    try {
      const response = await gameAgent.run({
        messages: [{ role: 'user', content: message.text }],
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

  listener.start();
  console.log('YouTube chat listener started');
}