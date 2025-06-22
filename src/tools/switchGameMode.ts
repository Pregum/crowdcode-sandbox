import { createTool } from '@mastra/core';
import { z } from 'zod';

export const switchGameMode = createTool({
  id: 'switchGameMode',
  description: 'ゲームモードを切り替えます（倉庫番/将棋/詰将棋）',
  inputSchema: z.object({
    mode: z.enum(['sokoban', 'shogi', 'tsumeshogi']).describe('切り替えるゲームモード'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    currentMode: z.string(),
    message: z.string().optional(),
  }),
  execute: async ({ mode }) => {
    try {
      const { switchGameMode: serverSwitchGameMode } = await import('../server.js');
      
      // 将棋モードの場合は初期化が必要
      if (mode === 'shogi' || mode === 'tsumeshogi') {
        if (!global.shogiGame) {
          const { ShogiGame } = await import('../game/shogiGame.js');
          global.shogiGame = new ShogiGame();
        } else {
          // 既存のゲームがある場合はリセット
          global.shogiGame.reset();
        }
        
        // グローバル状態に将棋の状態を設定
        global.gameData.shogi = global.shogiGame.getState();
      }
      
      // サーバー側のゲームモードを切り替え
      serverSwitchGameMode(mode);
      
      const modeNames = {
        'sokoban': '倉庫番',
        'shogi': '通常将棋',
        'tsumeshogi': '詰将棋',
      };
      
      return {
        success: true,
        currentMode: modeNames[mode],
        message: `ゲームモードを${modeNames[mode]}に切り替えました`,
      };
    } catch (error) {
      console.error('ゲームモード切り替えエラー:', error);
      return {
        success: false,
        currentMode: '',
        message: `エラーが発生しました: ${error.message}`,
      };
    }
  },
});