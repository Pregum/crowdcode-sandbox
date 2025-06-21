import * as readline from 'readline';
import { filesystemAgent } from './filesystemAgent.js';
import dotenv from 'dotenv';

dotenv.config();

export async function testFilesystemAgent() {
  console.log('\n=== ファイルシステムエージェント テストモード ===');
  console.log('自然言語でファイル操作を指示してください');
  console.log('例: "srcディレクトリの中身を見せて"');
  console.log('終了するには "exit" または Ctrl+C を押してください\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const processMessage = async (message: string) => {
    console.log(`\n📝 リクエスト: ${message}`);
    
    try {
      const response = await filesystemAgent.generate([
        { role: 'user', content: message }
      ], {
        maxSteps: 5
      });

      console.log('\n🔍 デバッグ情報:');
      console.log('  - text:', response.text);
      console.log('  - toolCalls:', response.toolCalls?.length || 0);
      console.log('  - steps length:', response.steps?.length || 0);

      // response.toolCallsをチェック
      let toolCallsFound = false;
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          console.log(`\n🔧 ツール実行: ${toolCall.toolName}`);
          console.log('   引数:', JSON.stringify(toolCall.args, null, 2));
          
          toolCallsFound = true;
        }
      }

      // response.stepsからもツール呼び出しをチェック
      if (!toolCallsFound && response.steps) {
        for (const step of response.steps) {
          if (step.toolCalls && step.toolCalls.length > 0) {
            for (const toolCall of step.toolCalls) {
              console.log(`\n🔧 ツール実行（steps）: ${toolCall.toolName}`);
              console.log('   引数:', JSON.stringify(toolCall.args, null, 2));
              
              // ツール実行結果を表示
              if (step.toolResults) {
                for (const result of step.toolResults) {
                  console.log('\n📤 実行結果:');
                  console.log(JSON.stringify(result.result, null, 2));
                }
              }
              
              toolCallsFound = true;
            }
          }
        }
      }

      // AIの最終的な応答を表示
      if (response.text) {
        console.log(`\n✅ エージェントの応答:\n${response.text}`);
      }

      if (!toolCallsFound && !response.text) {
        console.log('\n❌ ツール呼び出しも応答テキストもありませんでした');
      }
    } catch (error) {
      console.error('\n❌ エラー:', error);
    }
  };

  const askQuestion = () => {
    rl.question('\n操作を入力 > ', async (input) => {
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

  askQuestion();

  // プロセス終了時の処理
  process.on('SIGINT', () => {
    console.log('\n\nファイルシステムエージェントを終了します');
    rl.close();
    process.exit(0);
  });

  rl.on('close', () => {
    console.log('終了しました');
  });
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  testFilesystemAgent().catch(console.error);
}