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
    api/themes/     # お題API (today: 今日のお題取得)
    api/music/      # iTunes Search API
    api/movie/      # TMDB API
    api/game/       # RAWG API
    create/         # 投稿作成ページ
  components/
    ui/             # 汎用UIコンポーネント (Header, ProgressBar, BottomSheet)
    post/           # 投稿関連コンポーネント (PostCard, Timeline, DailyThemeBanner, etc.)
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

## ワークフロー（対話型）

- **即実装しない。** 曖昧な指示や改善系のタスクでは、まず現状を把握し、2〜3個の選択肢や論点を提示してから方向性を確認する
- **「これはどう思う？」で聞く。** 提案は断定ではなく問いかけの形で出し、ユーザーの判断を引き出す
- **選択肢には理由をつける。** 「A案: ○○（メリット: △△）」のように、判断材料を添える
- **段階的に詰める。** 大きな方針 → 具体的な実装方針 → 着手、の順で進める。一気に細部まで決めない
- **明確な指示のときはそのまま実行。** 「このバグを直して」「この関数をリネームして」など具体的な場合は質問せず着手してOK

## お題（Daily Theme）システム

- 運営が毎日お題（テーマ）をSNSで発信し、ユーザーがそのテーマで2択投稿を作る
- お題はテーマのみ提示。2択の選択肢はユーザーが自分で決める
- DB: `daily_themes` テーブル（date, title, description, examples, mode）
- 投稿は `theme_id` でお題に紐づく（任意）
- お題がある日はタイムライン上部に `DailyThemeBanner` が表示される
- お題の投入は現在Supabaseダッシュボードから手動

## 環境変数

`.env.local` に以下を設定:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TMDB_API_KEY=
RAWG_API_KEY=
```
