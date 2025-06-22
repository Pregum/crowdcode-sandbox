import { PieceType, Player, Position, Piece, PROMOTION_MAP, DEMOTION_MAP } from './shogi.js';

// 駒の相対的な移動可能位置を定義
// dx: 横方向の移動 (正: 左へ、負: 右へ)
// dy: 縦方向の移動 (正: 下へ、負: 上へ) ※先手基準
interface MovePattern {
  dx: number;
  dy: number;
  repeat?: boolean; // 飛車や角のように複数マス進める場合
}

// 先手基準での駒の動きパターン
const PIECE_MOVES: { [key in PieceType]: MovePattern[] } = {
  [PieceType.EMPTY]: [],
  
  // 歩：前に1マス
  [PieceType.FU]: [
    { dx: 0, dy: -1 }
  ],
  
  // 香：前に何マスでも
  [PieceType.KYO]: [
    { dx: 0, dy: -1, repeat: true }
  ],
  
  // 桂：前2マス、横1マス
  [PieceType.KEI]: [
    { dx: -1, dy: -2 },
    { dx: 1, dy: -2 }
  ],
  
  // 銀：前・斜め前・斜め後ろ
  [PieceType.GIN]: [
    { dx: 0, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 }
  ],
  
  // 金・成銀・成桂・成香・と金：前・横・斜め前
  [PieceType.KIN]: [
    { dx: 0, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  
  // 角：斜めに何マスでも
  [PieceType.KAKU]: [
    { dx: -1, dy: -1, repeat: true },
    { dx: 1, dy: -1, repeat: true },
    { dx: -1, dy: 1, repeat: true },
    { dx: 1, dy: 1, repeat: true }
  ],
  
  // 飛：縦横に何マスでも
  [PieceType.HISHA]: [
    { dx: 0, dy: -1, repeat: true },
    { dx: 0, dy: 1, repeat: true },
    { dx: -1, dy: 0, repeat: true },
    { dx: 1, dy: 0, repeat: true }
  ],
  
  // 王：全方向に1マス
  [PieceType.OU]: [
    { dx: 0, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 }
  ],
  
  // 成り駒
  [PieceType.TO]: [
    { dx: 0, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  
  [PieceType.NARI_KYO]: [
    { dx: 0, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  
  [PieceType.NARI_KEI]: [
    { dx: 0, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  
  [PieceType.NARI_GIN]: [
    { dx: 0, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  
  // 馬：角の動き＋縦横1マス
  [PieceType.UMA]: [
    { dx: -1, dy: -1, repeat: true },
    { dx: 1, dy: -1, repeat: true },
    { dx: -1, dy: 1, repeat: true },
    { dx: 1, dy: 1, repeat: true },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ],
  
  // 龍：飛車の動き＋斜め1マス
  [PieceType.RYU]: [
    { dx: 0, dy: -1, repeat: true },
    { dx: 0, dy: 1, repeat: true },
    { dx: -1, dy: 0, repeat: true },
    { dx: 1, dy: 0, repeat: true },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 }
  ],
};

// 位置が盤内かチェック
export function isValidPosition(pos: Position): boolean {
  return pos.x >= 1 && pos.x <= 9 && pos.y >= 1 && pos.y <= 9;
}

// 配列インデックスを将棋の座標に変換
export function indexToPosition(x: number, y: number): Position {
  return { x: 9 - x, y: y + 1 };
}

// 将棋の座標を配列インデックスに変換
export function positionToIndex(pos: Position): { x: number, y: number } {
  return { x: 9 - pos.x, y: pos.y - 1 };
}

// 指定位置の駒が移動可能な位置を取得
export function getValidMoves(
  board: Piece[][],
  from: Position,
  checkKingSafety: boolean = true
): Position[] {
  const { x: fromX, y: fromY } = positionToIndex(from);
  const piece = board[fromY][fromX];
  
  if (piece.type === PieceType.EMPTY) {
    return [];
  }
  
  const validMoves: Position[] = [];
  const movePatterns = PIECE_MOVES[piece.type];
  
  for (const pattern of movePatterns) {
    if (pattern.repeat) {
      // 飛車や角のように複数マス進める駒
      for (let i = 1; i < 9; i++) {
        const newX = fromX + (pattern.dx * i * (piece.owner === Player.GOTE ? -1 : 1));
        const newY = fromY + (pattern.dy * i * (piece.owner === Player.GOTE ? -1 : 1));
        
        if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9) break;
        
        const targetPiece = board[newY][newX];
        if (targetPiece.owner === piece.owner) break; // 自分の駒がある
        
        const toPos = indexToPosition(newX, newY);
        if (isLegalMove(board, from, toPos, piece, checkKingSafety)) {
          validMoves.push(toPos);
        }
        
        if (targetPiece.owner !== Player.NONE) break; // 相手の駒を取ったら止まる
      }
    } else {
      // 1マスだけ進める駒
      const newX = fromX + (pattern.dx * (piece.owner === Player.GOTE ? -1 : 1));
      const newY = fromY + (pattern.dy * (piece.owner === Player.GOTE ? -1 : 1));
      
      if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9) {
        const targetPiece = board[newY][newX];
        if (targetPiece.owner !== piece.owner) {
          const toPos = indexToPosition(newX, newY);
          if (isLegalMove(board, from, toPos, piece, checkKingSafety)) {
            validMoves.push(toPos);
          }
        }
      }
    }
  }
  
  return validMoves;
}

// 二歩チェック
function checkNifu(board: Piece[][], x: number, player: Player): boolean {
  for (let y = 0; y < 9; y++) {
    if (board[y][x].type === PieceType.FU && board[y][x].owner === player) {
      return true;
    }
  }
  return false;
}

// 打ち歩詰めチェック（簡易版）
function checkUchifuzume(board: Piece[][], x: number, y: number, player: Player): boolean {
  // TODO: 実装を追加
  return false;
}

// 持ち駒を打てる位置を取得
export function getDroppablePositions(
  board: Piece[][],
  pieceType: PieceType,
  player: Player
): Position[] {
  const positions: Position[] = [];
  
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (board[y][x].type === PieceType.EMPTY) {
        const pos = indexToPosition(x, y);
        
        // 歩の場合の特別ルール
        if (pieceType === PieceType.FU) {
          // 二歩チェック
          if (checkNifu(board, x, player)) continue;
          
          // 行き場のない駒チェック（最奥に歩は打てない）
          if ((player === Player.SENTE && y === 0) || 
              (player === Player.GOTE && y === 8)) continue;
          
          // 打ち歩詰めチェック
          if (checkUchifuzume(board, x, y, player)) continue;
        }
        
        // 香車：最奥に打てない
        if (pieceType === PieceType.KYO) {
          if ((player === Player.SENTE && y === 0) || 
              (player === Player.GOTE && y === 8)) continue;
        }
        
        // 桂馬：最奥2段に打てない
        if (pieceType === PieceType.KEI) {
          if ((player === Player.SENTE && y <= 1) || 
              (player === Player.GOTE && y >= 7)) continue;
        }
        
        positions.push(pos);
      }
    }
  }
  
  return positions;
}

// 移動が合法かチェック
function isLegalMove(
  board: Piece[][],
  from: Position,
  to: Position,
  piece: Piece,
  checkKingSafety: boolean
): boolean {
  // 基本的な移動可能性チェック
  const { x: toX, y: toY } = positionToIndex(to);
  
  // 行き場のない駒チェック
  if (piece.type === PieceType.FU || piece.type === PieceType.KYO) {
    if ((piece.owner === Player.SENTE && toY === 0) || 
        (piece.owner === Player.GOTE && toY === 8)) {
      // 成らない場合は違法
      if (!canPromote(piece.type, from, to, piece.owner)) {
        return false;
      }
    }
  }
  
  if (piece.type === PieceType.KEI) {
    if ((piece.owner === Player.SENTE && toY <= 1) || 
        (piece.owner === Player.GOTE && toY >= 7)) {
      // 成らない場合は違法
      if (!canPromote(piece.type, from, to, piece.owner)) {
        return false;
      }
    }
  }
  
  // 王手放置チェック
  if (checkKingSafety) {
    // TODO: 実装を追加
  }
  
  return true;
}

// 成れるかチェック
export function canPromote(
  pieceType: PieceType,
  from: Position,
  to: Position,
  player: Player
): boolean {
  // 成れない駒
  if (!PROMOTION_MAP[pieceType]) return false;
  
  const { y: fromY } = positionToIndex(from);
  const { y: toY } = positionToIndex(to);
  
  // 敵陣チェック（3段以内）
  if (player === Player.SENTE) {
    return fromY <= 2 || toY <= 2;
  } else {
    return fromY >= 6 || toY >= 6;
  }
}

// 成らなければならないかチェック
export function mustPromote(
  pieceType: PieceType,
  to: Position,
  player: Player
): boolean {
  const { y: toY } = positionToIndex(to);
  
  // 歩・香：最奥
  if (pieceType === PieceType.FU || pieceType === PieceType.KYO) {
    return (player === Player.SENTE && toY === 0) || 
           (player === Player.GOTE && toY === 8);
  }
  
  // 桂：最奥2段
  if (pieceType === PieceType.KEI) {
    return (player === Player.SENTE && toY <= 1) || 
           (player === Player.GOTE && toY >= 7);
  }
  
  return false;
}

// 王の位置を探す
export function findKing(board: Piece[][], player: Player): Position | null {
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (board[y][x].type === PieceType.OU && board[y][x].owner === player) {
        return indexToPosition(x, y);
      }
    }
  }
  return null;
}

// 王手判定
export function isCheck(board: Piece[][], player: Player): boolean {
  const kingPos = findKing(board, player);
  if (!kingPos) return false;
  
  const opponent = player === Player.SENTE ? Player.GOTE : Player.SENTE;
  
  // 相手の全ての駒から王への攻撃をチェック
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = board[y][x];
      if (piece.owner === opponent) {
        const moves = getValidMoves(board, indexToPosition(x, y), false);
        if (moves.some(move => move.x === kingPos.x && move.y === kingPos.y)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 詰み判定（簡易版）
export function isCheckmate(board: Piece[][], player: Player): boolean {
  if (!isCheck(board, player)) return false;
  
  // TODO: 完全な詰み判定の実装
  // 1. 王が逃げられるか
  // 2. 王手している駒を取れるか
  // 3. 合い駒ができるか
  
  return false;
}