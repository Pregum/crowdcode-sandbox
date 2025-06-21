# YouTube Live × Gemini Flash × Mastra PoC

YouTube Liveのチャットメッセージを自然言語処理し、ブラウザ上のグリッドでブロックを動かすリアルタイムデモアプリケーションです。

## 機能

- YouTube Liveチャットからのリアルタイムメッセージ取得
- Gemini 2.5 Flashによる自然言語理解（日本語対応）
- WebSocketによるリアルタイム通信
- 20×15グリッド上でのブロック移動表示
- 操作ログの表示

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

1. ブラウザが自動的に開き、グリッドキャンバスが表示されます
2. 設定したYouTube Liveのチャットに以下のようなコメントを投稿：
   - 「右に一マス動かして」
   - 「左に2マス移動」
   - 「上に動かして」
   - 「下に3マス」

3. ブロックがリアルタイムで移動し、操作ログが表示されます

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

## プロジェクト構成

```
/
├─ src/
│   ├─ tools/moveBlock.ts    # ブロック移動ツール
│   ├─ agent.ts              # Mastraエージェント設定
│   ├─ bridge.ts             # YouTubeチャット連携
│   └─ server.ts             # WebSocketサーバー
├─ public/
│   └─ index.html            # キャンバス表示
├─ mastra.config.ts          # Mastra設定
└─ vite.config.ts            # Vite設定
```

## 注意事項

- YouTube Liveのチャットはライブストリーミングまたはプレミア公開中のみ取得可能
- Gemini APIの利用には制限があります（[料金詳細](https://ai.google.dev/pricing)）
- WebSocketサーバーはローカル環境での動作を想定