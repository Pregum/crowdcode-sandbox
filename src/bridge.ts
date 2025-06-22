import { ChatListener } from '@letruxux/youtube-chat';
import { routeMessage } from './agentRegistry.js';
import { broadcastOp } from './server.js';
import { startTestMode } from './testMode.js';
import dotenv from 'dotenv';

dotenv.config();

async function processAgentResponse(response: any, author: string) {
  let toolCallsFound = false;
  
  // response.toolCallsをチェック
  if (response.toolCalls && response.toolCalls.length > 0) {
    for (const toolCall of response.toolCalls) {
      console.log(`🔧 ツール実行: ${toolCall.toolName}`);
      
      if (toolCall.toolName === 'moveBlock') {
        console.log(`🎮 ブロックを移動: dx=${toolCall.args.dx}, dy=${toolCall.args.dy}`);
        broadcastOp({
          name: 'move_block',
          arguments: toolCall.args as { dx: number; dy: number },
        }, author);
        toolCallsFound = true;
      } else {
        // その他のツール（ファイルシステムなど）
        console.log(`   引数:`, toolCall.args);
        broadcastOp({
          name: toolCall.toolName,
          arguments: toolCall.args as any,
        }, author);
        toolCallsFound = true;
      }
    }
  }

  // response.stepsからもツール呼び出しをチェック
  if (!toolCallsFound && response.steps) {
    for (const step of response.steps) {
      if (step.toolCalls && step.toolCalls.length > 0) {
        for (const toolCall of step.toolCalls) {
          console.log(`🔧 ツール実行（steps）: ${toolCall.toolName}`);
          
          if (toolCall.toolName === 'moveBlock') {
            console.log(`🎮 ブロックを移動: dx=${toolCall.args.dx}, dy=${toolCall.args.dy}`);
            broadcastOp({
              name: 'move_block',
              arguments: toolCall.args as { dx: number; dy: number },
            }, author);
            toolCallsFound = true;
          } else {
            // その他のツール
            console.log(`   引数:`, toolCall.args);
            broadcastOp({
              name: toolCall.toolName,
              arguments: toolCall.args as any,
            }, author);
            toolCallsFound = true;
          }
        }
      }
    }
  }

  if (!toolCallsFound) {
    console.log('❌ ツール呼び出しが見つかりませんでした');
  }
}

export async function startChatBridge() {
  const isTestMode = process.env.TEST_MODE === 'true';
  
  if (isTestMode) {
    console.log('🧪 テストモードで起動中...');
    await startTestMode();
    return;
  }

  console.log('📺 YouTube Liveモードで起動中...');
  
  try {
    const listener = new ChatListener(process.env.VIDEO_ID!);

    listener.onMessage(async (message) => {
      console.log(`[${message.author}]: ${message.text}`);
      
      try {
        const result = await routeMessage(message.text, message.author);
        console.log(`✅ ${result.routedTo}エージェントで処理完了`);
        
        // ツール実行結果を処理
        await processAgentResponse(result.response, message.author);
      } catch (error) {
        console.error('Error processing chat:', error);
      }
    });

    // onErrorメソッドが利用可能な場合のみ設定
    if (typeof listener.onError === 'function') {
      listener.onError((error: any) => {
        console.error('YouTube Chat API Error:', error.message);
        
        // APIエラーが継続する場合は警告を表示
        if (error.message && error.message.includes('Failed to parse chat messages')) {
          console.warn('⚠️ YouTube Chat APIでパースエラーが発生しています。');
          console.warn('   原因: YouTubeの構造変更またはライブチャット非対応動画');
          console.warn('   対策: TEST_MODE=trueでテストモードを使用してください');
        }
      });
    }

    listener.start();
    console.log('YouTube chat listener started');
  } catch (error) {
    console.error('Failed to start YouTube chat listener:', error);
    console.log('🔄 テストモードで代替実行を開始します...');
    await startTestMode();
  }
}