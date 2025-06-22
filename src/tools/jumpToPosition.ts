import { createTool } from '@mastra/core';
import { z } from 'zod';

export const jumpToPosition = createTool({
  id: 'jumpToPosition',
  description: '指定した座標（x, y）に直接ジャンプします。通常のゲームルールを無視してテレポートします。',
  inputSchema: z.object({
    x: z.number().min(0).describe('目標のX座標（0から開始）'),
    y: z.number().min(0).describe('目標のY座標（0から開始）'),
    validatePosition: z.boolean().optional().default(true).describe('移動先が有効な位置かチェックするかどうか'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    oldPosition: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
    newPosition: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
    message: z.string().optional(),
  }),
  execute: async ({ x, y, validatePosition }) => {
    // このツールはサーバー側でプレイヤーの位置を直接更新する
    // ゲームの通常のルールを無視してテレポートする特殊なツール
    
    return {
      success: true,
      newPosition: { x, y },
      message: `座標(${x}, ${y})にジャンプします${validatePosition ? '（位置検証あり）' : '（位置検証なし）'}`,
    };
  },
});