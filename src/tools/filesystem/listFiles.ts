import { createTool } from '@mastra/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const listFiles = createTool({
  id: 'listFiles',
  description: 'ディレクトリ内のファイルとサブディレクトリをリストします。',
  inputSchema: z.object({
    directoryPath: z.string().optional().default('.').describe('リストするディレクトリのパス（プロジェクトルートからの相対パス）'),
    recursive: z.boolean().optional().default(false).describe('サブディレクトリも再帰的にリストするか'),
    includeHidden: z.boolean().optional().default(false).describe('隠しファイル（.で始まる）を含めるか'),
    filter: z.object({
      extensions: z.array(z.string()).optional().describe('フィルタする拡張子のリスト（例: [".js", ".ts"]）'),
      pattern: z.string().optional().describe('ファイル名のパターン（正規表現）'),
      type: z.enum(['file', 'directory', 'all']).optional().default('all').describe('リストするアイテムのタイプ'),
    }).optional(),
    maxDepth: z.number().optional().default(5).describe('再帰的リストの最大深度'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    items: z.array(z.object({
      name: z.string(),
      path: z.string(),
      type: z.enum(['file', 'directory']),
      size: z.number().optional(),
      lastModified: z.string().optional(),
      extension: z.string().optional(),
    })).optional(),
    totalCount: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ directoryPath, recursive, includeHidden, filter, maxDepth }) => {
    try {
      // セキュリティのため、プロジェクトルート外へのアクセスを制限
      const absolutePath = path.resolve(process.cwd(), directoryPath);
      const projectRoot = process.cwd();
      
      if (!absolutePath.startsWith(projectRoot)) {
        return {
          success: false,
          error: 'プロジェクトルート外のディレクトリにはアクセスできません',
        };
      }

      // ディレクトリの存在確認
      const stats = await fs.stat(absolutePath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          error: '指定されたパスはディレクトリではありません',
        };
      }

      const items: any[] = [];
      
      async function scanDirectory(dirPath: string, depth: number = 0) {
        if (depth > maxDepth) return;
        
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // 隠しファイルのフィルタリング
          if (!includeHidden && entry.name.startsWith('.')) continue;
          
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(process.cwd(), fullPath);
          
          // タイプのフィルタリング
          if (filter?.type && filter.type !== 'all') {
            if (filter.type === 'file' && !entry.isFile()) continue;
            if (filter.type === 'directory' && !entry.isDirectory()) continue;
          }
          
          // 拡張子のフィルタリング
          if (filter?.extensions && entry.isFile()) {
            const ext = path.extname(entry.name);
            if (!filter.extensions.includes(ext)) continue;
          }
          
          // パターンのフィルタリング
          if (filter?.pattern) {
            const regex = new RegExp(filter.pattern);
            if (!regex.test(entry.name)) continue;
          }
          
          const itemStats = await fs.stat(fullPath);
          
          items.push({
            name: entry.name,
            path: relativePath,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: entry.isFile() ? itemStats.size : undefined,
            lastModified: itemStats.mtime.toISOString(),
            extension: entry.isFile() ? path.extname(entry.name) : undefined,
          });
          
          // 再帰的スキャン
          if (recursive && entry.isDirectory()) {
            await scanDirectory(fullPath, depth + 1);
          }
        }
      }
      
      await scanDirectory(absolutePath);
      
      // 結果をソート（ディレクトリ優先、次に名前順）
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      return {
        success: true,
        items,
        totalCount: items.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ディレクトリのリストに失敗しました',
      };
    }
  },
});