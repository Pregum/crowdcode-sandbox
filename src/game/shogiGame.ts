import {
  PieceType,
  Player,
  Position,
  Piece,
  Move,
  ShogiState,
  CapturedPieces,
  getInitialBoard,
  createEmptyCapturedPieces,
  PROMOTION_MAP,
  DEMOTION_MAP,
  PIECE_NAMES
} from './shogi.js';

import {
  getValidMoves,
  getDroppablePositions,
  canPromote,
  mustPromote,
  isCheck,
  isCheckmate,
  positionToIndex,
  indexToPosition
} from './shogiRules.js';

export class ShogiGame {
  private state: ShogiState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): ShogiState {
    return {
      board: getInitialBoard(),
      currentPlayer: Player.SENTE,
      capturedPieces: {
        [Player.SENTE]: createEmptyCapturedPieces(),
        [Player.GOTE]: createEmptyCapturedPieces(),
      },
      moves: [],
      isCheck: false,
      isCheckmate: false,
      winner: null,
    };
  }

  // ゲーム状態を取得
  getState(): ShogiState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // 駒を移動
  movePiece(from: Position, to: Position, promote: boolean = false): boolean {
    const { x: fromX, y: fromY } = positionToIndex(from);
    const { x: toX, y: toY } = positionToIndex(to);
    
    // 移動元の駒を確認
    const piece = this.state.board[fromY][fromX];
    if (piece.type === PieceType.EMPTY || piece.owner !== this.state.currentPlayer) {
      console.error('無効な移動: 移動元に自分の駒がありません');
      return false;
    }

    // 移動可能かチェック
    const validMoves = getValidMoves(this.state.board, from);
    if (!validMoves.some(move => move.x === to.x && move.y === to.y)) {
      console.error('無効な移動: その位置には移動できません');
      return false;
    }

    // 移動先の駒を取得（駒を取る場合）
    const capturedPiece = this.state.board[toY][toX];
    
    // 成りのチェック
    if (promote) {
      if (!canPromote(piece.type, from, to, piece.owner)) {
        console.error('無効な移動: この駒は成れません');
        return false;
      }
    } else if (mustPromote(piece.type, to, piece.owner)) {
      console.error('無効な移動: この駒は必ず成らなければなりません');
      return false;
    }

    // 移動を実行
    this.state.board[fromY][fromX] = { type: PieceType.EMPTY, owner: Player.NONE };
    
    // 成る場合
    let movedPieceType = piece.type;
    if (promote && PROMOTION_MAP[piece.type]) {
      movedPieceType = PROMOTION_MAP[piece.type];
    }
    
    this.state.board[toY][toX] = { type: movedPieceType, owner: piece.owner };

    // 駒を取った場合
    if (capturedPiece.type !== PieceType.EMPTY) {
      // 成り駒は元の駒に戻す
      let capturedType = capturedPiece.type;
      if (DEMOTION_MAP[capturedType]) {
        capturedType = DEMOTION_MAP[capturedType];
      }
      this.state.capturedPieces[this.state.currentPlayer][capturedType]++;
    }

    // 棋譜に記録
    const move: Move = {
      from,
      to,
      piece: piece.type,
      promote,
      captured: capturedPiece.type !== PieceType.EMPTY ? capturedPiece.type : undefined,
    };
    this.state.moves.push(move);

    // 手番交代
    this.state.currentPlayer = this.state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;

    // 王手・詰みチェック
    this.state.isCheck = isCheck(this.state.board, this.state.currentPlayer);
    this.state.isCheckmate = isCheckmate(this.state.board, this.state.currentPlayer);
    
    if (this.state.isCheckmate) {
      this.state.winner = this.state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
    }

    return true;
  }

  // 持ち駒を打つ
  dropPiece(piece: PieceType, to: Position): boolean {
    const { x: toX, y: toY } = positionToIndex(to);
    
    // 持ち駒を持っているかチェック
    if (this.state.capturedPieces[this.state.currentPlayer][piece] === 0) {
      console.error('無効な移動: その駒を持っていません');
      return false;
    }

    // 打てる位置かチェック
    const droppablePositions = getDroppablePositions(this.state.board, piece, this.state.currentPlayer);
    if (!droppablePositions.some(pos => pos.x === to.x && pos.y === to.y)) {
      console.error('無効な移動: その位置には打てません');
      return false;
    }

    // 駒を打つ
    this.state.board[toY][toX] = { type: piece, owner: this.state.currentPlayer };
    this.state.capturedPieces[this.state.currentPlayer][piece]--;

    // 棋譜に記録
    const move: Move = {
      from: null,
      to,
      piece,
    };
    this.state.moves.push(move);

    // 手番交代
    this.state.currentPlayer = this.state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;

    // 王手・詰みチェック
    this.state.isCheck = isCheck(this.state.board, this.state.currentPlayer);
    this.state.isCheckmate = isCheckmate(this.state.board, this.state.currentPlayer);
    
    if (this.state.isCheckmate) {
      this.state.winner = this.state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
    }

    return true;
  }

  // 投了
  resign(): void {
    this.state.winner = this.state.currentPlayer === Player.SENTE ? Player.GOTE : Player.SENTE;
  }

  // ゲームをリセット
  reset(): void {
    this.state = this.createInitialState();
  }

  // 盤面を文字列で表示
  getBoardString(): string {
    let result = '  ９８７６５４３２１\n';
    result += '  ─────────────────\n';
    
    for (let y = 0; y < 9; y++) {
      result += `${['一', '二', '三', '四', '五', '六', '七', '八', '九'][y]}|`;
      
      for (let x = 0; x < 9; x++) {
        const piece = this.state.board[y][x];
        if (piece.type === PieceType.EMPTY) {
          result += '　';
        } else {
          const pieceName = PIECE_NAMES[piece.type];
          if (piece.owner === Player.GOTE) {
            result += `v${pieceName}`;
          } else {
            result += ` ${pieceName}`;
          }
        }
      }
      result += '|\n';
    }
    
    result += '  ─────────────────\n';
    
    // 持ち駒を表示
    result += '\n持ち駒:\n';
    result += `先手: ${this.getCapturedPiecesString(Player.SENTE)}\n`;
    result += `後手: ${this.getCapturedPiecesString(Player.GOTE)}\n`;
    
    // 手番を表示
    result += `\n手番: ${this.state.currentPlayer === Player.SENTE ? '先手' : '後手'}`;
    
    if (this.state.isCheck) {
      result += ' (王手)';
    }
    
    if (this.state.isCheckmate) {
      result += ` - ${this.state.winner === Player.SENTE ? '先手' : '後手'}の勝ち！`;
    }
    
    return result;
  }

  // 持ち駒を文字列で表示
  private getCapturedPiecesString(player: Player): string {
    const pieces = this.state.capturedPieces[player];
    const result: string[] = [];
    
    const pieceOrder = [
      PieceType.HISHA,
      PieceType.KAKU,
      PieceType.KIN,
      PieceType.GIN,
      PieceType.KEI,
      PieceType.KYO,
      PieceType.FU
    ];
    
    for (const type of pieceOrder) {
      if (pieces[type] > 0) {
        result.push(`${PIECE_NAMES[type]}${pieces[type] > 1 ? pieces[type] : ''}`);
      }
    }
    
    return result.length > 0 ? result.join(' ') : 'なし';
  }

  // 指定位置の駒の移動可能位置を取得
  getValidMovesForPiece(from: Position): Position[] {
    return getValidMoves(this.state.board, from);
  }

  // 指定の持ち駒を打てる位置を取得
  getDroppablePositionsForPiece(piece: PieceType): Position[] {
    return getDroppablePositions(this.state.board, piece, this.state.currentPlayer);
  }
}