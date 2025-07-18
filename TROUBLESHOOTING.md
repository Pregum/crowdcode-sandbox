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

---

## 時刻(2025/06/21 12:15)

## 概要
Google Generative AI API keyが見つからないエラーが発生。環境変数名の不一致が原因

## 原因
`@ai-sdk/google`パッケージは`GOOGLE_GENERATIVE_AI_API_KEY`環境変数を期待しているが、プロジェクトでは`GOOGLE_API_KEY`を使用していた

## 対策方法
1. `.env`ファイルに`GOOGLE_GENERATIVE_AI_API_KEY`を追加
2. `agent.ts`でモデル設定時に`apiKey`パラメーターを明示的に指定
   - `google('model', { apiKey: process.env.GOOGLE_API_KEY })`
3. `.env.example`も同様に更新

## 関連情報
- `@ai-sdk/google`の標準環境変数名は`GOOGLE_GENERATIVE_AI_API_KEY`
- 両方の環境変数を設定することで互換性を保持
- モデル初期化時にapiKeyオプションで明示的指定も可能

---

## 時刻(2025/06/21 12:35)

## 概要
Geminiはツールを正常に呼び出しているが、Mastraの`response.toolCalls`が空配列になる問題

## 原因
Mastra v0.10.6では、ツール呼び出し情報が`response.toolCalls`ではなく`response.steps`配列内に格納される。Geminiは正常にツールを呼び出しているが、APIレスポンス構造の違いによりツール呼び出しが検出されていなかった。

## 対策方法
1. `response.toolCalls`と`response.steps`の両方をチェックするロジックに変更
2. `response.steps`配列内の各stepの`toolCalls`を確認
3. 型定義に`steps`プロパティを追加

```typescript
// 修正前
if (response.toolCalls && response.toolCalls.length > 0) {
  // ツール処理
}

// 修正後
let toolCallsFound = false;
// response.toolCallsをチェック
if (response.toolCalls && response.toolCalls.length > 0) {
  // ツール処理
  toolCallsFound = true;
}
// response.stepsからもチェック
if (!toolCallsFound && response.steps) {
  for (const step of response.steps) {
    if (step.toolCalls && step.toolCalls.length > 0) {
      // ツール処理
      toolCallsFound = true;
    }
  }
}
```

## 関連情報
- Mastra v0.10.6のAPIレスポンス構造では`steps`配列が主要なツール情報源
- Geminiは正常にツールを実行しているが、Mastraのレスポンス構造が異なる
- この問題により表面的には「ツールが呼ばれていない」ように見えていた