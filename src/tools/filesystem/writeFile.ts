import { createTool } from '@mastra/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const writeFile = createTool({
  id: 'writeFile',
  description: 'ファイルに内容を書き込みます。新規作成または既存ファイルの上書きができます。',
  inputSchema: z.object({
    filePath: z.string().describe('書き込むファイルのパス（プロジェクトルートからの相対パス）'),
    content: z.string().describe('ファイルに書き込む内容'),
    encoding: z.enum(['utf8', 'base64', 'hex']).optional().default('utf8').describe('ファイルのエンコーディング'),
    createDirectories: z.boolean().optional().default(true).describe('親ディレクトリが存在しない場合に作成するか'),
    append: z.boolean().optional().default(false).describe('既存ファイルに追記するか（falseの場合は上書き）'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    fileInfo: z.object({
      size: z.number(),
      absolutePath: z.string(),
      created: z.boolean(),
    }).optional(),
  }),
  execute: async ({ filePath, content, encoding, createDirectories, append }) => {
    try {
      // セキュリティのため、プロジェクトルート外へのアクセスを制限
      const absolutePath = path.resolve(process.cwd(), filePath);
      const projectRoot = process.cwd();
      
      if (!absolutePath.startsWith(projectRoot)) {
        return {
          success: false,
          error: 'プロジェクトルート外のファイルにはアクセスできません',
        };
      }

      // 親ディレクトリの確認と作成
      const dir = path.dirname(absolutePath);
      try {
        await fs.access(dir);
      } catch {
        if (createDirectories) {
          await fs.mkdir(dir, { recursive: true });
        } else {
          return {
            success: false,
            error: '親ディレクトリが存在しません',
          };
        }
      }

      // ファイルの存在確認
      let exists = false;
      try {
        await fs.access(absolutePath);
        exists = true;
      } catch {
        exists = false;
      }

      // ファイル書き込み
      if (append) {
        await fs.appendFile(absolutePath, content, encoding);
      } else {
        await fs.writeFile(absolutePath, content, encoding);
      }

      // 書き込み後の情報取得
      const stats = await fs.stat(absolutePath);
      
      return {
        success: true,
        fileInfo: {
          size: stats.size,
          absolutePath,
          created: !exists,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ファイルの書き込みに失敗しました',
      };
    }
  },
});