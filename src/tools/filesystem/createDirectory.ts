import { createTool } from '@mastra/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const createDirectory = createTool({
  id: 'createDirectory',
  description: 'ディレクトリを作成します。親ディレクトリが存在しない場合は再帰的に作成できます。',
  inputSchema: z.object({
    directoryPath: z.string().describe('作成するディレクトリのパス（プロジェクトルートからの相対パス）'),
    recursive: z.boolean().optional().default(true).describe('親ディレクトリも再帰的に作成するか'),
    mode: z.string().optional().default('0755').describe('ディレクトリのパーミッション（8進数文字列）'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    created: z.boolean().optional(),
    absolutePath: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ directoryPath, recursive, mode }) => {
    try {
      // セキュリティのため、プロジェクトルート外へのアクセスを制限
      const absolutePath = path.resolve(process.cwd(), directoryPath);
      const projectRoot = process.cwd();
      
      if (!absolutePath.startsWith(projectRoot)) {
        return {
          success: false,
          error: 'プロジェクトルート外のディレクトリは作成できません',
        };
      }

      // ディレクトリの存在確認
      try {
        const stats = await fs.stat(absolutePath);
        if (stats.isDirectory()) {
          return {
            success: true,
            created: false,
            absolutePath,
          };
        } else {
          return {
            success: false,
            error: '指定されたパスにはファイルが既に存在します',
          };
        }
      } catch {
        // ディレクトリが存在しない場合は作成する
      }

      // パーミッションを8進数に変換
      const numericMode = parseInt(mode, 8);

      // ディレクトリ作成
      if (recursive) {
        await fs.mkdir(absolutePath, { recursive: true, mode: numericMode });
      } else {
        // 親ディレクトリの存在確認
        const parentDir = path.dirname(absolutePath);
        try {
          await fs.access(parentDir);
        } catch {
          return {
            success: false,
            error: '親ディレクトリが存在しません。recursiveオプションを有効にしてください',
          };
        }
        await fs.mkdir(absolutePath, { mode: numericMode });
      }
      
      return {
        success: true,
        created: true,
        absolutePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ディレクトリの作成に失敗しました',
      };
    }
  },
});