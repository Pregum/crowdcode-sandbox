import { createTool } from '@mastra/core';
import { z } from 'zod';

export const parseShogiMove = createTool({
  id: 'parseShogiMove',
  description: '自然言語の将棋の指し手を解析して実行します（例：「7六歩」「角を5五に」「3三銀打ち」など）',
  inputSchema: z.object({
    move: z.string().optional().default('7六歩').describe('将棋の指し手（例：7六歩、5五角、3三銀打ち）'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    board: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async (params) => {
    try {
      console.log(`🎯 将棋指し手解析開始: ${JSON.stringify(params)}`);
      
      let { move } = params;
      
      // contextオブジェクト内のmoveを取得
      if (params.context && params.context.move) {
        move = params.context.move;
      }
      
      // undefinedの場合はデフォルト値を設定
      if (!move) {
        console.log(`⚠️ moveがundefinedのため、デフォルト値'7六歩'を使用`);
        move = '7六歩';
      }
      
      if (global.gameData?.gameMode !== 'shogi') {
        return {
          success: false,
          message: '将棋モードではありません。switchGameModeツールで将棋モードに切り替えてください。',
        };
      }

      const shogiGame = global.shogiGame;
      if (!shogiGame) {
        return {
          success: false,
          message: '将棋ゲームが初期化されていません',
        };
      }

      // 指し手のパターンを解析
      const moveText = move.trim();
      console.log(`📝 解析対象: "${moveText}"`);
      
      // 投了パターン
      if (moveText.match(/投了|まいりました|負けました/)) {
        const { resignShogi } = await import('./resignShogi.js');
        return await resignShogi.execute({});
      }

      // まった（undo）パターン
      if (moveText.match(/まった|待った|戻して|戻る|undo|取り消し|やり直し/)) {
        const { undoShogiMove } = await import('./undoShogiMove.js');
        
        // 手数を抽出（例：「2手まった」「3手戻して」）
        const stepsMatch = moveText.match(/([0-9０-９一二三四五六七八九])手/);
        let steps = 1;
        if (stepsMatch) {
          steps = convertToNumber(stepsMatch[1]);
        }
        
        return await undoShogiMove.execute({ steps });
      }

      // 「同」関連のパターン（例：同じく、同、同歩、同角）
      const sameMatch = moveText.match(/^(同|同じく|同じ|同様に?)([歩香桂銀金角飛玉王と杏圭全馬龍])?(成|不成)?$/);
      if (sameMatch) {
        const lastPos = getLastMovePosition();
        const pieceChar = sameMatch[2] || '歩'; // 駒が指定されていない場合は歩をデフォルト
        const promote = sameMatch[3] === '成';
        
        console.log(`🎯 同じ場所への移動: (${lastPos.x},${lastPos.y}) 駒:${pieceChar}`);
        
        // 移動元を特定
        const from = findMovablePosition(lastPos.x, lastPos.y, pieceChar);
        
        if (!from) {
          return {
            success: false,
            message: `${pieceChar}を(${lastPos.x},${lastPos.y})に移動できる駒が見つかりません`,
          };
        }

        const { moveShogiPiece } = await import('./moveShogiPiece.js');
        return await moveShogiPiece.execute({ 
          fromX: from.x, 
          fromY: from.y, 
          toX: lastPos.x, 
          toY: lastPos.y, 
          promote 
        });
      }

      // 持ち駒を打つパターン（例：3三銀打ち、５五角打）
      const dropMatch = moveText.match(/([1-9１-９])([一二三四五六七八九1-9])([歩香桂銀金角飛])打/);
      if (dropMatch) {
        const x = convertToNumber(dropMatch[1]);
        const y = convertToYNumber(dropMatch[2]);
        const piece = convertToPieceType(dropMatch[3]);
        
        const { dropShogiPiece } = await import('./dropShogiPiece.js');
        return await dropShogiPiece.execute({ piece, x, y });
      }

      // 駒を移動するパターン（例：7六歩、５五角、3三銀成、同歩、76歩）
      const moveMatch = moveText.match(/([1-9１-９同])([一二三四五六七八九1-9１-９])([歩香桂銀金角飛玉王と杏圭全馬龍])(成|不成)?/);
      if (moveMatch) {
        console.log(`🎯 移動パターンマッチ: ${JSON.stringify(moveMatch)}`);
        
        const toX = moveMatch[1] === '同' ? getLastMovePosition().x : convertToNumber(moveMatch[1]);
        const toY = moveMatch[1] === '同' ? getLastMovePosition().y : convertToYNumber(moveMatch[2]);
        const pieceChar = moveMatch[3];
        const promote = moveMatch[4] === '成';
        
        console.log(`🎯 移動先: (${toX},${toY}), 駒: ${pieceChar}, 成り: ${promote}`);
        
        // 移動元を特定
        const from = findMovablePosition(toX, toY, pieceChar);
        
        if (!from) {
          return {
            success: false,
            message: `${pieceChar}を(${toX},${toY})に移動できる駒が見つかりません。盤面を確認してください。`,
          };
        }

        console.log(`🎯 移動実行: (${from.x},${from.y}) → (${toX},${toY})`);

        const { moveShogiPiece } = await import('./moveShogiPiece.js');
        return await moveShogiPiece.execute({ 
          fromX: from.x, 
          fromY: from.y, 
          toX, 
          toY, 
          promote 
        });
      }

      // 簡潔な記法パターン（例：76歩、55角、33銀）
      const shortMoveMatch = moveText.match(/^([1-9１-９])([1-9１-９])([歩香桂銀金角飛玉王と杏圭全馬龍])(成|不成)?$/);
      if (shortMoveMatch) {
        const toX = convertToNumber(shortMoveMatch[1]);
        const toY = convertToNumber(shortMoveMatch[2]); // 数字の場合はそのまま変換
        const pieceChar = shortMoveMatch[3];
        const promote = shortMoveMatch[4] === '成';
        
        console.log(`🎯 簡潔記法マッチ: (${toX},${toY}) ${pieceChar}`);
        
        // 移動元を特定
        const from = findMovablePosition(toX, toY, pieceChar);
        
        if (!from) {
          return {
            success: false,
            message: `${pieceChar}を(${toX},${toY})に移動できる駒が見つかりません。盤面を確認してください。`,
          };
        }

        console.log(`🎯 簡潔記法移動実行: (${from.x},${from.y}) → (${toX},${toY})`);

        const { moveShogiPiece } = await import('./moveShogiPiece.js');
        return await moveShogiPiece.execute({ 
          fromX: from.x, 
          fromY: from.y, 
          toX, 
          toY, 
          promote 
        });
      }

      // 駒の移動（移動元も指定）パターン（例：2八飛、5五角）
      const fullMoveMatch = moveText.match(/([1-9１-９])([一二三四五六七八九1-9])([歩香桂銀金角飛玉王と杏圭全馬龍])([1-9１-９])([一二三四五六七八九1-9])(成|不成)?/);
      if (fullMoveMatch) {
        const fromX = convertToNumber(fullMoveMatch[1]);
        const fromY = convertToYNumber(fullMoveMatch[2]);
        const toX = convertToNumber(fullMoveMatch[4]);
        const toY = convertToYNumber(fullMoveMatch[5]);
        const promote = fullMoveMatch[6] === '成';

        console.log(`🎯 完全記法移動実行: (${fromX},${fromY}) → (${toX},${toY})`);

        const { moveShogiPiece } = await import('./moveShogiPiece.js');
        return await moveShogiPiece.execute({ fromX, fromY, toX, toY, promote });
      }

      return {
        success: false,
        message: `指し手「${move}」を解析できませんでした。例：「7六歩」「5五角」「3三銀打ち」`,
      };
    } catch (error) {
      console.error('指し手解析エラー:', error);
      return {
        success: false,
        message: `エラーが発生しました: ${error.message}`,
      };
    }
  },
});

// 数字を変換
function convertToNumber(str: string): number {
  const zenToHan: { [key: string]: string } = {
    '１': '1', '２': '2', '３': '3', '４': '4', '５': '5',
    '６': '6', '７': '7', '８': '8', '９': '9'
  };
  return parseInt(zenToHan[str] || str);
}

// 段を数字に変換
function convertToYNumber(str: string): number {
  const kanjiToNum: { [key: string]: number } = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9,
    // 全角数字のサポート
    '１': 1, '２': 2, '３': 3, '４': 4, '５': 5,
    '６': 6, '７': 7, '８': 8, '９': 9
  };
  return kanjiToNum[str] || 1;
}

// 駒の種類を変換
function convertToPieceType(char: string): string {
  const pieceMap: { [key: string]: string } = {
    '歩': 'FU',
    '香': 'KYO',
    '桂': 'KEI',
    '銀': 'GIN',
    '金': 'KIN',
    '角': 'KAKU',
    '飛': 'HISHA',
  };
  return pieceMap[char] || 'FU';
}

// 最後の移動位置を取得（同○○用）
function getLastMovePosition(): { x: number, y: number } {
  const state = global.gameData?.shogi;
  if (!state || !state.moves || state.moves.length === 0) {
    console.log(`📍 移動履歴なし、デフォルト位置(5,5)を使用`);
    return { x: 5, y: 5 }; // デフォルト
  }
  const lastMove = state.moves[state.moves.length - 1];
  console.log(`📍 最後の移動位置: (${lastMove.to.x},${lastMove.to.y})`);
  return lastMove.to;
}

// 指定された駒で目的地に移動可能な位置を探す（改良版）
function findMovablePosition(toX: number, toY: number, pieceChar: string): { x: number, y: number } | null {
  const state = global.gameData?.shogi;
  if (!state || !state.board) {
    console.log(`❌ 盤面データが見つかりません`);
    return null;
  }

  const shogiGame = global.shogiGame;
  if (!shogiGame) {
    console.log(`❌ shogiGameが見つかりません`);
    return null;
  }

  console.log(`🔍 駒を探索中: "${pieceChar}" → (${toX},${toY})`);

  // 駒の種類を特定（より包括的なマッピング）
  const pieceTypeMap: { [key: string]: number[] } = {
    '歩': [1, 9],     // 歩、と
    '香': [2, 10],    // 香、杏
    '桂': [3, 11],    // 桂、圭
    '銀': [4, 12],    // 銀、全
    '金': [5],        // 金
    '角': [6, 13],    // 角、馬
    '飛': [7, 14],    // 飛、龍
    '玉': [8], '王': [8], // 玉・王
    // 成り駒
    'と': [9],
    '杏': [10],
    '圭': [11],
    '全': [12],
    '馬': [13],
    '龍': [14],
  };

  const targetTypes = pieceTypeMap[pieceChar];
  if (!targetTypes) {
    console.log(`❌ 不明な駒種: "${pieceChar}"`);
    return null;
  }

  const currentPlayer = state.currentPlayer;
  console.log(`🎮 現在のプレイヤー: ${currentPlayer}`);

  let foundPieces: Array<{pos: {x: number, y: number}, piece: any}> = [];

  // 盤面を走査して、指定された駒を探す
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = state.board[y][x];
      if (piece && piece.owner === currentPlayer && targetTypes.includes(piece.type)) {
        const shogiPos = { x: 9 - x, y: y + 1 }; // 配列インデックスを将棋座標に変換
        foundPieces.push({pos: shogiPos, piece});
        console.log(`📍 候補の駒発見: ${getPieceTypeName(piece.type)} at (${shogiPos.x},${shogiPos.y})`);
      }
    }
  }

  console.log(`🔍 見つかった候補: ${foundPieces.length}個`);

  // 各候補駒について移動可能性をチェック
  for (const candidate of foundPieces) {
    console.log(`🧮 (${candidate.pos.x},${candidate.pos.y})から(${toX},${toY})への移動可能性をチェック`);
    
    try {
      const validMoves = shogiGame.getValidMovesForPiece(candidate.pos);
      console.log(`✅ 有効移動数: ${validMoves ? validMoves.length : 0}`);
      
      if (validMoves && validMoves.some(move => move.x === toX && move.y === toY)) {
        console.log(`🎯 移動可能な駒を発見: (${candidate.pos.x},${candidate.pos.y}) → (${toX},${toY})`);
        return candidate.pos;
      }
    } catch (error) {
      console.log(`⚠️ 移動チェックエラー: ${error.message}`);
    }
  }

  console.log(`❌ ${pieceChar}を(${toX},${toY})に移動できる駒が見つかりませんでした`);
  return null;
}

// 駒タイプ番号から名前を取得
function getPieceTypeName(type: number): string {
  const typeNames: { [key: number]: string } = {
    1: '歩', 2: '香', 3: '桂', 4: '銀', 5: '金', 6: '角', 7: '飛', 8: '玉',
    9: 'と', 10: '杏', 11: '圭', 12: '全', 13: '馬', 14: '龍'
  };
  return typeNames[type] || `不明(${type})`;
}