import { createTool } from '@mastra/core';
import { z } from 'zod';

export const switchGameMode = createTool({
  id: 'switchGameMode',
  description: 'ゲームモードを切り替えます（倉庫番/将棋/詰将棋）',
  inputSchema: z.object({
    mode: z.enum(['sokoban', 'shogi', 'tsumeshogi']).default('shogi').describe('切り替えるゲームモード'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    currentMode: z.string(),
    message: z.string().optional(),
  }),
  execute: async ({ mode }) => {
    try {
      console.log(`🔄 ゲームモード切り替え開始: ${mode}`);
      
      // パラメータ検証
      if (!mode || !['sokoban', 'shogi', 'tsumeshogi'].includes(mode)) {
        return {
          success: false,
          currentMode: '',
          message: `無効なゲームモード: ${mode}`,
        };
      }
      
      const { switchGameMode: serverSwitchGameMode } = await import('../server.js');
      
      // サーバー側のゲームモードを切り替え
      console.log(`📡 サーバー側のゲームモード切り替えを実行`);
      serverSwitchGameMode(mode);
      
      const modeNames = {
        'sokoban': '倉庫番',
        'shogi': '通常将棋',
        'tsumeshogi': '詰将棋',
      };
      
      console.log(`✅ ゲームモード切り替え完了: ${modeNames[mode]}`);
      
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