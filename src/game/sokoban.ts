export enum CellType {
  FLOOR = 0,    // 床
  WALL = 1,     // 壁
  TARGET = 2,   // 目標地点
  BOX = 3,      // 箱
  PLAYER = 4,   // プレイヤー
  BOX_ON_TARGET = 5, // 目標地点上の箱
  PLAYER_ON_TARGET = 6, // 目標地点上のプレイヤー
}

export interface Position {
  x: number;
  y: number;
}

export interface SokobanState {
  width: number;
  height: number;
  player: Position;
  boxes: Position[];
  targets: Position[];
  walls: Position[];
  level: number;
  moves: number;
  isCompleted: boolean;
}

export interface SokobanLevel {
  id: number;
  name: string;
  width: number;
  height: number;
  map: number[][];
}

// サンプルレベル
export const LEVELS: SokobanLevel[] = [
  {
    id: 1,
    name: "初級レベル",
    width: 8,
    height: 6,
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 4, 3, 2, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  {
    id: 2,
    name: "中級レベル",
    width: 10,
    height: 8,
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 4, 0, 3, 0, 3, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 0, 0, 2, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  }
];

export class SokobanGame {
  private state: SokobanState;

  constructor(levelId: number = 1) {
    this.state = this.initializeLevel(levelId);
  }

  private initializeLevel(levelId: number): SokobanState {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) {
      throw new Error(`レベル ${levelId} が見つかりません`);
    }

    const player: Position = { x: 0, y: 0 };
    const boxes: Position[] = [];
    const targets: Position[] = [];
    const walls: Position[] = [];

    // マップを解析してオブジェクトの位置を抽出
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const cell = level.map[y][x];
        switch (cell) {
          case CellType.PLAYER:
          case CellType.PLAYER_ON_TARGET:
            player.x = x;
            player.y = y;
            if (cell === CellType.PLAYER_ON_TARGET) {
              targets.push({ x, y });
            }
            break;
          case CellType.BOX:
          case CellType.BOX_ON_TARGET:
            boxes.push({ x, y });
            if (cell === CellType.BOX_ON_TARGET) {
              targets.push({ x, y });
            }
            break;
          case CellType.TARGET:
            targets.push({ x, y });
            break;
          case CellType.WALL:
            walls.push({ x, y });
            break;
        }
      }
    }

    return {
      width: level.width,
      height: level.height,
      player,
      boxes,
      targets,
      walls,
      level: levelId,
      moves: 0,
      isCompleted: false,
    };
  }

  public getState(): SokobanState {
    return { ...this.state };
  }

  public movePlayer(dx: number, dy: number): boolean {
    const newX = this.state.player.x + dx;
    const newY = this.state.player.y + dy;

    // 境界チェック
    if (newX < 0 || newX >= this.state.width || newY < 0 || newY >= this.state.height) {
      return false;
    }

    // 壁チェック
    if (this.isWall(newX, newY)) {
      return false;
    }

    // 箱チェック
    const boxIndex = this.getBoxAt(newX, newY);
    if (boxIndex !== -1) {
      // 箱を押そうとしている
      const boxNewX = newX + dx;
      const boxNewY = newY + dy;

      // 箱の移動先をチェック
      if (boxNewX < 0 || boxNewX >= this.state.width || 
          boxNewY < 0 || boxNewY >= this.state.height ||
          this.isWall(boxNewX, boxNewY) ||
          this.getBoxAt(boxNewX, boxNewY) !== -1) {
        return false; // 箱が移動できない
      }

      // 箱を移動
      this.state.boxes[boxIndex] = { x: boxNewX, y: boxNewY };
    }

    // プレイヤーを移動
    this.state.player = { x: newX, y: newY };
    this.state.moves++;

    // クリア判定
    this.checkCompletion();

    return true;
  }

  private isWall(x: number, y: number): boolean {
    return this.state.walls.some(wall => wall.x === x && wall.y === y);
  }

  private getBoxAt(x: number, y: number): number {
    return this.state.boxes.findIndex(box => box.x === x && box.y === y);
  }

  private checkCompletion(): void {
    // 全ての箱が目標地点にあるかチェック
    const allBoxesOnTargets = this.state.boxes.every(box =>
      this.state.targets.some(target => target.x === box.x && target.y === box.y)
    );

    this.state.isCompleted = allBoxesOnTargets;
  }

  public reset(): void {
    this.state = this.initializeLevel(this.state.level);
  }

  public nextLevel(): boolean {
    const nextLevelId = this.state.level + 1;
    const nextLevel = LEVELS.find(l => l.id === nextLevelId);
    if (nextLevel) {
      this.state = this.initializeLevel(nextLevelId);
      return true;
    }
    return false;
  }

  public getCurrentMap(): CellType[][] {
    // 現在の状態を2Dマップとして返す
    const map: CellType[][] = Array(this.state.height).fill(null).map(() => 
      Array(this.state.width).fill(CellType.FLOOR)
    );

    // 壁を配置
    this.state.walls.forEach(wall => {
      map[wall.y][wall.x] = CellType.WALL;
    });

    // 目標地点を配置
    this.state.targets.forEach(target => {
      map[target.y][target.x] = CellType.TARGET;
    });

    // 箱を配置
    this.state.boxes.forEach(box => {
      const isOnTarget = this.state.targets.some(target => 
        target.x === box.x && target.y === box.y
      );
      map[box.y][box.x] = isOnTarget ? CellType.BOX_ON_TARGET : CellType.BOX;
    });

    // プレイヤーを配置
    const isPlayerOnTarget = this.state.targets.some(target => 
      target.x === this.state.player.x && target.y === this.state.player.y
    );
    map[this.state.player.y][this.state.player.x] = isPlayerOnTarget ? 
      CellType.PLAYER_ON_TARGET : CellType.PLAYER;

    return map;
  }
}