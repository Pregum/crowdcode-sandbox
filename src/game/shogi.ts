// 将棋の駒の種類
export enum PieceType {
  EMPTY = 0,
  FU = 1,      // 歩
  KYO = 2,     // 香
  KEI = 3,     // 桂
  GIN = 4,     // 銀
  KIN = 5,     // 金
  KAKU = 6,    // 角
  HISHA = 7,   // 飛
  OU = 8,      // 王・玉
  TO = 9,      // と金（成歩）
  NARI_KYO = 10, // 成香
  NARI_KEI = 11, // 成桂
  NARI_GIN = 12, // 成銀
  UMA = 13,      // 馬（成角）
  RYU = 14,      // 龍（成飛）
}

// プレイヤー
export enum Player {
  NONE = 0,
  SENTE = 1,  // 先手
  GOTE = 2,   // 後手
}

// 駒の情報
export interface Piece {
  type: PieceType;
  owner: Player;
}

// 位置
export interface Position {
  x: number; // 1-9 (右から左)
  y: number; // 1-9 (上から下)
}

// 指し手
export interface Move {
  from: Position | null; // null の場合は持ち駒を打つ
  to: Position;
  piece: PieceType;
  promote?: boolean;
  captured?: PieceType;
}

// 持ち駒
export interface CapturedPieces {
  [PieceType.FU]: number;
  [PieceType.KYO]: number;
  [PieceType.KEI]: number;
  [PieceType.GIN]: number;
  [PieceType.KIN]: number;
  [PieceType.KAKU]: number;
  [PieceType.HISHA]: number;
}

// ゲーム状態
export interface ShogiState {
  board: Piece[][];  // 9x9の盤面
  currentPlayer: Player;
  capturedPieces: {
    [Player.SENTE]: CapturedPieces;
    [Player.GOTE]: CapturedPieces;
  };
  moves: Move[];  // 棋譜
  isCheck: boolean;
  isCheckmate: boolean;
  winner: Player | null;
}

// 駒の表示名
export const PIECE_NAMES: { [key in PieceType]: string } = {
  [PieceType.EMPTY]: '　',
  [PieceType.FU]: '歩',
  [PieceType.KYO]: '香',
  [PieceType.KEI]: '桂',
  [PieceType.GIN]: '銀',
  [PieceType.KIN]: '金',
  [PieceType.KAKU]: '角',
  [PieceType.HISHA]: '飛',
  [PieceType.OU]: '玉',
  [PieceType.TO]: 'と',
  [PieceType.NARI_KYO]: '杏',
  [PieceType.NARI_KEI]: '圭',
  [PieceType.NARI_GIN]: '全',
  [PieceType.UMA]: '馬',
  [PieceType.RYU]: '龍',
};

// 成れる駒とその成り駒の対応
export const PROMOTION_MAP: { [key in PieceType]?: PieceType } = {
  [PieceType.FU]: PieceType.TO,
  [PieceType.KYO]: PieceType.NARI_KYO,
  [PieceType.KEI]: PieceType.NARI_KEI,
  [PieceType.GIN]: PieceType.NARI_GIN,
  [PieceType.KAKU]: PieceType.UMA,
  [PieceType.HISHA]: PieceType.RYU,
};

// 成り駒を元の駒に戻す対応
export const DEMOTION_MAP: { [key in PieceType]?: PieceType } = {
  [PieceType.TO]: PieceType.FU,
  [PieceType.NARI_KYO]: PieceType.KYO,
  [PieceType.NARI_KEI]: PieceType.KEI,
  [PieceType.NARI_GIN]: PieceType.GIN,
  [PieceType.UMA]: PieceType.KAKU,
  [PieceType.RYU]: PieceType.HISHA,
};

// 初期配置
export function getInitialBoard(): Piece[][] {
  const board: Piece[][] = Array(9).fill(null).map(() => 
    Array(9).fill(null).map(() => ({ type: PieceType.EMPTY, owner: Player.NONE }))
  );

  // 後手の配置（上側）
  // 1段目
  board[0][0] = { type: PieceType.KYO, owner: Player.GOTE };
  board[0][1] = { type: PieceType.KEI, owner: Player.GOTE };
  board[0][2] = { type: PieceType.GIN, owner: Player.GOTE };
  board[0][3] = { type: PieceType.KIN, owner: Player.GOTE };
  board[0][4] = { type: PieceType.OU, owner: Player.GOTE };
  board[0][5] = { type: PieceType.KIN, owner: Player.GOTE };
  board[0][6] = { type: PieceType.GIN, owner: Player.GOTE };
  board[0][7] = { type: PieceType.KEI, owner: Player.GOTE };
  board[0][8] = { type: PieceType.KYO, owner: Player.GOTE };
  
  // 2段目
  board[1][1] = { type: PieceType.HISHA, owner: Player.GOTE };
  board[1][7] = { type: PieceType.KAKU, owner: Player.GOTE };
  
  // 3段目（歩）
  for (let x = 0; x < 9; x++) {
    board[2][x] = { type: PieceType.FU, owner: Player.GOTE };
  }

  // 先手の配置（下側）
  // 7段目（歩）
  for (let x = 0; x < 9; x++) {
    board[6][x] = { type: PieceType.FU, owner: Player.SENTE };
  }
  
  // 8段目
  board[7][1] = { type: PieceType.KAKU, owner: Player.SENTE };
  board[7][7] = { type: PieceType.HISHA, owner: Player.SENTE };
  
  // 9段目
  board[8][0] = { type: PieceType.KYO, owner: Player.SENTE };
  board[8][1] = { type: PieceType.KEI, owner: Player.SENTE };
  board[8][2] = { type: PieceType.GIN, owner: Player.SENTE };
  board[8][3] = { type: PieceType.KIN, owner: Player.SENTE };
  board[8][4] = { type: PieceType.OU, owner: Player.SENTE };
  board[8][5] = { type: PieceType.KIN, owner: Player.SENTE };
  board[8][6] = { type: PieceType.GIN, owner: Player.SENTE };
  board[8][7] = { type: PieceType.KEI, owner: Player.SENTE };
  board[8][8] = { type: PieceType.KYO, owner: Player.SENTE };

  return board;
}

// 空の持ち駒を作成
export function createEmptyCapturedPieces(): CapturedPieces {
  return {
    [PieceType.FU]: 0,
    [PieceType.KYO]: 0,
    [PieceType.KEI]: 0,
    [PieceType.GIN]: 0,
    [PieceType.KIN]: 0,
    [PieceType.KAKU]: 0,
    [PieceType.HISHA]: 0,
  };
}