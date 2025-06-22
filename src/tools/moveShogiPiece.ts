import { createTool } from '@mastra/core';
import { z } from 'zod';

export const moveShogiPiece = createTool({
  id: 'moveShogiPiece',
  description: '将棋の駒を移動します。座標は将棋の記法（1-9）で指定します',
  inputSchema: z.object({
    fromX: z.number().min(1).max(9).optional().default(7).describe('移動元のX座標（1-9、右から左）'),
    fromY: z.number().min(1).max(9).optional().default(7).describe('移動元のY座標（1-9、上から下）'),
    toX: z.number().min(1).max(9).optional().default(7).describe('移動先のX座標（1-9、右から左）'),
    toY: z.number().min(1).max(9).optional().default(6).describe('移動先のY座標（1-9、上から下）'),
    promote: z.boolean().optional().default(false).describe('成るかどうか'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    board: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async (params) => {
    try {
      console.log(`♟️ 将棋駒移動開始: ${JSON.stringify(params)}`);
      
      let { fromX, fromY, toX, toY, promote } = params;
      
      // contextオブジェクト内のパラメータを取得
      if (params.context) {
        fromX = params.context.fromX ?? fromX;
        fromY = params.context.fromY ?? fromY;
        toX = params.context.toX ?? toX;
        toY = params.context.toY ?? toY;
        promote = params.context.promote ?? promote;
      }
      
      // undefinedパラメータのデフォルト値設定
      if (fromX == null) fromX = 7;
      if (fromY == null) fromY = 7;
      if (toX == null) toX = 7;
      if (toY == null) toY = 6;
      if (promote == null) promote = false;
      
      console.log(`✅ 使用パラメータ: (${fromX},${fromY}) → (${toX},${toY}) 成り:${promote}`);
      
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

      // 移動を実行
      const success = shogiGame.movePiece(
        { x: fromX, y: fromY },
        { x: toX, y: toY },
        promote
      );

      if (success) {
        // 状態を更新
        global.gameData.shogi = shogiGame.getState();
        
        // WebSocketで配信
        const { broadcastOp } = await import('../server.js');
        broadcastOp({
          name: 'moveShogiPiece',
          arguments: { fromX, fromY, toX, toY, promote }
        });

        const boardString = shogiGame.getBoardString();
        return {
          success: true,
          board: boardString,
          message: `駒を(${fromX},${fromY})から(${toX},${toY})へ移動しました${promote ? '（成り）' : ''}`,
        };
      } else {
        return {
          success: false,
          message: '無効な移動です',
        };
      }
    } catch (error) {
      console.error('駒移動エラー:', error);
      return {
        success: false,
        message: `エラーが発生しました: ${error.message}`,
      };
    }
  },
});