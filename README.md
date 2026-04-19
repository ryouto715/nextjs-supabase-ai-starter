# Next.js + Supabase AI Starter

AI エージェント（Claude Code / Codex CLI / Cursor）で**即開発を始められる** Next.js + Hono + Drizzle + Supabase のフルスタックスターター。

`git clone` 直後から、ログイン → サインアップ → example feature の DB insert → UI 表示までが完走する実動テンプレ。ハーネス部分は [`autonomous-ai-harness`](https://github.com/ryouto715/autonomous-ai-harness) の最終状態を継承しており、`.agents/` 配下のワークフロー・スキル・ガイドラインがそのまま使える。

> **スタック非依存の薄いハーネスだけで十分なら** → `autonomous-ai-harness` を使う。
> **Next.js+Supabase の実動スタック込みで始めたいなら** → このリポを使う。

---

## 同梱スタック

| レイヤ | 採用 |
|---|---|
| ランタイム | Node.js 22 LTS |
| 言語 | TypeScript 5.x (strict) |
| フロントエンド | Next.js 15+ (App Router) |
| API | Hono（Next.js の Route Handlers に mount） |
| DB | Supabase (PostgreSQL) |
| ORM / Migration | Drizzle ORM + Drizzle Kit |
| Auth | Supabase Auth + RLS |
| バリデーション | Zod |
| テスト | Vitest（node + jsdom 両環境） |
| Lint / Format | ESLint (flat) + Prettier |
| Task | Taskfile.yml |
| CI | GitHub Actions |

> 各フレームワークの LTS / stable 追従は `.agents/skills/framework-version-check/` を参照（Track 1 から継承予定）。

---

## クイックスタート

```bash
# 1. クローン
git clone https://github.com/ryouto715/nextjs-supabase-ai-starter.git my-app
cd my-app

# 2. 依存インストール
npm install

# 3. Supabase ローカル起動（Docker 必要）
npx supabase start

# 4. DB マイグレーション適用
task db:migrate

# 5. 環境変数セットアップ
cp .env.example .env.local
# .env.local を `supabase start` の出力で埋める

# 6. 開発サーバー起動
npm run dev
```

→ http://localhost:3000 でログイン画面にアクセスできる。サインアップ → example feature の CRUD が動作する。

---

## AI エージェントでの開発

```bash
# Claude Code（推奨）
claude "ユーザーのタスク一覧を表示する機能を追加したい"

# Codex CLI
codex "ユーザーのタスク一覧を表示する機能を追加したい"

# Cursor: IDE を開いて普通に指示
```

エージェントは以下を自動で実施:

1. `AGENTS.md` / `CONTEXT.md` / `.agents/guidelines/*` を読み込みプロジェクト前提を把握
2. Feature Slice 配置（`src/features/tasks/`）と命名規則に従ってファイル生成
3. Drizzle schema → migration → Supabase RLS ポリシーまで一貫して作成
4. Zod + Branded Type で型安全を担保
5. Vitest で単体・統合テストを先に書く（TDD）
6. PR 作成前に `/precommit` で lint / type-check / test を通す

---

## ディレクトリ構造

```
.
├── CLAUDE.md                          # Claude Code エントリーポイント
├── AGENTS.md                          # AI エージェント共通の行動指針
├── CONTEXT.md                         # Next.js+Supabase 前提の固有コンテキスト
├── README.md                          # このファイル
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (public)/                  # 未ログイン向け（login / signup）
│   │   ├── (protected)/               # ログイン必須
│   │   └── api/[[...route]]/route.ts  # Hono への委譲
│   ├── features/                      # Feature Slice（ドメイン単位）
│   │   └── example/                   # サンプル feature（types / use-cases / route / hook / tests）
│   ├── lib/
│   │   ├── db/                        # Drizzle schema + client
│   │   ├── hono/                      # Hono app 本体
│   │   └── supabase/                  # Supabase client / middleware
│   └── middleware.ts                  # Supabase Auth セッションチェック
│
├── supabase/
│   ├── config.toml                    # Supabase Local 設定
│   └── migrations/                    # SQL マイグレーション（RLS 含む）
│
├── drizzle/                           # Drizzle Kit スナップショット
├── scripts/                           # Drizzle ↔ Supabase 連携スクリプト
│
├── .agents/                           # AI エージェント共通（Track 1 から継承）
├── .claude/                           # Claude Code 設定
├── .codex/                            # Codex CLI 設定
├── .cursor/                           # Cursor 設定
│
├── package.json / tsconfig.json / next.config.ts
├── eslint.config.mjs / prettier.config.mjs
├── vitest.config.ts                   # node + jsdom 両環境
├── Taskfile.yml                       # precommit / db:migrate / supabase:* 等
└── .github/workflows/                 # CI（Supabase container + integration test）
```

---

## ワークフロー

### ローカル開発

```bash
npm run dev           # Next.js dev server
task precommit        # lint + type-check + test + format
task db:migrate       # Drizzle migration 適用
task supabase:reset   # Supabase local をリセット
```

### AI エージェントからのスラッシュコマンド

- `/precommit` — コミット前チェック（`@.agents/workflows/precommit.md`）
- `/fix-ci` — CI 失敗時の TDD 修正サイクル（`@.agents/workflows/fix-ci.md`）

---

## セキュリティ

- Supabase RLS で「自分のデータしか読めない / 書けない」を enforce
- Claude Code は `sandbox.enabled: true` + `permissions.deny` で sensitive paths（`~/.ssh` `~/.aws` `.env` 等）保護
- 詳細は `.agents/SECURITY_POLICY.md`

---

## ハーネスの上流

本リポのハーネス部分（`.agents/` / `.claude/` / `.cursor/` / `CLAUDE.md` / `AGENTS.md`）は [`autonomous-ai-harness`](https://github.com/ryouto715/autonomous-ai-harness) から継承している。ハーネスのみの更新は上流に追従する運用（ただし Next.js 特化の guideline 差し替え部分は Track 2 独自の分岐）。

---

## ライセンス

MIT
