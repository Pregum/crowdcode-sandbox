import { createTool } from '@mastra/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const moveFile = createTool({
  id: 'moveFile',
  description: 'ファイルまたはディレクトリを移動またはリネームします。',
  inputSchema: z.object({
    sourcePath: z.string().describe('移動元のファイルまたはディレクトリのパス（プロジェクトルートからの相対パス）'),
    destinationPath: z.string().describe('移動先のパス（プロジェクトルートからの相対パス）'),
    overwrite: z.boolean().optional().default(false).describe('移動先に既存のファイルがある場合に上書きするか'),
    createDirectories: z.boolean().optional().default(true).describe('移動先の親ディレクトリが存在しない場合に作成するか'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    moved: z.boolean().optional(),
    sourcePath: z.string().optional(),
    destinationPath: z.string().optional(),
    type: z.enum(['file', 'directory']).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ sourcePath, destinationPath, overwrite, createDirectories }) => {
    try {
      // セキュリティのため、プロジェクトルート外へのアクセスを制限
      const sourceAbsolute = path.resolve(process.cwd(), sourcePath);
      const destAbsolute = path.resolve(process.cwd(), destinationPath);
      const projectRoot = process.cwd();
      
      if (!sourceAbsolute.startsWith(projectRoot) || !destAbsolute.startsWith(projectRoot)) {
        return {
          success: false,
          error: 'プロジェクトルート外への移動はできません',
        };
      }

      // 移動元の存在確認
      let sourceStats;
      try {
        sourceStats = await fs.stat(sourceAbsolute);
      } catch {
        return {
          success: false,
          error: '移動元のファイルまたはディレクトリが存在しません',
        };
      }

      // 同じパスへの移動チェック
      if (sourceAbsolute === destAbsolute) {
        return {
          success: false,
          error: '移動元と移動先が同じです',
        };
      }

      // 移動先の親ディレクトリ確認と作成
      const destDir = path.dirname(destAbsolute);
      try {
        await fs.access(destDir);
      } catch {
        if (createDirectories) {
          await fs.mkdir(destDir, { recursive: true });
        } else {
          return {
            success: false,
            error: '移動先の親ディレクトリが存在しません',
          };
        }
      }

      // 移動先の存在確認
      try {
        const destStats = await fs.stat(destAbsolute);
        if (!overwrite) {
          return {
            success: false,
            error: '移動先に既にファイルまたはディレクトリが存在します',
          };
        }
        // 上書きの場合、移動先がディレクトリで中身がある場合はエラー
        if (destStats.isDirectory()) {
          const entries = await fs.readdir(destAbsolute);
          if (entries.length > 0) {
            return {
              success: false,
              error: '移動先のディレクトリが空ではありません',
            };
          }
        }
      } catch {
        // 移動先が存在しない場合は問題なし
      }

      // 移動実行
      await fs.rename(sourceAbsolute, destAbsolute);

      return {
        success: true,
        moved: true,
        sourcePath: path.relative(projectRoot, sourceAbsolute),
        destinationPath: path.relative(projectRoot, destAbsolute),
        type: sourceStats.isDirectory() ? 'directory' : 'file',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '移動に失敗しました',
      };
    }
  },
});