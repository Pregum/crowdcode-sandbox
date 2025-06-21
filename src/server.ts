import { WebSocketServer } from 'ws';
import { startChatBridge } from './bridge.js';

const wss = new WebSocketServer({ port: 8765 });

interface GameState {
  x: number;
  y: number;
}

interface Operation {
  name: string;
  arguments: { dx: number; dy: number };
}

let gameState: GameState = { x: 5, y: 5 };
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.send(JSON.stringify({
    type: 'state',
    state: gameState,
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

export function broadcastOp(op: Operation) {
  if (op.name === 'move_block') {
    gameState.x = Math.max(0, Math.min(19, gameState.x + op.arguments.dx));
    gameState.y = Math.max(0, Math.min(14, gameState.y + op.arguments.dy));
  }

  const message = JSON.stringify({ type: 'op', op });
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });

  const stateMessage = JSON.stringify({ type: 'state', state: gameState });
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(stateMessage);
    }
  });
}

async function main() {
  console.log('WebSocket server running on port 8765');
  await startChatBridge();
}

main().catch(console.error);