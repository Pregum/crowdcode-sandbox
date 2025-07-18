import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { startChatBridge } from './bridge.js';
import { SokobanGame, SokobanState } from './game/sokoban.js';
import { ShogiGame } from './game/shogiGame.js';
import { ShogiState } from './game/shogi.js';

const wss = new WebSocketServer({ port: process.env.WS_PORT || 8765 });

interface GameState {
  x: number;
  y: number;
}

interface Operation {
  name: string;
  arguments: { dx?: number; dy?: number; x?: number; y?: number; [key: string]: any };
  timestamp: number;
  author?: string;
}

interface GameData {
  state: GameState;
  sokoban: SokobanState;
  shogi?: ShogiState;
  history: Operation[];
  recentOps: Operation[];
  gameMode: 'simple' | 'sokoban' | 'shogi' | 'tsumeshogi';
}

// ゲームインスタンス
const sokobanGame = new SokobanGame(1);
let shogiGame: ShogiGame | null = null;

let gameData: GameData = {
  state: { x: 5, y: 5 },
  sokoban: sokobanGame.getState(),
  history: [],
  recentOps: [],
  gameMode: 'sokoban' // デフォルトで倉庫番モード
};

// グローバルに公開（ツールから参照するため）
(global as any).shogiGame = shogiGame;
(global as any).gameData = gameData;

const clients = new Set<WSWebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  // 接続時に現在の完全な状態を送信
  ws.send(JSON.stringify({
    type: 'full_state',
    data: gameData,
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

export function broadcastOp(op: Omit<Operation, 'timestamp'>, author?: string) {
  const operation: Operation = {
    ...op,
    timestamp: Date.now(),
    author
  };

  let moveSuccessful = false;

  // ゲームモードに応じて状態を更新
  if (gameData.gameMode === 'shogi' || gameData.gameMode === 'tsumeshogi') {
    // 将棋ゲームの処理
    if (operation.name === 'moveShogiPiece' || operation.name === 'dropShogiPiece' || operation.name === 'resignShogi') {
      // 将棋の操作はツール側で処理されるため、ここでは成功とする
      moveSuccessful = true;
      if (shogiGame) {
        gameData.shogi = shogiGame.getState();
      }
    }
  } else if (gameData.gameMode === 'sokoban') {
    // 倉庫番ゲームの処理
    if (operation.name === 'movePlayer' || operation.name === 'move_block' || operation.name === 'moveBlock') {
      const dx = operation.arguments.dx ?? 0;
      const dy = operation.arguments.dy ?? 0;
      moveSuccessful = sokobanGame.movePlayer(dx, dy);
      if (moveSuccessful) {
        gameData.sokoban = sokobanGame.getState();
        console.log(`🎮 倉庫番: プレイヤー移動 (${gameData.sokoban.player.x}, ${gameData.sokoban.player.y}), 移動回数: ${gameData.sokoban.moves}`);
        
        if (gameData.sokoban.isCompleted) {
          console.log('🎉 レベルクリア！');
          
          // 次のレベルに進む
          setTimeout(() => {
            if (sokobanGame.nextLevel()) {
              gameData.sokoban = sokobanGame.getState();
              console.log(`📈 レベル ${gameData.sokoban.level} に進みました`);
              broadcastGameState();
            } else {
              console.log('🏆 全レベルクリア！');
            }
          }, 2000);
        }
      } else {
        console.log('❌ 移動できませんでした');
      }
    } else if (operation.name === 'jumpToPosition') {
      const x = operation.arguments.x ?? 0;
      const y = operation.arguments.y ?? 0;
      const validatePosition = operation.arguments.validatePosition ?? true;
      moveSuccessful = sokobanGame.jumpToPosition(x, y, validatePosition);
      if (moveSuccessful) {
        gameData.sokoban = sokobanGame.getState();
        console.log(`✨ 倉庫番: プレイヤーがジャンプ (${gameData.sokoban.player.x}, ${gameData.sokoban.player.y})`);
      } else {
        console.log('❌ ジャンプできませんでした');
      }
    }
  } else {
    // シンプルモードの処理
    if (operation.name === 'move_block' || operation.name === 'moveBlock') {
      gameData.state.x = Math.max(0, Math.min(19, gameData.state.x + operation.arguments.dx));
      gameData.state.y = Math.max(0, Math.min(14, gameData.state.y + operation.arguments.dy));
      moveSuccessful = true;
      console.log(`📊 シンプルモード: (${gameData.state.x}, ${gameData.state.y})`);
    }
  }

  // 履歴に追加（移動が成功した場合のみ）
  if (moveSuccessful) {
    gameData.history.push(operation);
    
    // 最新4件のオペレーションを保持
    gameData.recentOps.push(operation);
    if (gameData.recentOps.length > 4) {
      gameData.recentOps.shift();
    }
  }

  // 全クライアントに更新を配信
  broadcastGameState();
}

function broadcastGameState() {
  const updateMessage = JSON.stringify({
    type: 'game_update',
    data: gameData,
  });

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(updateMessage);
    }
  });
}

// ゲームモード切り替え関数を追加
export function switchGameMode(mode: 'simple' | 'sokoban' | 'shogi' | 'tsumeshogi') {
  console.log(`🔄 サーバー側ゲームモード切り替え開始: ${gameData.gameMode} → ${mode}`);
  
  gameData.gameMode = mode;
  
  if (mode === 'sokoban') {
    gameData.sokoban = sokobanGame.getState();
    console.log(`📦 倉庫番ゲーム状態を設定`);
  } else if (mode === 'shogi' || mode === 'tsumeshogi') {
    if (!shogiGame) {
      console.log(`🆕 新しい将棋ゲームを作成`);
      shogiGame = new ShogiGame();
      (global as any).shogiGame = shogiGame;
    } else {
      console.log(`🔄 既存の将棋ゲームをリセット`);
      shogiGame.reset();
    }
    gameData.shogi = shogiGame.getState();
    console.log(`♟️ 将棋ゲーム状態を設定:`, gameData.shogi ? '成功' : '失敗');
  }
  
  broadcastGameState();
  console.log(`✅ ゲームモード切り替え完了: ${mode}`);
}

// レベルリセット関数を追加
export function resetLevel() {
  if (gameData.gameMode === 'sokoban') {
    sokobanGame.reset();
    gameData.sokoban = sokobanGame.getState();
    broadcastGameState();
    console.log('🔄 レベルをリセットしました');
  }
}

async function main() {
  console.log('WebSocket server running on port 8765');
  await startChatBridge();
}

main().catch(console.error);