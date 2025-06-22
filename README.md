# YouTube Live × Gemini Flash × Mastra PoC

YouTube Liveのチャットメッセージを自然言語処理し、ブラウザ上のグリッドでブロックを動かすリアルタイムデモアプリケーションです。

## 機能

- YouTube Liveチャットからのリアルタイムメッセージ取得
- Gemini 2.5 Flashによる自然言語理解（日本語対応）
- WebSocketによるリアルタイム通信
- 20×15グリッド上でのブロック移動表示
- 操作ログの表示
- ファイルシステム操作ツール（Vibe Coding基盤）
- **マルチエージェント対応**: メッセージを適切なエージェントに自動振り分け

## セットアップ

### 1. 環境変数の設定

`.env.example`を`.env`にコピーして、以下の値を設定してください：

```bash
cp .env.example .env
```

#### VIDEO_ID の取得方法
YouTube Liveの動画URLから取得します。
- 例: `https://www.youtube.com/watch?v=ABC123DEF456` の場合
- `VIDEO_ID=ABC123DEF456`

#### GOOGLE_API_KEY の取得方法
1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Get API key」をクリック
4. 新しいAPIキーを作成、またはコピー

### 2. 依存関係のインストール

```bash
npm install
```

### 3. アプリケーションの起動

```bash
npm run dev
```

これにより以下が同時起動します：
- WebSocketサーバー（ポート8765）+ YouTube Liveチャットリスナー
- Vite開発サーバー（ポート3000）

または個別に起動：
```bash
# サーバーのみ起動
npm run server

# クライアントのみ起動（別ターミナル）
npm run client
```

## 使い方

### テストモード（推奨）

YouTube Liveの準備が整っていない場合は、テストモードを使用できます：

```bash
# テストモードで起動
npm run dev:test
# または
TEST_MODE=true npm run dev
```

テストモードでは以下の方法でメッセージを送信できます：

#### 1. コンソール入力
サーバーのコンソールに直接メッセージを入力してテストできます。

#### 2. HTTP API
```bash
# 個別メッセージの送信
curl -X POST http://localhost:3001/test-message \
  -H "Content-Type: application/json" \
  -d '{"message":"右に一マス動かして","author":"テストユーザー"}'

# 複数のテストメッセージを自動送信
npm run test:messages
```

### YouTube Liveモード

1. `.env`ファイルで`TEST_MODE=false`に設定
2. `npm run dev`で起動
3. 設定したYouTube Liveのチャットに以下のようなコメントを投稿：
   - 「右に一マス動かして」
   - 「左に2マス移動」
   - 「上に動かして」
   - 「下に3マス」

### 動作確認

1. ブラウザで http://localhost:3000 を開く
2. 20×15のグリッドキャンバスが表示される
3. ブロックがリアルタイムで移動し、操作ログが表示される

## 対応コマンド例

- 方向: 右/みぎ、左/ひだり、上/うえ、下/した
- 動作: 動かして/うごかして、移動/いどう
- 数量: 数字 + マス

## 技術スタック

- **@mastra/core**: AIエージェントフレームワーク
- **Gemini 2.5 Flash**: 自然言語処理
- **@letruxux/youtube-chat**: YouTube Liveチャット取得
- **WebSocket**: リアルタイム通信
- **Vite**: フロントエンド開発サーバー
- **TypeScript**: 型安全な開発

## トラブルシューティング

セットアップ中に問題が発生した場合は、[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)を参照してください。

## ファイルシステムツール（Vibe Coding基盤）

プロジェクトには、自然言語でファイル操作ができるツールセットが含まれています：

### 使用可能なツール
- **readFile**: ファイルの内容を読み取り
- **writeFile**: ファイルの作成・更新
- **listFiles**: ディレクトリ内のファイル一覧
- **createDirectory**: ディレクトリの作成
- **deleteFile**: ファイル・ディレクトリの削除
- **moveFile**: ファイル・ディレクトリの移動・リネーム

### テスト方法
```bash
# ファイルシステムエージェントのテスト
npm run test:filesystem
```

## 倉庫番ゲーム用ツール

倉庫番ゲームで利用可能な専用ツール：

### 基本操作ツール
- **movePlayer**: プレイヤーを移動させます（箱を押すことも可能）
- **moveBlock**: シンプルモード用のブロック移動（下位互換）

### 管理・操作ツール  
- **listTools**: 利用可能なツールの一覧とその説明を表示
- **resetLevel**: 現在のレベルを初期状態にリセット
- **generateStage**: 新しい倉庫番ステージを自動生成（難易度・サイズ指定可能）
- **moveToBox**: 指定した箱の位置まで自動で回り込み

### 使用例
```bash
# ツール一覧を確認
curl -X POST http://localhost:3002/test-message \
  -d '{"message":"ツール一覧を見せて","author":"プレイヤー"}'

# レベルリセット
curl -X POST http://localhost:3002/test-message \
  -d '{"message":"レベルをリセット","author":"プレイヤー"}'

# 新しいステージ生成
curl -X POST http://localhost:3002/test-message \
  -d '{"message":"難しいステージを生成して","author":"プレイヤー"}'

# 箱への自動移動
curl -X POST http://localhost:3002/test-message \
  -d '{"message":"1番目の箱に回り込んで","author":"プレイヤー"}'
```

### エージェント自動振り分け

メッセージの内容に基づいて適切なエージェントに自動振り分けされます：

#### ゲームコントロール
- "右に一マス動かして" → gameエージェント
- "左に2マス移動" → gameエージェント
- "レベルをリセット" → gameエージェント
- "新しいステージを作って" → gameエージェント

#### ファイルシステム操作
- "srcディレクトリの中身を見せて" → filesystemエージェント
- "test.txtというファイルを作って、'Hello World'と書いて" → filesystemエージェント
- "oldファイルをnewにリネームして" → filesystemエージェント
- "tempディレクトリを作成して" → filesystemエージェント

## プロジェクト構成

```
/
├─ src/
│   ├─ tools/
│   │   ├─ moveBlock.ts      # ブロック移動ツール（下位互換）
│   │   ├─ movePlayer.ts     # プレイヤー移動ツール
│   │   ├─ listTools.ts      # ツール一覧表示
│   │   ├─ resetLevel.ts     # レベルリセット
│   │   ├─ generateStage.ts  # ステージ自動生成
│   │   ├─ moveToBox.ts      # 箱への自動移動
│   │   └─ filesystem/       # ファイルシステムツール
│   │       ├─ readFile.ts
│   │       ├─ writeFile.ts
│   │       ├─ listFiles.ts
│   │       ├─ createDirectory.ts
│   │       ├─ deleteFile.ts
│   │       └─ moveFile.ts
│   ├─ agent.ts              # ゲームコントローラーエージェント
│   ├─ filesystemAgent.ts    # ファイルシステムエージェント
│   ├─ routerAgent.ts        # ルーターエージェント（振り分け）
│   ├─ agentRegistry.ts      # エージェント管理・ルーティング
│   ├─ bridge.ts             # YouTubeチャット連携
│   └─ server.ts             # WebSocketサーバー
├─ public/
│   └─ index.html            # キャンバス表示
└─ vite.config.ts            # Vite設定
```

## 注意事項

- YouTube Liveのチャットはライブストリーミングまたはプレミア公開中のみ取得可能
- Gemini APIの利用には制限があります（[料金詳細](https://ai.google.dev/pricing)）
- WebSocketサーバーはローカル環境での動作を想定