import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { moveBlock } from './tools/moveBlock.js';
import { movePlayer } from './tools/movePlayer.js';
import { listTools } from './tools/listTools.js';
import { resetLevel } from './tools/resetLevel.js';
import { generateStage } from './tools/generateStage.js';
import { moveToBox } from './tools/moveToBox.js';
import { jumpToPosition } from './tools/jumpToPosition.js';
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

利用可能なツール：
1. **movePlayer** - プレイヤーの基本移動（箱を押すことも可能）
2. **listTools** - 利用可能なツール一覧を表示
3. **resetLevel** - 現在のレベルを初期状態にリセット
4. **generateStage** - 新しいステージを自動生成
5. **moveToBox** - 指定した箱の位置まで自動で回り込み
6. **jumpToPosition** - 指定した座標に直接ジャンプ（テレポート）

方向の対応：
- 右/みぎ = positive dx (dx: 1, dy: 0)
- 左/ひだり = negative dx (dx: -1, dy: 0)
- 上/うえ = negative dy (dx: 0, dy: -1)
- 下/した = positive dy (dx: 0, dy: 1)

コマンド例：
- "右に動かして" → movePlayer with dx: 1, dy: 0
- "ツール一覧を見せて" → listTools
- "レベルをリセット" → resetLevel
- "新しいステージを作って" → generateStage
- "1番目の箱に回り込んで" → moveToBox with boxIndex: 0
- "座標(5,3)にジャンプして" → jumpToPosition with x: 5, y: 3

移動コマンドを受け取ったら適切なツールを呼び出してください。`,
  model: google('gemini-2.0-flash-exp', {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
  tools: { 
    movePlayer, 
    moveBlock, // 下位互換
    listTools,
    resetLevel,
    generateStage,
    moveToBox,
    jumpToPosition
  },
});