import { createTool } from '@mastra/core';
import { z } from 'zod';

export const generateStage = createTool({
  id: 'generateStage',
  description: '新しい倉庫番ステージを自動生成します',
  inputSchema: z.object({
    width: z.number().min(5).max(20).optional().describe('ステージの幅（5-20）'),
    height: z.number().min(5).max(20).optional().describe('ステージの高さ（5-20）'),
    boxCount: z.number().min(1).max(10).optional().describe('箱の数（1-10）'),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium').describe('難易度'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    stage: z.object({
      id: z.number(),
      name: z.string(),
      width: z.number(),
      height: z.number(),
      map: z.array(z.array(z.number())),
    }).optional(),
    message: z.string().optional(),
  }),
  execute: async ({ width, height, boxCount, difficulty }) => {
    // パラメータが渡されない場合は10x10から20x20の間でランダムに生成
    if (!width || !height) {
      width = Math.floor(Math.random() * 11) + 10; // 10-20
      height = Math.floor(Math.random() * 11) + 10; // 10-20
    }
    
    // 箱の数もランダムに設定（ステージサイズに応じて調整）
    if (!boxCount) {
      const maxBoxes = Math.min(Math.floor((width * height) / 20), 8);
      boxCount = Math.floor(Math.random() * (maxBoxes - 2)) + 3; // 3〜maxBoxes個
    }
    
    // 簡単なランダムステージ生成アルゴリズム
    console.log(`🏗️ ステージ生成開始: ${width}x${height}, 箱${boxCount}個, 難易度${difficulty}`);
    
    // デバッグ用のパラメータチェック
    if (width < 5 || height < 5 || width > 20 || height > 20) {
      console.error('❌ 無効なステージサイズ:', { width, height });
      return {
        success: false,
        message: `無効なステージサイズ: ${width}x${height}`,
      };
    }
    
    const map: number[][] = Array.from({ length: height }, () => 
      Array.from({ length: width }, () => 0)
    );
    
    console.log(`✅ マップ初期化完了: ${map.length}x${map[0]?.length || 0}`);

    // 外壁を作成
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          map[y][x] = 1; // 壁
        }
      }
    }

    // 内部に壁をランダム配置（難易度により調整）
    const wallDensity = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.15 : 0.2;
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (Math.random() < wallDensity) {
          map[y][x] = 1; // 壁
        }
      }
    }

    // プレイヤーの初期位置（左上の空きスペース）
    let playerX = 1, playerY = 1;
    
    // 安全な位置を探す
    let foundSafePosition = false;
    for (let y = 1; y < height - 1 && !foundSafePosition; y++) {
      for (let x = 1; x < width - 1 && !foundSafePosition; x++) {
        if (map[y] && map[y][x] === 0) {
          playerX = x;
          playerY = y;
          foundSafePosition = true;
        }
      }
    }
    
    // 見つからない場合はデフォルト位置（1,1）を使用し、そこを強制的に空にする
    if (!foundSafePosition) {
      playerX = 1;
      playerY = 1;
      if (map[playerY] && map[playerY].length > playerX) {
        map[playerY][playerX] = 0; // 強制的に空にする
      }
    }
    
    console.log(`🎯 プレイヤー配置: (${playerX}, ${playerY})`);
    
    // 安全性チェック
    if (map[playerY] && map[playerY].length > playerX) {
      map[playerY][playerX] = 4; // プレイヤー
    } else {
      console.error('❌ プレイヤー配置失敗:', { playerX, playerY, mapHeight: map.length, mapWidth: map[0]?.length });
      return {
        success: false,
        message: `プレイヤー配置失敗: (${playerX}, ${playerY})`,
      };
    }

    // 箱と目標地点を配置
    const positions: Array<{x: number, y: number}> = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (map[y][x] === 0) {
          positions.push({x, y});
        }
      }
    }

    // ランダムに箱と目標地点を配置
    const shuffledPositions = positions.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(boxCount * 2, shuffledPositions.length); i++) {
      const pos = shuffledPositions[i];
      if (i < boxCount) {
        // 箱を配置（プレイヤーから少し離れた場所）
        if (Math.abs(pos.x - playerX) + Math.abs(pos.y - playerY) > 2) {
          map[pos.y][pos.x] = 3; // 箱
        }
      } else {
        // 目標地点を配置
        if (map[pos.y][pos.x] === 0) {
          map[pos.y][pos.x] = 2; // 目標地点
        }
      }
    }

    // 箱や目標地点が不足している場合の補完
    let boxesPlaced = 0;
    let targetsPlaced = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === 3) boxesPlaced++;
        if (map[y][x] === 2) targetsPlaced++;
      }
    }

    // 最低限の箱と目標地点を保証
    if (boxesPlaced < boxCount || targetsPlaced < boxCount) {
      for (const pos of shuffledPositions) {
        if (map[pos.y][pos.x] === 0) {
          if (boxesPlaced < boxCount) {
            map[pos.y][pos.x] = 3;
            boxesPlaced++;
          } else if (targetsPlaced < boxCount) {
            map[pos.y][pos.x] = 2;
            targetsPlaced++;
          }
        }
        if (boxesPlaced >= boxCount && targetsPlaced >= boxCount) break;
      }
    }

    const stage = {
      id: Date.now(), // 一意ID
      name: `自動生成ステージ (${difficulty})`,
      width,
      height,
      map,
    };

    return {
      success: true,
      stage,
      message: `${difficulty}難易度のステージを生成しました（${width}x${height}、箱${boxCount}個）`,
    };
  },
});