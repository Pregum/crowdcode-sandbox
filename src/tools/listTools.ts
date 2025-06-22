import { createTool } from '@mastra/core';
import { z } from 'zod';

export const listTools = createTool({
  id: 'listTools',
  description: '利用可能なツールの一覧とその説明を表示します',
  inputSchema: z.object({
    category: z.enum(['all', 'game', 'filesystem']).optional().default('all').describe('表示するツールのカテゴリ'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    tools: z.array(z.object({
      name: z.string(),
      description: z.string(),
      category: z.string(),
    })),
  }),
  execute: async ({ category }) => {
    const allTools = [
      // ゲーム関連ツール
      {
        name: 'movePlayer',
        description: '倉庫番ゲームのプレイヤーを移動させます。箱を押すこともできます。',
        category: 'game'
      },
      {
        name: 'moveBlock',
        description: 'シンプルモードでブロックを移動させます（下位互換）。',
        category: 'game'
      },
      {
        name: 'listTools',
        description: '利用可能なツールの一覧とその説明を表示します。',
        category: 'game'
      },
      {
        name: 'resetLevel',
        description: '現在の倉庫番レベルを初期状態にリセットします。',
        category: 'game'
      },
      {
        name: 'generateStage',
        description: '新しい倉庫番ステージを自動生成します。',
        category: 'game'
      },
      {
        name: 'moveToBox',
        description: '指定した箱の位置まで自動で回り込みます。',
        category: 'game'
      },
      // ファイルシステム関連ツール
      {
        name: 'readFile',
        description: 'ファイルの内容を読み取ります。',
        category: 'filesystem'
      },
      {
        name: 'writeFile',
        description: 'ファイルに内容を書き込みます。新規作成または既存ファイルの上書きができます。',
        category: 'filesystem'
      },
      {
        name: 'listFiles',
        description: 'ディレクトリ内のファイルとサブディレクトリをリストします。',
        category: 'filesystem'
      },
      {
        name: 'createDirectory',
        description: 'ディレクトリを作成します。',
        category: 'filesystem'
      },
      {
        name: 'deleteFile',
        description: 'ファイルまたはディレクトリを削除します。',
        category: 'filesystem'
      },
      {
        name: 'moveFile',
        description: 'ファイルまたはディレクトリを移動またはリネームします。',
        category: 'filesystem'
      },
    ];

    const filteredTools = category === 'all' 
      ? allTools 
      : allTools.filter(tool => tool.category === category);

    return {
      success: true,
      tools: filteredTools,
    };
  },
});