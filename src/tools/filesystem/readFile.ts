import { createTool } from '@mastra/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const readFile = createTool({
  id: 'readFile',
  description: 'ファイルの内容を読み取ります。テキストファイルやコードファイルの内容を取得できます。',
  inputSchema: z.object({
    filePath: z.string().describe('読み取るファイルのパス（プロジェクトルートからの相対パス）'),
    encoding: z.enum(['utf8', 'base64', 'hex']).optional().default('utf8').describe('ファイルのエンコーディング'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    content: z.string().optional(),
    error: z.string().optional(),
    fileInfo: z.object({
      size: z.number(),
      lastModified: z.string(),
      absolutePath: z.string(),
    }).optional(),
  }),
  execute: async ({ filePath, encoding }) => {
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

      // ファイルの存在確認
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: '指定されたパスはファイルではありません',
        };
      }

      // ファイル読み取り
      const content = await fs.readFile(absolutePath, encoding);
      
      return {
        success: true,
        content,
        fileInfo: {
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          absolutePath,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ファイルの読み取りに失敗しました',
      };
    }
  },
});