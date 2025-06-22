import { createTool } from '@mastra/core';
import { z } from 'zod';

export const undoShogiMove = createTool({
  id: 'undoShogiMove',
  description: '将棋の最後の手を取り消します（まった機能）',
  inputSchema: z.object({
    steps: z.number().optional().default(1).describe('戻す手数（デフォルト: 1手）'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    board: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async (params) => {
    try {
      console.log(`⏪ 将棋まった開始: ${JSON.stringify(params)}`);
      
      let { steps } = params;
      
      // contextオブジェクト内のパラメータを取得
      if (params.context && params.context.steps) {
        steps = params.context.steps;
      }
      
      // undefinedの場合はデフォルト値を設定
      if (steps == null) steps = 1;
      
      console.log(`✅ 戻す手数: ${steps}`);
      
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

      const state = global.gameData.shogi;
      if (!state || !state.moves || state.moves.length === 0) {
        return {
          success: false,
          message: '戻せる手がありません',
        };
      }

      // 戻す手数が履歴より多い場合は調整
      const actualSteps = Math.min(steps, state.moves.length);
      
      console.log(`📚 現在の手数: ${state.moves.length}, 戻す手数: ${actualSteps}`);

      // 指定した手数分戻す
      for (let i = 0; i < actualSteps; i++) {
        const lastMove = state.moves.pop();
        if (!lastMove) break;
        
        console.log(`⏪ ${i + 1}手目を取り消し: (${lastMove.from.x},${lastMove.from.y}) → (${lastMove.to.x},${lastMove.to.y})`);
        
        // 盤面を復元
        const piece = state.board[lastMove.to.y - 1][9 - lastMove.to.x];
        if (piece) {
          // 移動元に戻す
          state.board[lastMove.from.y - 1][9 - lastMove.from.x] = piece;
          state.board[lastMove.to.y - 1][9 - lastMove.to.x] = null;
          
          // 取った駒があれば復元
          if (lastMove.capturedPiece) {
            state.board[lastMove.to.y - 1][9 - lastMove.to.x] = lastMove.capturedPiece;
            
            // 持ち駒から削除
            const capturedType = lastMove.capturedPiece.type;
            const playerCaptures = piece.owner === 0 ? state.player1Captures : state.player2Captures;
            const index = playerCaptures.indexOf(capturedType);
            if (index > -1) {
              playerCaptures.splice(index, 1);
            }
          }
          
          // 成りを戻す
          if (lastMove.wasPromoted) {
            piece.type = getUnpromotedType(piece.type);
          }
        }
        
        // 手番を戻す
        state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
      }

      // ShogiGameクラスの状態も更新
      shogiGame.setState(state);
      
      // WebSocketで配信
      const { broadcastOp } = await import('../server.js');
      broadcastOp({
        name: 'undoShogiMove',
        arguments: { steps: actualSteps }
      });

      const boardString = shogiGame.getBoardString();
      return {
        success: true,
        board: boardString,
        message: `${actualSteps}手戻しました。まった！`,
      };
    } catch (error) {
      console.error('まったエラー:', error);
      return {
        success: false,
        message: `エラーが発生しました: ${error.message}`,
      };
    }
  },
});

// 成り駒を元の駒に戻す
function getUnpromotedType(promotedType: number): number {
  const unpromotionMap: { [key: number]: number } = {
    9: 1,   // と → 歩
    10: 2,  // 杏 → 香
    11: 3,  // 圭 → 桂
    12: 4,  // 全 → 銀
    13: 6,  // 馬 → 角
    14: 7,  // 龍 → 飛
  };
  return unpromotionMap[promotedType] || promotedType;
}