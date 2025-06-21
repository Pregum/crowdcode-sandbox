import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { startChatBridge } from './bridge.js';

const wss = new WebSocketServer({ port: 8765 });

interface GameState {
  x: number;
  y: number;
}

interface Operation {
  name: string;
  arguments: { dx: number; dy: number };
  timestamp: number;
  author?: string;
}

interface GameData {
  state: GameState;
  history: Operation[];
  recentOps: Operation[];
}

let gameData: GameData = {
  state: { x: 5, y: 5 },
  history: [],
  recentOps: []
};

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

  // 状態を更新
  if (operation.name === 'move_block') {
    gameData.state.x = Math.max(0, Math.min(19, gameData.state.x + operation.arguments.dx));
    gameData.state.y = Math.max(0, Math.min(14, gameData.state.y + operation.arguments.dy));
  }

  // 履歴に追加
  gameData.history.push(operation);
  
  // 最新4件のオペレーションを保持
  gameData.recentOps.push(operation);
  if (gameData.recentOps.length > 4) {
    gameData.recentOps.shift();
  }

  // 全クライアントに更新を配信
  const updateMessage = JSON.stringify({
    type: 'game_update',
    data: gameData,
    latestOp: operation
  });

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(updateMessage);
    }
  });

  console.log(`📊 ゲーム状態更新: (${gameData.state.x}, ${gameData.state.y}), 履歴: ${gameData.history.length}件`);
}

async function main() {
  console.log('WebSocket server running on port 8765');
  await startChatBridge();
}

main().catch(console.error);