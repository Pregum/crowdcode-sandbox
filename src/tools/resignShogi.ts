import { createTool } from '@mastra/core';
import { z } from 'zod';

export const resignShogi = createTool({
  id: 'resignShogi',
  description: '将棋で投了します',
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    winner: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async () => {
    try {
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

      const state = shogiGame.getState();
      const resigningPlayer = state.currentPlayer === 1 ? '先手' : '後手';
      
      // 投了を実行
      shogiGame.resign();
      
      // 状態を更新
      global.gameData.shogi = shogiGame.getState();
      const winner = global.gameData.shogi.winner === 1 ? '先手' : '後手';
      
      // WebSocketで配信
      const { broadcastOp } = await import('../server.js');
      broadcastOp({
        name: 'resignShogi',
        arguments: {}
      });

      return {
        success: true,
        winner,
        message: `${resigningPlayer}が投了しました。${winner}の勝ちです！`,
      };
    } catch (error) {
      console.error('投了エラー:', error);
      return {
        success: false,
        message: `エラーが発生しました: ${error.message}`,
      };
    }
  },
});