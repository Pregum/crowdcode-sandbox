#!/usr/bin/env node

const testMessages = [
  { message: '右に一マス動かして', author: 'テストユーザー1' },
  { message: '左に移動', author: 'テストユーザー2' },
  { message: '上に2マス', author: 'テストユーザー3' },
  { message: '下に動かして', author: 'テストユーザー4' },
  { message: 'move right 3 steps', author: 'EnglishUser' },
  { message: 'みぎにさんますうごかして', author: 'ひらがなユーザー' },
];

async function sendTestMessage(message, author) {
  try {
    const response = await fetch('http://localhost:3001/test-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, author }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [${author}]: "${message}" -> ${result.message}`);
    } else {
      console.log(`❌ [${author}]: "${message}" -> エラー: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ [${author}]: "${message}" -> 接続エラー: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 テストメッセージの送信を開始...');
  console.log('📡 テストAPI: http://localhost:3001\n');

  for (let i = 0; i < testMessages.length; i++) {
    const { message, author } = testMessages[i];
    await sendTestMessage(message, author);
    
    // メッセージ間の間隔
    if (i < testMessages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n✨ テスト完了！');
  console.log('💡 ブラウザで http://localhost:3000 を開いてブロックの動きを確認してください');
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}