import { createTool } from '@mastra/core';
import { z } from 'zod';

export const switchGameMode = createTool({
  id: 'switchGameMode',
  description: 'ゲームモードを切り替えます。必ずmodeパラメータを指定してください（sokoban/shogi/tsumeshogi）',
  inputSchema: z.object({
    mode: z.enum(['sokoban', 'shogi', 'tsumeshogi']).optional().default('shogi').describe('切り替えるゲームモード（デフォルト: shogi）'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    currentMode: z.string(),
    message: z.string().optional(),
  }),
  execute: async (params) => {
    try {
      // パラメータをデバッグ
      console.log(`🔄 ゲームモード切り替え開始: ${JSON.stringify(params)}`);
      
      let { mode } = params;
      
      // contextオブジェクト内のmodeを取得
      if (params.context && params.context.mode) {
        mode = params.context.mode;
      }
      
      // undefinedの場合はデフォルト値を設定
      if (!mode) {
        console.log(`⚠️ modeがundefinedのため、デフォルト値'shogi'を使用`);
        mode = 'shogi';
      }
      
      // パラメータ検証
      if (!['sokoban', 'shogi', 'tsumeshogi'].includes(mode)) {
        return {
          success: false,
          currentMode: '',
          message: `無効なゲームモード: ${mode}`,
        };
      }
      
      console.log(`✅ 使用するモード: ${mode}`);
      
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
        message: `✅ ゲームモードを${modeNames[mode]}に切り替えました。これで${modeNames[mode]}をプレイできます！`,
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