# ARCHITECTURE（Next.js + Supabase スターター）

> **参照タイミング**: 新機能追加、ディレクトリ新設、レイヤ責務が曖昧なときに読む。
> 既定値として本ドキュメントに従う。逸脱する場合は ExecPlan の Decision Log に記録する。

---

## 1. ハイレベル構成

```
Browser ──► Next.js (App Router, RSC)
             │
             ├─ src/app/(public)/      公開ページ（/login, /signup 等）
             ├─ src/app/(protected)/   認証必須ページ（layout で getUser）
             └─ src/app/api/[[...route]]/route.ts
                  │
                  └─► Hono (src/lib/hono/app.ts)
                        │
                        └─► Feature Slice (src/features/<domain>/route.ts)
                               │
                               ├─► Supabase SSR クライアント（Auth/DB/RLS）
                               └─► Drizzle（複雑な SQL が必要な場合のみ）
```

- **RSC first**: 認証状態やデータフェッチは Server Component で行うのが既定。Client Component は「ユーザー操作のある UI」でのみ使う。
- **Hono は API 専用**: サーバー関数を直接 React から呼ぶ用途（Server Actions 代替）は想定しない。Hono に集約することで型が `hono/client` 経由で自動的にクライアントに流れる。
- **RLS が最後の砦**: Service Role Key を使う例外ルート以外は、すべて Supabase の anon/authenticated クライアント + RLS で権限制御する。

---

## 2. Feature Slice 配置

新機能は `src/features/<domain>/` に集約する。レイヤ別（models/controllers/views）は採用しない。

```
src/features/<domain>/
├── types.ts                  # Zod スキーマ + Branded Type
├── use-cases/
│   ├── create-<domain>.ts    # サーバー側ユースケース（Supabase を受け取る関数）
│   └── list-<domain>.ts
├── route.ts                  # Hono サブルータ（use-cases を呼ぶだけ）
├── use-<domain>.ts           # React hook（fetch + 状態管理）
└── __tests__/
    ├── types.test.ts         # Zod スキーマのテスト
    └── <use-case>.test.ts    # ユースケースのテスト（vitest, node env）
```

### Slice 間の参照ルール

- `features/A` から `features/B` を直接 import **しない**。共通ロジックが必要なら `src/lib/` に昇格させる。
- `features/*/use-cases/*` は `supabase-js` の `SupabaseClient` を**引数で受ける**。内部で `createClient` を呼ばない（テスト容易性）。
- Hono の `route.ts` だけが Server Component / Route Handler から `createClient()` を呼んで use-case に渡す橋渡しを担当する。

---

## 3. データアクセス: Supabase vs Drizzle

| 用途 | 採用 |
|------|------|
| 単純な CRUD（1 テーブルに対する select/insert/update/delete） | Supabase クライアント（`supabase.from("...")`）|
| RLS を効かせたユーザー操作 | Supabase クライアント（**必須**。JWT が自動で伝搬） |
| 複雑な JOIN / window 関数 / CTE | Drizzle（`src/lib/db/client.ts`） |
| バッチ処理・マイグレーション内ロジック | Drizzle（or raw SQL） |

Drizzle を使う場合でも RLS を回避する目的では使わないこと。service role key を使う場合は**明示的に `server-only` モジュールから**読み込む。

---

## 4. マイグレーション戦略

テーブル定義と RLS ポリシーは **両方** Supabase migration（`supabase/migrations/*.sql`）で管理する。

- Drizzle schema（`src/lib/db/schema.ts`）は **TypeScript 側の型 source of truth**。テーブル追加時に **必ず併記**する。
- `task db:generate` で Drizzle から生成した SQL は参考程度に扱い、RLS を含む最終 SQL を `supabase/migrations/` に置く。
- ローカルでは `supabase db reset` で全 migration を流し直すため、冪等性を担保すること（`create table if not exists` / `create policy if not exists`）。

---

## 5. ルーティング境界

- `src/app/(public)/` — 未認証でもアクセス可
- `src/app/(protected)/` — `layout.tsx` で `supabase.auth.getUser()` を実行し、null なら `/login` にリダイレクト
- `src/middleware.ts` — 全ルートで `updateSession` を呼び、Cookie のローテーションを維持する。

認証が必要な API ルートは `route.ts` 側で `auth.getUser()` を呼び、未認証なら 401 を返す（RLS 任せにしない。エラーメッセージの質が違う）。

---

## 6. エラーバウンダリ

- Server Component で例外 → Next.js の `error.tsx` が受ける。Feature Slice には置かず、`app/` のルートセグメント単位で用意する。
- API エラー形式は `{ error: { code, message } }` で統一する（別途 `.agents/rules/api-error-format.md` に蓄積）。
