import { ChatListener } from '@letruxux/youtube-chat';
import { gameAgent } from './agent.js';
import { broadcastOp } from './server.js';
import { startTestMode } from './testMode.js';
import dotenv from 'dotenv';

dotenv.config();

export async function startChatBridge() {
  const isTestMode = process.env.TEST_MODE === 'true';
  
  if (isTestMode) {
    console.log('🧪 テストモードで起動中...');
    await startTestMode();
    return;
  }

  console.log('📺 YouTube Liveモードで起動中...');
  const listener = new ChatListener(process.env.VIDEO_ID!);

  listener.onMessage(async (message) => {
    console.log(`[${message.author}]: ${message.text}`);
    
    try {
      const response = await gameAgent.generate([
        { role: 'user', content: message.text }
      ], {
        maxSteps: 5
      });

      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          if (toolCall.toolName === 'moveBlock') {
            console.log(`🎮 ブロックを移動: dx=${toolCall.args.dx}, dy=${toolCall.args.dy}`);
            broadcastOp({
              name: 'move_block',
              arguments: toolCall.args as { dx: number; dy: number },
            });
          }
        }
      } else {
        console.log('❌ コマンドが認識されませんでした');
      }
    } catch (error) {
      console.error('Error processing chat:', error);
    }
  });

  listener.start();
  console.log('YouTube chat listener started');
}