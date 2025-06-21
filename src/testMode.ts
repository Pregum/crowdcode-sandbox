import * as readline from 'readline';
import express from 'express';
import { gameAgent } from './agent.js';
import { broadcastOp } from './server.js';

export async function startTestMode() {
  console.log('\n=== テストモード ===');
  console.log('コンソールから直接メッセージを入力してテストできます');
  console.log('終了するには "exit" または Ctrl+C を押してください\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const processMessage = async (message: string, author: string = 'テストユーザー') => {
    console.log(`[${author}]: ${message}`);
    
    try {
      const response = await gameAgent.generate([
        { role: 'user', content: message }
      ], {
        maxSteps: 5
      });

      console.log('🔍 デバッグ情報:');
      console.log('  - text:', response.text);
      console.log('  - toolCalls:', response.toolCalls);
      console.log('  - steps length:', response.steps?.length || 0);

      // response.toolCallsをチェック
      let toolCallsFound = false;
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          console.log(`🔧 ツール呼び出し検出（toolCalls）: ${toolCall.toolName}`);
          if (toolCall.toolName === 'moveBlock') {
            console.log(`🎮 ブロックを移動: dx=${toolCall.args.dx}, dy=${toolCall.args.dy}`);
            broadcastOp({
              name: 'move_block',
              arguments: toolCall.args as { dx: number; dy: number },
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
              console.log(`🔧 ツール呼び出し検出（steps）: ${toolCall.toolName}`);
              if (toolCall.toolName === 'moveBlock') {
                console.log(`🎮 ブロックを移動: dx=${toolCall.args.dx}, dy=${toolCall.args.dy}`);
                broadcastOp({
                  name: 'move_block',
                  arguments: toolCall.args as { dx: number; dy: number },
                }, author);
                toolCallsFound = true;
              }
            }
          }
        }
      }

      if (!toolCallsFound) {
        console.log('❌ コマンドが認識されませんでした（ツール呼び出しなし）');
      }
    } catch (error) {
      console.error('❌ エラー:', error);
    }
  };

  const askQuestion = () => {
    rl.question('コメントを入力 > ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      if (input.trim()) {
        await processMessage(input);
      }
      
      // 非同期で次の質問を設定
      setImmediate(askQuestion);
    });
  };

  // HTTP API を先に起動
  const app = express();
  app.use(express.json());

  app.post('/test-message', async (req, res) => {
    const { message, author = 'HTTP テスト' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'メッセージが必要です' });
    }

    await processMessage(message, author);
    res.json({ success: true, message: 'メッセージを処理しました' });
  });

  app.get('/test', (req, res) => {
    res.json({ 
      message: 'テスト API が動作中',
      usage: {
        endpoint: 'POST /test-message',
        body: { message: 'right に移動して', author: '任意の名前' }
      }
    });
  });

  app.get('/game-state', (req, res) => {
    // サーバーの状態を取得する関数をインポートする必要があります
    res.json({ 
      message: 'ゲーム状態 API',
      note: 'WebSocket経由で状態を取得してください'
    });
  });

  const server = app.listen(3002, () => {
    console.log('✅ HTTP テスト API: http://localhost:3002');
    console.log('📝 使用例:');
    console.log('   curl -X POST http://localhost:3002/test-message \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{"message":"右に動かして","author":"テスト"}\'');
    console.log('🎮 またはコンソールから直接入力も可能です\n');
    
    // HTTPサーバー起動後にコンソール入力開始
    askQuestion();
  });

  // プロセス終了時の処理
  process.on('SIGINT', () => {
    console.log('\nテストモードを終了します');
    rl.close();
    server.close();
    process.exit(0);
  });

  rl.on('close', () => {
    console.log('コンソール入力が終了しました。HTTP APIは継続して利用可能です。');
    console.log('終了するには Ctrl+C を押してください。');
  });
}