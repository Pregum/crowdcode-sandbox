import { createTool } from '@mastra/core';
import { z } from 'zod';

export const resetLevel = createTool({
  id: 'resetLevel',
  description: '現在の倉庫番レベルを初期状態にリセットします',
  inputSchema: z.object({
    confirm: z.boolean().optional().default(true).describe('リセットを確認する（安全のため）'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    level: z.number().optional(),
    message: z.string().optional(),
  }),
  execute: async ({ confirm }) => {
    if (!confirm) {
      return {
        success: false,
        message: 'リセットがキャンセルされました',
      };
    }

    // 実際のリセット処理はserver.tsで実行される
    return {
      success: true,
      message: 'レベルをリセットしました',
    };
  },
});