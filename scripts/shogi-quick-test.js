#!/usr/bin/env node

// 将棋クイックテスト - 主要機能の簡単なテスト

const API_URL = 'http://localhost:3002/test-message';

// 基本機能テスト用のシーケンス
const quickTests = [
  { message: '将棋やろう', description: 'モード切り替えテスト' },
  { message: '76歩', description: '駒移動テスト（歩）' },
  { message: '34歩', description: '駒移動テスト（相手の歩）' },
  { message: '77角', description: '駒移動テスト（角）' },
  { message: '33角', description: '駒移動テスト（相手の角）' },
  { message: '88銀', description: '駒移動テスト（銀）' },
  { message: '22銀', description: '駒移動テスト（相手の銀）' },
  { message: '24歩', description: '駒の取り合いテスト' },
  { message: '同歩', description: '同じ場所への移動テスト' },
  { message: '23歩打', description: '駒打ちテスト' },
  { message: 'まった', description: 'まった機能テスト' },
  { message: '盤面を見せて', description: '盤面表示テスト' }
];

// メッセージ送信関数
async function sendMessage(message, author = 'テストユーザー') {
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
      console.log(`✅ "${message}"`);
      return result;
    } else {
      console.log(`❌ "${message}" - 失敗 (${response.status})`);
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

// クイックテスト実行
async function runQuickTest() {
  console.log('⚡ 将棋クイックテスト開始');
  console.log('==========================');
  
  // サーバーチェック
  try {
    await fetch(API_URL.replace('/test-message', '/'));
  } catch (error) {
    console.log('❌ サーバーが起動していません。"npm run dev" を実行してください。');
    process.exit(1);
  }

  let passCount = 0;
  for (const { message, description } of quickTests) {
    console.log(`\n🧪 ${description}`);
    const result = await sendMessage(message);
    
    if (result && result.success) {
      passCount++;
    }
    
    await sleep(800); // 短めの間隔
  }
  
  console.log('\n📊 テスト結果:');
  console.log(`✅ 成功: ${passCount}/${quickTests.length}`);
  console.log(`❌ 失敗: ${quickTests.length - passCount}/${quickTests.length}`);
  
  if (passCount === quickTests.length) {
    console.log('🎉 全テスト成功！');
  } else {
    console.log('⚠️ 一部テストが失敗しました。ログを確認してください。');
  }
}

// エラーハンドリング
process.on('SIGINT', () => {
  console.log('\n⚠️ テストが中断されました');
  process.exit(0);
});

// テスト実行
runQuickTest().catch(error => {
  console.error('❌ テスト実行エラー:', error);
  process.exit(1);
});