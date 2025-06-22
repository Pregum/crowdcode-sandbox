#!/usr/bin/env node

// 将棋デモスクリプト - 一連の対局の流れをテスト

const API_URL = 'http://localhost:3002/test-message';

// 将棋の対局シーケンス
const shogiMoves = [
  { message: '将棋やろう', description: '将棋モードに切り替え' },
  { message: '盤面を見せて', description: '初期盤面表示' },
  { message: '76歩', description: '先手：7六歩' },
  { message: '34歩', description: '後手：3四歩' },
  { message: '26歩', description: '先手：2六歩' },
  { message: '84歩', description: '後手：8四歩' },
  { message: '25歩', description: '先手：2五歩' },
  { message: '85歩', description: '後手：8五歩' },
  { message: '78金', description: '先手：7八金' },
  { message: '32金', description: '後手：3二金' },
  { message: '69玉', description: '先手：6九玉' },
  { message: '41玉', description: '後手：4一玉' },
  { message: '59玉', description: '先手：5九玉' },
  { message: '52玉', description: '後手：5二玉' },
  { message: '68銀', description: '先手：6八銀' },
  { message: '63銀', description: '後手：6三銀' },
  { message: '77銀', description: '先手：7七銀' },
  { message: '74銀', description: '後手：7四銀' },
  { message: '88角', description: '先手：8八角' },
  { message: '22角', description: '後手：2二角' },
  { message: '24歩', description: '先手：2四歩（歩交換）' },
  { message: '同歩', description: '後手：同歩' },
  { message: '同飛', description: '先手：同飛' },
  { message: '23歩打', description: '後手：2三歩打ち（駒打ちテスト）' },
  { message: '28飛', description: '先手：2八飛' },
  { message: '盤面を見せて', description: '現在の盤面確認' },
  { message: 'まった', description: 'まった機能テスト（1手戻す）' },
  { message: '盤面を見せて', description: 'まった後の盤面確認' },
  { message: '投了', description: '投了して対局終了' }
];

// メッセージ送信関数
async function sendMessage(message, author = 'デモユーザー') {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        author
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ "${message}" - 送信成功`);
      return result;
    } else {
      console.log(`❌ "${message}" - 送信失敗: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ "${message}" - エラー: ${error.message}`);
    return null;
  }
}

// 遅延関数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// メインデモ実行
async function runShogiDemo() {
  console.log('🎯 将棋デモ開始');
  console.log('===============================');
  
  // サーバーが起動しているかチェック
  try {
    const testResponse = await fetch(API_URL.replace('/test-message', '/'));
    if (!testResponse.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.log('❌ サーバーが起動していません。先に "npm run dev" を実行してください。');
    process.exit(1);
  }

  let moveCount = 0;
  for (const { message, description } of shogiMoves) {
    moveCount++;
    console.log(`\n📝 ${moveCount}/${shogiMoves.length}: ${description}`);
    console.log(`💬 送信: "${message}"`);
    
    const result = await sendMessage(message);
    
    if (result) {
      console.log(`📥 応答: ${result.success ? '成功' : '失敗'}`);
      if (result.message) {
        console.log(`📨 メッセージ: ${result.message}`);
      }
    }
    
    // 各手の間に少し待機（サーバー処理時間を考慮）
    await sleep(1500);
  }
  
  console.log('\n🎉 将棋デモ完了');
  console.log('===============================');
  console.log('📊 統計:');
  console.log(`  - 総手数: ${shogiMoves.length}`);
  console.log(`  - 実行時間: 約 ${Math.ceil(shogiMoves.length * 1.5)} 秒`);
  console.log('\n💡 ヒント:');
  console.log('  - ブラウザで http://localhost:3001 を開いて盤面の変化を確認できます');
  console.log('  - サーバーのログでツールの実行状況を確認できます');
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 予期しないエラー:', reason);
  process.exit(1);
});

// Ctrl+C での中断処理
process.on('SIGINT', () => {
  console.log('\n⚠️ デモが中断されました');
  process.exit(0);
});

// デモ実行
runShogiDemo().catch(error => {
  console.error('❌ デモ実行エラー:', error);
  process.exit(1);
});