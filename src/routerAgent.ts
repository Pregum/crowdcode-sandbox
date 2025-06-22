import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { routeToAgent } from './tools/routeToAgent.js';

export const routerAgent = new Agent({
  id: 'router-agent',
  name: 'Router Agent',
  instructions: `あなたはメッセージを適切なエージェントにルーティングする司令塔です。

利用可能なエージェント:
1. **game**: ゲームコントロール（ブロック移動）
   - 用途: グリッド上のブロック移動
   - 例: "右に動かして", "左に2マス", "上に移動"

2. **filesystem**: ファイルシステム操作
   - 用途: ファイル・ディレクトリの読み書き、作成、削除、移動
   - 例: "ファイルを作って", "ディレクトリを見せて", "ファイルを読んで"

判断基準:
- **移動・動く・マス・グリッド** → game
- **ファイル・ディレクトリ・作成・読み取り・書き込み・削除** → filesystem
- 曖昧な場合は文脈から最も適切なものを選択

必ずrouteToAgentツールを使ってエージェントを選択してください。`,
  model: google('gemini-2.0-flash-exp', {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
  tools: { routeToAgent },
});