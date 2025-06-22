import { createTool } from '@mastra/core';
import { z } from 'zod';
import { PieceType } from '../game/shogi.js';

export const dropShogiPiece = createTool({
  id: 'dropShogiPiece',
  description: '持ち駒を盤上に打ちます',
  inputSchema: z.object({
    piece: z.enum(['FU', 'KYO', 'KEI', 'GIN', 'KIN', 'KAKU', 'HISHA']).describe('打つ駒の種類'),
    x: z.number().min(1).max(9).describe('打つ位置のX座標（1-9、右から左）'),
    y: z.number().min(1).max(9).describe('打つ位置のY座標（1-9、上から下）'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    board: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async (params) => {
    try {
      console.log(`🎲 持ち駒打ち開始: ${JSON.stringify(params)}`);
      
      let { piece, x, y } = params;
      
      // contextオブジェクト内のパラメータを取得
      if (params.context) {
        piece = params.context.piece ?? piece;
        x = params.context.x ?? x;
        y = params.context.y ?? y;
      }
      
      console.log(`✅ 使用パラメータ: ${piece} → (${x},${y})`);
      if (global.gameData?.gameMode !== 'shogi') {
        return {
          success: false,
          message: '将棋モードではありません。switchGameModeツールで将棋モードに切り替えてください。',
        };
      }

      const shogiGame = global.shogiGame;
      if (!shogiGame) {
        return {
          success: false,
          message: '将棋ゲームが初期化されていません',
        };
      }

      // 駒の種類をEnumに変換
      const pieceTypeMap: { [key: string]: PieceType } = {
        'FU': PieceType.FU,
        'KYO': PieceType.KYO,
        'KEI': PieceType.KEI,
        'GIN': PieceType.GIN,
        'KIN': PieceType.KIN,
        'KAKU': PieceType.KAKU,
        'HISHA': PieceType.HISHA,
      };

      const pieceType = pieceTypeMap[piece];
      
      // 持ち駒を打つ
      const success = shogiGame.dropPiece(pieceType, { x, y });

      if (success) {
        // 状態を更新
        global.gameData.shogi = shogiGame.getState();
        
        // WebSocketで配信
        const { broadcastOp } = await import('../server.js');
        broadcastOp({
          name: 'dropShogiPiece',
          arguments: { piece, x, y }
        });

        const boardString = shogiGame.getBoardString();
        const pieceNames: { [key: string]: string } = {
          'FU': '歩',
          'KYO': '香',
          'KEI': '桂',
          'GIN': '銀',
          'KIN': '金',
          'KAKU': '角',
          'HISHA': '飛',
        };
        
        return {
          success: true,
          board: boardString,
          message: `${pieceNames[piece]}を(${x},${y})に打ちました`,
        };
      } else {
        return {
          success: false,
          message: '無効な手です（その位置には打てません）',
        };
      }
    } catch (error) {
      console.error('持ち駒打ちエラー:', error);
      return {
        success: false,
        message: `エラーが発生しました: ${error.message}`,
      };
    }
  },
});