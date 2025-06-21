import { createTool } from '@mastra/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const deleteFile = createTool({
  id: 'deleteFile',
  description: 'ファイルまたはディレクトリを削除します。慎重に使用してください。',
  inputSchema: z.object({
    targetPath: z.string().describe('削除するファイルまたはディレクトリのパス（プロジェクトルートからの相対パス）'),
    recursive: z.boolean().optional().default(false).describe('ディレクトリの場合、中身も含めて再帰的に削除するか'),
    force: z.boolean().optional().default(false).describe('読み取り専用ファイルも強制的に削除するか'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    deleted: z.boolean().optional(),
    deletedPath: z.string().optional(),
    type: z.enum(['file', 'directory']).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ targetPath, recursive, force }) => {
    try {
      // セキュリティのため、プロジェクトルート外へのアクセスを制限
      const absolutePath = path.resolve(process.cwd(), targetPath);
      const projectRoot = process.cwd();
      
      if (!absolutePath.startsWith(projectRoot)) {
        return {
          success: false,
          error: 'プロジェクトルート外のファイルは削除できません',
        };
      }

      // 重要なファイルの保護
      const protectedPaths = [
        'package.json',
        'package-lock.json',
        '.git',
        '.env',
        'node_modules',
      ];
      
      const relativePath = path.relative(projectRoot, absolutePath);
      if (protectedPaths.some(protectedPath => relativePath.startsWith(protectedPath))) {
        return {
          success: false,
          error: '保護されたファイルまたはディレクトリは削除できません',
        };
      }

      // ファイルの存在確認
      let stats;
      try {
        stats = await fs.stat(absolutePath);
      } catch {
        return {
          success: false,
          error: 'ファイルまたはディレクトリが存在しません',
        };
      }

      const isDirectory = stats.isDirectory();

      if (isDirectory) {
        if (recursive) {
          // ディレクトリとその中身を再帰的に削除
          await fs.rm(absolutePath, { recursive: true, force });
        } else {
          // 空のディレクトリのみ削除
          try {
            await fs.rmdir(absolutePath);
          } catch (error: any) {
            if (error.code === 'ENOTEMPTY') {
              return {
                success: false,
                error: 'ディレクトリが空ではありません。recursiveオプションを有効にしてください',
              };
            }
            throw error;
          }
        }
      } else {
        // ファイルを削除
        if (force) {
          // 書き込み権限を付与してから削除
          await fs.chmod(absolutePath, 0o666);
        }
        await fs.unlink(absolutePath);
      }

      return {
        success: true,
        deleted: true,
        deletedPath: relativePath,
        type: isDirectory ? 'directory' : 'file',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '削除に失敗しました',
      };
    }
  },
});