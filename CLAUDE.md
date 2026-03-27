# Dotchi

5分間限定の2択投票アプリ。「今この瞬間」の迷いを世界に放流して直感的に解決する。

## 技術スタック

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (Auth, DB, Storage, Realtime)
- **Hosting:** Vercel (Hobby Plan)

## プロジェクト構成

```
src/
  app/              # Next.js App Router ページ & APIルート
    api/posts/      # 投稿作成API
    api/votes/      # 投票API
    create/         # 投稿作成ページ
  components/
    ui/             # 汎用UIコンポーネント (Header, ProgressBar)
    post/           # 投稿関連コンポーネント (PostCard, Timeline, etc.)
  lib/
    supabase/       # Supabaseクライアント (client/server/middleware)
    types.ts        # 型定義
    constants.ts    # 定数 (5分間のタイマーなど)
supabase/
  migrations/       # DBマイグレーションSQL
```

## 開発環境

- **確認用URL:** http://192.168.11.102:3000

## コマンド

- `npm run dev` — 開発サーバー起動 (http://localhost:3000)
- `npm run build` — 本番ビルド
- `npm run lint` — ESLint実行

## コーディング規約

- パスエイリアスは `@/*` → `./src/*`
- コンポーネントは `"use client"` を明示（Server Componentはデフォルト）
- Supabaseクライアントはブラウザ用 (`lib/supabase/client.ts`) とサーバー用 (`lib/supabase/server.ts`) を使い分ける
- UIはパステルカラー・丸みを帯びたミニマルデザイン（spec.md参照）
- 日本語UIで開発

## 環境変数

`.env.local` に以下を設定:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
