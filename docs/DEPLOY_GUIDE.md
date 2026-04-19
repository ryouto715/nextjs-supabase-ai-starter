# デプロイガイド

本スターターを本番（Vercel + Supabase Hosted）に載せる手順をまとめる。セルフホスト（自前 Node / PostgreSQL）は範囲外。

---

## 1. 前提

- GitHub リポジトリに push 済み
- [Vercel](https://vercel.com) アカウント
- [Supabase](https://supabase.com) プロジェクト（本番用）
- ローカルで `supabase` CLI にログイン済み（`supabase login`）

---

## 2. Supabase 本番プロジェクト準備

### 2.1 プロジェクト作成

Supabase ダッシュボードで新規プロジェクトを作成。リージョンと DB パスワードを記録する。

### 2.2 リモートに link

```bash
supabase link --project-ref <your-project-ref>
```

`project-ref` は Supabase ダッシュボードの URL `https://supabase.com/dashboard/project/<ref>` から取得できる。

### 2.3 マイグレーション適用

```bash
supabase db push
```

これで `supabase/migrations/*.sql` が本番 DB に適用される。**RLS ポリシーが含まれていることを必ず確認**してから push すること。

### 2.4 Auth 設定

- `Auth → URL Configuration` で `Site URL` を本番 URL（例: `https://your-app.vercel.app`）に設定
- `Redirect URLs` にプレビュー用ドメイン（`https://*-your-team.vercel.app`）も追加
- メール認証を有効化する場合は `Email → Confirm email` を on にする（スターター既定は off）

---

## 3. Vercel プロジェクト準備

### 3.1 リポジトリを import

Vercel ダッシュボードから GitHub リポジトリを import する。フレームワークは自動検出で Next.js が選ばれる。

### 3.2 環境変数

Vercel の `Settings → Environment Variables` で以下を設定:

| 変数名 | 値の取得元 | Environments |
|--------|------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase `Project Settings → API → Project URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `Project Settings → API → anon public` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `Project Settings → API → service_role` | Production のみ（必要時） |
| `DATABASE_URL` | Supabase `Project Settings → Database → Connection string` | Production, Preview |

> **⚠️ 重要**: `SUPABASE_SERVICE_ROLE_KEY` は **NEXT_PUBLIC_ を付けない**。クライアントバンドルに混入すると RLS を完全に無視されるため致命的。

### 3.3 ビルド設定

デフォルトのままで動く:

- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm ci`

---

## 4. デプロイ

main ブランチに push すると自動デプロイされる。Preview デプロイは PR ごとに自動生成される。

### 4.1 デプロイ後確認

- `/` が 200 で表示される
- `/api/health` が `{"status":"ok"}` を返す
- `/login` → サインアップ → `/example` で自分だけのデータが見える（RLS が効いている）
- 別アカウントでログインして他人のデータが見えないことを確認

---

## 5. マイグレーションの運用

### 5.1 新規マイグレーション追加

1. ローカルで `supabase/migrations/NNNN_xxx.sql` を書く（テーブル + RLS 必ずセット）
2. ローカル検証: `task supabase:reset` で全 migration を流し直し、壊れないことを確認
3. Drizzle schema にも追記し、`npm run typecheck` が通ることを確認
4. PR を出して CI（`supabase db push --dry-run` 相当の検証 or integration test）を通す
5. マージ後、手動 or CI から `supabase db push` で本番適用

### 5.2 ロールバック

Supabase はマイグレーションの逆方向実行を自動生成しない。**常に前方互換で書く**（カラムを消すときはまず読み手を先にデプロイ、次の PR で落とす、等）。

---

## 6. 監視

- Vercel `Analytics` / `Logs` で web リクエストを確認
- Supabase `Logs Explorer` で DB/Auth ログを確認
- 本格運用に入る段階で Sentry / Datadog を追加。`.agents/guidelines/OBSERVABILITY.md` を参照。
