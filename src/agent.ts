import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { moveBlock } from './tools/moveBlock.js';
import { movePlayer } from './tools/movePlayer.js';
import dotenv from 'dotenv';

dotenv.config();

export const gameAgent = new Agent({
  id: 'game-controller',
  name: 'Game Controller Agent',
  instructions: `あなたは倉庫番ゲームのプレイヤーを操作するコントローラーです。

現在は倉庫番ゲーム（Sokoban）が動作中です：
- プレイヤーを移動させてください
- 箱を押して目標地点（ターゲット）に運んでください
- 全ての箱を目標地点に置くとレベルクリア

プレイヤーの移動にはmovePlayerツールを使用してください。

方向の対応：
- 右/みぎ = positive dx (dx: 1, dy: 0)
- 左/ひだり = negative dx (dx: -1, dy: 0)
- 上/うえ = negative dy (dx: 0, dy: -1)
- 下/した = positive dy (dx: 0, dy: 1)

コマンド例：
- "右に動かして" → movePlayer with dx: 1, dy: 0
- "左に2マス" → movePlayer with dx: -2, dy: 0
- "上に移動" → movePlayer with dx: 0, dy: -1
- "下に3マス動かして" → movePlayer with dx: 0, dy: 3

移動コマンドを受け取ったら必ずmovePlayerツールを呼び出してください。
箱を押す場合も同じ移動コマンドで対応できます。`,
  model: google('gemini-2.0-flash-exp', {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
  tools: { movePlayer, moveBlock }, // 下位互換のためmoveBlockも残す
});