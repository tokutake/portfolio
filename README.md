# folio

スクリーンショットから保有銘柄を取り込める、個人向けポートフォリオ管理ダッシュボードです。

## Features

- ポートフォリオ総額、当日リターン、累積リターン、現金比率の表示
- パフォーマンスチャートと資産配分の表示
- 保有銘柄一覧の表示・削除
- 証券口座のスクリーンショットをAIで解析
- ティッカー、銘柄名、保有株数、平均取得単価、通貨の抽出
- 抽出結果を確認してからポートフォリオへ追加
- OpenRouter APIキーを画面内のテキストフィールドから入力
- APIキーはブラウザのlocalStorageに保存

## Tech stack

- React
- TypeScript
- Vite
- Lucide React
- OpenRouter Vision API

## Requirements

- Node.js 18+
- OpenRouter API key
- Vision対応モデルへのアクセス

## Setup

```bash
cd /Users/tokutake/Project/portfolio
npm install
npm run dev
```

ブラウザで表示されたローカルURLを開いてください。

## AI import

1. `Import with AI` または `Try AI import` を押す
2. `OpenRouter API key` 欄にAPIキーを入力する
3. 証券口座のスクリーンショットを選択、またはドラッグ＆ドロップする
4. AIが抽出した銘柄を確認する
5. `ポートフォリオに追加` を押す

現在のVisionモデルは `google/gemini-2.5-flash` です。

APIキーは同一ブラウザのlocalStorageに保存されます。共有端末では入力しないでください。

## Scripts

```bash
npm run dev      # 開発サーバー
npm run build    # TypeScriptチェック + 本番ビルド
npm run preview  # 本番ビルドのプレビュー
```

## Architecture

- `src/main.tsx` — ダッシュボード、状態管理、画像アップロード、OpenRouter呼び出し
- `src/styles.css` — UIスタイル
- `vite.config.ts` — Vite設定とOpenRouter開発プロキシ
- `index.html` — アプリのエントリーポイント

開発中のブラウザアプリは、OpenRouter APIへ直接アクセスせず、Viteの同一オリジンプロキシを利用します。

```text
Browser
  │
  └─ /openrouter/api/v1/chat/completions
       │
       └─ Vite dev proxy → OpenRouter API
```

## Data format

AIには次の形式のJSONを要求しています。

```json
{
  "holdings": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "shares": 50,
      "average_price": 210.12,
      "currency": "USD"
    }
  ]
}
```

読み取れない値はAIに推測させず、`null`として扱う方針です。

## Verification

```bash
npm run build
```

本プロジェクトでは、TypeScriptのビルドチェックとViteの本番ビルドを実行します。

## Security note

このプロトタイプでは、ブラウザからOpenRouterへ送るためのAPIキーをlocalStorageに保存します。localStorageは同一オリジンのJavaScriptから読み取れるため、本番運用や複数ユーザー向けサービスでは推奨されません。

本番化する場合は、APIキーをサーバー側で管理するプロキシ構成に変更してください。

## Status

現在はポートフォリオ画面とAIインポートのプロトタイプです。

今後の候補:

- 抽出結果の編集フォーム
- localStorageまたはデータベースへの保有銘柄保存
- 株価の自動更新
- 日本株ティッカー対応
- CSVインポート・エクスポート
- 認証とサーバーサイドAPIキー管理
- 実データに基づく評価額・損益・配分の再計算
