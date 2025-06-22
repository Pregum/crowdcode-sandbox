import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { filesystemTools } from './tools/filesystem/index.js';

export const filesystemAgent = new Agent({
  id: 'filesystem-agent',
  name: 'Filesystem Agent',
  instructions: `あなたはファイルシステム操作を支援するアシスタントです。
自然言語でファイル操作のリクエストを受け取り、適切なツールを使って実行します。

使用可能な操作:
- ファイルの読み取り
- ファイルの書き込み（作成・更新）
- ディレクトリ内のファイル一覧表示
- ディレクトリの作成
- ファイル・ディレクトリの削除
- ファイル・ディレクトリの移動・リネーム

安全性のため、以下の制限があります:
- プロジェクトルート外へのアクセスは不可
- 重要なファイル（package.json、.git等）の削除は不可

リクエスト例:
- "srcディレクトリの中身を見せて"
- "test.txtというファイルを作って、'Hello World'と書いて"
- "oldファイルをnewにリネームして"
- "tempディレクトリを作成して"
- "不要なファイルを削除して"`,
  model: google('gemini-2.5-flash', {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
  tools: filesystemTools,
});