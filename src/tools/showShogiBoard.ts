import { createTool } from '@mastra/core';
import { z } from 'zod';

export const showShogiBoard = createTool({
  id: 'showShogiBoard',
  description: '現在の将棋盤の状態を表示します',
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    board: z.string(),
    currentPlayer: z.string(),
    isCheck: z.boolean(),
    isCheckmate: z.boolean(),
    winner: z.string().nullable(),
    message: z.string().optional(),
  }),
  execute: async () => {
    try {
      // サーバーから現在の将棋の状態を取得
      const state = global.gameData?.shogi;
      
      if (!state || global.gameData?.gameMode !== 'shogi') {
        return {
          success: false,
          board: '',
          currentPlayer: '',
          isCheck: false,
          isCheckmate: false,
          winner: null,
          message: '将棋モードではありません。switchGameModeツールで将棋モードに切り替えてください。',
        };
      }

      // 将棋ゲームインスタンスから盤面文字列を取得
      const shogiGame = global.shogiGame;
      if (!shogiGame) {
        return {
          success: false,
          board: '',
          currentPlayer: '',
          isCheck: false,
          isCheckmate: false,
          winner: null,
          message: '将棋ゲームが初期化されていません',
        };
      }

      const boardString = shogiGame.getBoardString();
      
      return {
        success: true,
        board: boardString,
        currentPlayer: state.currentPlayer === 1 ? '先手' : '後手',
        isCheck: state.isCheck || false,
        isCheckmate: state.isCheckmate || false,
        winner: state.winner ? (state.winner === 1 ? '先手' : '後手') : null,
      };
    } catch (error) {
      console.error('盤面表示エラー:', error);
      return {
        success: false,
        board: '',
        currentPlayer: '',
        isCheck: false,
        isCheckmate: false,
        winner: null,
        message: `エラーが発生しました: ${error.message}`,
      };
    }
  },
});