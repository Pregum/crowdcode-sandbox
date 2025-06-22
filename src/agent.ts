import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { moveBlock } from './tools/moveBlock.js';
import { movePlayer } from './tools/movePlayer.js';
import { listTools } from './tools/listTools.js';
import { resetLevel } from './tools/resetLevel.js';
import { generateStage } from './tools/generateStage.js';
import { moveToBox } from './tools/moveToBox.js';
import { jumpToPosition } from './tools/jumpToPosition.js';
import { switchGameMode } from './tools/switchGameMode.js';
import { showShogiBoard } from './tools/showShogiBoard.js';
import { moveShogiPiece } from './tools/moveShogiPiece.js';
import { dropShogiPiece } from './tools/dropShogiPiece.js';
import { resignShogi } from './tools/resignShogi.js';
import { parseShogiMove } from './tools/parseShogiMove.js';
import dotenv from 'dotenv';

dotenv.config();

export const gameAgent = new Agent({
  id: 'game-controller',
  name: 'Game Controller Agent',
  instructions: `あなたはゲームコントローラーです。現在は倉庫番と将棋の両方をプレイできます。

**ゲームモード切り替え**
- "将棋やろう"/"将棋をやろう"/"将棋がしたい"等 → switchGameMode with mode: 'shogi'
- "倉庫番に戻して"/"倉庫番やろう"/"ソコバン"等 → switchGameMode with mode: 'sokoban'
- "詰将棋やりたい" → switchGameMode with mode: 'tsumeshogi'

**倉庫番モード**
- プレイヤーを移動させて箱を目標地点に運んでください
- movePlayer - プレイヤーの基本移動（箱を押すことも可能）
- resetLevel - 現在のレベルを初期状態にリセット
- generateStage - 新しいステージを自動生成
- moveToBox - 指定した箱の位置まで自動で回り込み
- jumpToPosition - 指定した座標に直接ジャンプ

**将棋モード**
- showShogiBoard - 現在の盤面を表示
- parseShogiMove - 自然言語の指し手を解析（推奨：「7六歩」「5五角」「3三銀打ち」等）
- moveShogiPiece - 駒を移動（座標直接指定）
- dropShogiPiece - 持ち駒を打つ（駒種直接指定）
- resignShogi - 投了

**将棋の座標について**
- X座標：1-9（右から左）
- Y座標：1-9（上から下）
- 例：7六歩 = X:7, Y:6の歩

**共通ツール**
- listTools - 利用可能なツール一覧を表示

ユーザーが「将棋やろう」「将棋をしたい」「将棋に切り替え」等と言った場合は、必ずswitchGameModeツールを呼び出してください。
移動コマンドを受け取ったら適切なツールを呼び出してください。`,
  model: google('gemini-2.0-flash-exp', {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
  tools: { 
    // 共通
    switchGameMode,
    listTools,
    // 倉庫番
    movePlayer, 
    moveBlock, // 下位互換
    resetLevel,
    generateStage,
    moveToBox,
    jumpToPosition,
    // 将棋
    showShogiBoard,
    parseShogiMove,
    moveShogiPiece,
    dropShogiPiece,
    resignShogi
  },
});