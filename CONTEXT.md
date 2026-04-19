# CONTEXT.md - nextjs-supabase-ai-starter

AI エージェント（Claude Code / Codex CLI / Cursor）が作業時にプロジェクト状態を素早く把握するためのコンテキストファイル。

最終更新: 2026-04-19 (UTC)


## プロジェクト概要

### 名前

`nextjs-supabase-ai-starter`

### 目的

AI エージェントで Next.js + Supabase フルスタックアプリの開発を、初期設定ゼロで即開始できるスターター。Auth / RLS / example feature まで動く状態から派生させる。

### 現在のステータス

- [x] 企画段階
- [x] 開発中（初期構築）
- [ ] テスト中
- [ ] 本番運用中


## 技術スタック

### 言語・ランタイム

- 言語: TypeScript 5.x（strict: true）
- ランタイム: Node.js 22 LTS
- パッケージマネージャ: npm

### フレームワーク

- フロントエンド: Next.js 15+（App Router）
- バックエンド: Hono（Next.js の `app/api/[[...route]]/route.ts` に mount）
- テスト: Vitest（node 環境 + jsdom 環境の使い分け）
- バリデーション: Zod + Branded Type
- CSS: （決定次第記載。Tailwind 候補）

### データストア

- データベース: Supabase (PostgreSQL)
- ORM: Drizzle ORM
- Migration: Drizzle Kit + Supabase CLI（併用、`scripts/drizzle-export-latest-to-supabase.ts` で Drizzle → Supabase 連携）
- キャッシュ: なし（必要になったら追加）

### 認証

- Supabase Auth（email + password をデフォルト、OAuth 追加は後続）
- セッション管理: `src/middleware.ts` で Cookie チェック
- 権限制御: PostgreSQL RLS ポリシー

### インフラ

- ホスティング: Vercel（想定、未設定）
- DB ホスティング: Supabase Cloud（本番）/ Supabase Local（開発、Docker 必要）
- CI/CD: GitHub Actions（`.github/workflows/ci.yml`）


## 要追従フレームワーク

`.agents/skills/framework-version-check/` でのチェック対象。月次で LTS / stable を確認。

| フレームワーク | 現在のバージョン | 追従ポリシー |
|---|---|---|
| Node.js | 22 LTS | LTS 追従（新 LTS リリース時に検討） |
| Next.js | 15+ | stable 追従 |
| Hono | 最新 stable | stable 追従 |
| Drizzle ORM | 最新 stable | stable 追従 |
| Supabase (CLI + SDK) | 最新 stable | stable 追従 |
| React | 19+ | Next.js が対応するバージョンに合わせる |
| TypeScript | 5.x | 最新 stable |
| Vitest | 最新 stable | stable 追従 |


## ディレクトリ構造

    .
    ├── src/
    │   ├── app/                           # Next.js App Router
    │   │   ├── (public)/                  # 未ログイン向け
    │   │   ├── (protected)/               # ログイン必須
    │   │   └── api/[[...route]]/route.ts  # Hono への委譲
    │   ├── features/                      # Feature Slice（ドメイン単位）
    │   ├── lib/
    │   │   ├── db/                        # Drizzle schema + client
    │   │   ├── hono/                      # Hono app 本体
    │   │   └── supabase/                  # Supabase client / middleware
    │   └── middleware.ts
    ├── supabase/
    │   ├── config.toml
    │   └── migrations/                    # SQL migration + RLS policy
    ├── drizzle/                           # Drizzle Kit snapshot
    ├── scripts/
    ├── .agents/                           # AI ハーネス（Track 1 継承）
    ├── .claude/ / .codex/ / .cursor/     # 各 AI ツール設定
    └── docs/


## 重要なファイル

| パス | 説明 |
|------|------|
| `src/app/layout.tsx` | Root layout |
| `src/app/api/[[...route]]/route.ts` | Hono エンドポイントの委譲点 |
| `src/lib/hono/app.ts` | Hono アプリ本体 |
| `src/lib/db/schema.ts` | Drizzle スキーマ定義 |
| `src/lib/supabase/{client,server,middleware}.ts` | Supabase クライアント群 |
| `src/middleware.ts` | Supabase Auth セッションチェック |
| `drizzle.config.ts` | Drizzle Kit 設定 |
| `supabase/config.toml` | Supabase Local 設定 |
| `package.json` | 依存関係と scripts |
| `Taskfile.yml` | precommit / db / supabase タスク |


## 開発コマンド

### セットアップ

    npm install
    npx supabase start
    cp .env.example .env.local
    # .env.local を supabase start の出力で埋める

### 開発サーバー起動

    npm run dev

期待される出力: `Local: http://localhost:3000`

### テスト実行

    npm test                 # 全テスト
    npm test -- --watch      # watch モード

### ビルド

    npm run build
    # = next build

### Lint / Format

    npm run lint
    npm run format

### Precommit（合成タスク）

    task precommit
    # lint + type-check + test + format を順次実行

### DB マイグレーション

    task db:migrate          # Drizzle migrations を Supabase に適用
    task db:generate         # schema.ts の変更から migration 生成
    task supabase:reset      # Supabase Local をリセット


## 環境変数

`.env.local` に記載。リポジトリにはコミットしない（`.gitignore` で除外済み）。

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL（公開可） | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（公開可） | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（サーバーのみ、非公開） | `eyJhbGciOi...` |
| `DATABASE_URL` | Drizzle が使う PostgreSQL 接続文字列 | `postgresql://postgres:postgres@localhost:54322/postgres` |

`.env.example` に上記のプレースホルダを含めておくこと。


## アーキテクチャ決定記録（ADR）

### ADR-001: Next.js App Router + Hono on Route Handlers

- **日付**: 2026-04-18
- **ステータス**: 採用
- **コンテキスト**: Next.js の API route は route 定義が散在しがちで、エンドポイントの網羅性や middleware 適用が不透明になる
- **決定**: `app/api/[[...route]]/route.ts` を catch-all にして Hono に委譲。Hono 側で全エンドポイント・middleware を一元管理
- **結果**: `src/lib/hono/app.ts` で API 全体を俯瞰可能。型推論も `hono/client` で自動

### ADR-002: Drizzle + Supabase CLI の併用

- **日付**: 2026-04-18
- **ステータス**: 採用
- **コンテキスト**: Drizzle Kit はスキーマ駆動で強いが、RLS ポリシーの管理は手薄。Supabase CLI は SQL 直書きで RLS を扱える
- **決定**: テーブル定義は Drizzle、RLS 等 PostgreSQL 固有機能は Supabase CLI 側 SQL migration で管理。`scripts/drizzle-export-latest-to-supabase.ts` で Drizzle の生成結果を Supabase migration に取り込む
- **結果**: 型安全と RLS 管理を両立

### ADR-003: Feature Slice 配置

- **日付**: 2026-04-18
- **ステータス**: 採用
- **コンテキスト**: レイヤ別分割（models/ controllers/ views/）は機能追加時に複数ディレクトリにまたがり編集範囲が見えにくい
- **決定**: `src/features/<domain>/` 配下に types / use-cases / route / hook / tests を集約
- **結果**: 1 feature = 1 ディレクトリで追加・削除が可能


## 現在進行中の作業

| ExecPlan | ステータス | 担当 | 最終更新 |
|----------|----------|------|----------|
| `~/prototype/_meta/plans/harness-rebrand-execplan.md` Track 2 | 進行中（初期構築） | Claude + ryoto.tawata | 2026-04-19 |


## 既知の問題・技術的負債

| ID | 説明 | 優先度 | 関連ファイル |
|----|------|--------|--------------|
| - | （初期構築段階のため未発見） | - | - |


## 外部依存

### API

| サービス | 用途 | ドキュメント |
|----------|------|--------------|
| Supabase | DB + Auth + Storage | https://supabase.com/docs |
| Vercel | ホスティング（将来） | https://vercel.com/docs |

### ライブラリ

特殊な使い方をしているライブラリ。

| ライブラリ | 注意点 |
|-----------|--------|
| Hono | Next.js Route Handler の catch-all に mount する形で利用。`hono/vercel` adapter は使わない |
| Drizzle | RLS 定義は Drizzle 側では管理せず Supabase migration 側で記述 |


## 用語集

プロジェクト固有用語。ハーネス共通用語は `AGENTS.md` の用語集を参照。

| 用語 | 定義 |
|------|------|
| Feature Slice | 1 ドメインを `src/features/<domain>/` 配下に集約する設計方針 |
| Branded Type | Zod で validate したあとに `Brand<T, 'Name'>` で nominal type 化したもの |
| RLS | PostgreSQL の Row Level Security。Supabase では `supabase/migrations/*.sql` で管理 |


---

## 変更履歴

| 日付 | 変更者 | 内容 |
|------|--------|------|
| 2026-04-19 | Claude + ryoto.tawata | 初版（Next.js+Supabase 前提で具体化） |
