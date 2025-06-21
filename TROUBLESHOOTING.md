# トラブルシューティング記録

## 時刻(2025/06/21 11:47)

## 概要
npm installを実行した際に、`@letruxux/youtube-chat@^2.1.1`パッケージが見つからないエラーが発生

## 原因
package.jsonで指定されているバージョン2.1.1が存在しない。npmレジストリに公開されている最新バージョンは1.0.7である。

## 対策方法
1. package.jsonのバージョン指定を正しいバージョンに修正
   - `"@letruxux/youtube-chat": "^2.1.1"` → `"@letruxux/youtube-chat": "^1.0.7"`
2. または最新バージョンを使用
   - `npm install @letruxux/youtube-chat@latest`

## 関連情報
- npm公式パッケージページ: https://www.npmjs.com/package/@letruxux/youtube-chat
- GitHubリポジトリ: https://github.com/letruxux/youtube-chat
- 代替パッケージ:
  - `youtube-chat` (by LinaTsukusu) - version 2.2.0
  - `@freetube/youtube-chat` - アクティブにメンテナンスされているfork

---

## 時刻(2025/06/21 11:50)

## 概要
`npx mastra dev`実行時に、admin panel関連のファイルが見つからないエラーが発生

## 原因
Mastraの`mastra dev`コマンドは、完全なMastraフレームワークプロジェクト用であり、カスタム実装には適していない。必要なインフラストラクチャ（PostgreSQL、Inngest）も未設定。

## 対策方法
1. Mastraフレームワークを使わず、直接実行する方法に変更
   - package.jsonのscriptsを更新
   - サーバーとViteを個別に起動

## 関連情報
- Mastraは完全なフレームワークで、PostgreSQLとInngestが必要
- 現在の実装はMastraのツールとエージェントのみを使用したカスタム実装
- `mastra init`による初期化が本来必要だが、今回のPoCには過剰

---

## 時刻(2025/06/21 11:55)

## 概要
`createTool`が`mastra`パッケージからインポートできないエラーが発生

## 原因
`mastra`パッケージ（v0.1.46）はCLIツールのみで、SDK機能は`@mastra/core`パッケージに分離されている

## 対策方法
1. `@mastra/core`パッケージを追加インストール
   - `npm install @mastra/core`
2. インポートを修正
   - `import { createTool } from 'mastra'` → `import { createTool } from '@mastra/core'`
   - `import { Agent } from 'mastra'` → `import { Agent } from '@mastra/core/agent'`

## 関連情報
- `mastra` v0.1.46はCLIパッケージのみ
- `@mastra/core` v0.10.6がSDK機能を提供
- APIは同じだが、パッケージ構造が変更されている

---

## 時刻(2025/06/21 12:10)

## 概要
`gameAgent.run is not a function`エラーが発生。Mastraエージェントの実行方法が間違っていた

## 原因
1. `@mastra/core`のAgentクラスには`run()`メソッドが存在しない
2. 正しくは`generate()`メソッドを使用する必要がある
3. モデル設定形式が間違っていた（AI SDK形式でない）
4. ツールの構造が配列ではなくオブジェクト形式である必要がある

## 対策方法
1. `@ai-sdk/google`パッケージを追加インストール
2. モデル設定を`google('gemini-2.0-flash-exp')`形式に変更
3. `gameAgent.run()`を`gameAgent.generate()`に変更
4. ツール呼び出しの応答形式を修正（`toolCall.toolName`、`toolCall.args`）
5. メッセージ形式を直接配列に変更

## 関連情報
- `@mastra/core` v0.10.6の正しいAPI形式
- AI SDK Googleプロバイダーの使用が必須
- `generate()`メソッドに`maxSteps`オプションでツール使用を有効化