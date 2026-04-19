# トラブルシューティング

よく遭遇する問題と解決手順。

---

## セットアップ関連

### `supabase start` が失敗する

**症状**: `Cannot connect to Docker daemon` / `port already in use`。

**対処**:
- Docker Desktop が起動しているか確認（macOS: `open -a Docker`）
- 既存プロセスがポートを占有していれば停止（`lsof -i :54321 :54322 :54323` で確認）
- `supabase stop --no-backup` で前回の残骸を掃除してから `supabase start` を再実行

---

### `DATABASE_URL is not set` が起動時に出る

**症状**: `npm run dev` 直後に例外。

**対処**:
1. `cp .env.example .env.local`
2. `supabase status -o json | jq -r '.DB_URL'` の値を `DATABASE_URL` にセット
3. `supabase status -o json | jq -r '.ANON_KEY'` の値を `NEXT_PUBLIC_SUPABASE_ANON_KEY` にセット
4. `NEXT_PUBLIC_SUPABASE_URL` は `http://127.0.0.1:54321` を設定

`.env.local` は `.gitignore` で除外されているのでコミットされない。

---

### `Multiple lockfiles detected` 警告が Next.js ビルドで出る

**症状**: 親ディレクトリに別の `package-lock.json` がある場合の Next.js 警告。

**対処**: `next.config.ts` に以下が入っていることを確認:

```ts
outputFileTracingRoot: path.resolve(process.cwd())
```

親ディレクトリにモノレポの lockfile がある場合は、そちらを消すか `outputFileTracingRoot` を適切なルートに調整する。

---

## 認証・RLS 関連

### `/example` にアクセスしたら `/login` にリダイレクトされる（ログイン済みなのに）

**症状**: Cookie が middleware で更新されていない。

**対処**:
- `src/middleware.ts` が存在し `updateSession` を呼んでいるか確認
- `src/middleware.ts` の `config.matcher` が `_next/static` 等を除外しつつターゲットルートを含んでいるか確認
- ブラウザ DevTools → Application → Cookies で `sb-<project>-auth-token` が保存されているか確認

---

### データを insert したのに自分の画面に出てこない

**症状**: insert は 201 が返るが、list で空配列。

**よくある原因**:
1. RLS の `select` ポリシーがない / 誤っている → `supabase/migrations/` で該当テーブルのポリシーを確認
2. insert 時に `user_id` が誤った値で入っている → use-case で `user_id: user.id` を強制しているか確認
3. ブラウザのキャッシュ → hook 側で `fetch(..., { cache: "no-store" })` を指定しているか確認

**切り分け**: `supabase/studio`（`task supabase:studio`）で直接 SQL を叩き、authenticated role で SELECT した結果を見る。

---

### service role key が必要なのに anon キーで失敗する

**症状**: 管理系の処理（全ユーザー列挙など）で RLS に阻まれる。

**対処**:
- **その処理は本当に service role でないとダメか再考する**。RLS ポリシーで解決できないか確認
- 必要なら `src/lib/supabase/admin.ts` を作り、`server-only` を先頭で import してから `createClient` に service role key を渡す
- **絶対に `NEXT_PUBLIC_` 接頭辞を付けない**

---

## Drizzle / マイグレーション関連

### Drizzle schema と Supabase migration がずれた

**症状**: `task db:generate` で想定外の diff が出る。

**対処**:
- 本スターターでは **Supabase migration が正**（RLS を持てるため）
- Drizzle schema は手動で追従する。`task db:generate` は参考情報として使い、生成された SQL は捨てる
- テーブル追加時は `supabase/migrations/*.sql` に書き、同じ構造を `src/lib/db/schema.ts` に手で反映する

---

### `supabase db reset` で全データが飛んだ

**症状**: 想定通りの挙動。ローカルの DB を migration から初期化する。

**対処**: これはリセットコマンドの正しい動作。シードデータが必要なら `supabase/seed.sql` を作成する。

---

## CI / デプロイ関連

### Vercel のビルドで `NEXT_PUBLIC_SUPABASE_URL is not set`

**症状**: Vercel の環境変数未設定。

**対処**: Vercel ダッシュボード → `Settings → Environment Variables` で設定。Preview / Production / Development それぞれに反映する。

---

### Playwright が CI で `Cannot find module 'next'` で落ちる

**症状**: `npm ci` より前に `npx playwright install` を呼んでいる、または workspace が dev 依存を含んでいない。

**対処**: `.github/workflows/ci.yml` で `npm ci` → `npx playwright install --with-deps chromium` → `npm run build` → `npm run e2e` の順になっているか確認。

---

### E2E が本番 Supabase に繋がってしまう

**症状**: Preview 環境で E2E を走らせた際に本番 DB のデータを汚す。

**対処**: E2E は **ローカル Supabase のみ** で走らせる運用にする。Preview デプロイ上で E2E は走らせない。CI 内で `supabase start` → E2E → `supabase stop` のサイクルを回す（`.github/workflows/ci.yml` 参照）。
