# API / クライアント契約

> **参照タイミング**: API ルートを追加・変更するとき、フロントから API を呼ぶコードを書くとき。

---

## 1. 型の流れ方

```
Zod schema (features/<domain>/types.ts)
        │
        ├─► use-case 関数の input/output 型
        │
        ├─► Hono route の zValidator で request 検証
        │
        └─► hono/client 経由でブラウザ側に流れる AppType
```

- **手動で型を二重定義しない**。`features/<domain>/types.ts` の Zod schema が単一の source of truth。
- Hono ルートを `app.route("/examples", exampleRoute)` のように **chain して `routes` を export** する。`typeof routes` が `AppType` としてクライアントに届く。

---

## 2. Hono ルートの書き方

```ts
// features/<domain>/route.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createClient } from "@/lib/supabase/server";
import { myInputSchema } from "./types";
import { myUseCase } from "./use-cases/my-use-case";

export const myRoute = new Hono()
  .get("/", async (c) => { /* ... */ })
  .post("/", zValidator("json", myInputSchema), async (c) => {
    const input = c.req.valid("json");
    const supabase = await createClient();
    const result = await myUseCase(supabase, input);
    return c.json({ result }, 201);
  });
```

- ルート定義は `new Hono().get(...).post(...)` の chain で書く（型が失われないため）。
- `app.route("/path", subRouter)` で `src/lib/hono/app.ts` にマウントする。

---

## 3. クライアントから叩くルール

- `fetch("/api/...")` は **React hook に閉じ込める**（`features/<domain>/use-<domain>.ts`）。コンポーネントから直接叩かない。
- レスポンスは `await res.json()` した後に **Zod で再 parse** する。ネットワーク境界は信頼境界。
- **絶対パス / 外部 URL を fetch する場合** は `src/lib/` に抽象層を置き、feature slice からは内部関数を呼ぶ。

---

## 4. エラーハンドリング

- API 側: `throw new Error(...)` で送出し、Hono の onError でまとめて `{ error: { code, message } }` を返す。
- クライアント側: `res.ok` を必ずチェック。`throw` してからコンポーネント側で `try/catch` するか、hook 内で `error` state に格納する。
- **4xx と 5xx を区別**: 4xx はユーザーに見せる、5xx はログ + サニタイズしたメッセージのみ。

---

## 5. 認証コンテキストの受け渡し

- Server Component / Route Handler から use-case を呼ぶときは **`await createClient()` して SupabaseClient を渡す**。
- use-case 内で `auth.getUser()` を呼ぶか、もしくは `user.id` を引数で受け取るかは use-case ごとに選択。判断基準:
  - 複数の use-case で同じユーザー取得ロジックが出る → 呼び出し側で一度取得して引数で渡す
  - use-case が単体で完結し、他から呼ばれない → use-case 内で `auth.getUser()`

---

## 6. CSRF / 同一オリジン

- Next.js の API Route は同一オリジン運用が既定。外部 origin からの fetch は CORS で明示的に許可するまで不可。
- Supabase SSR Cookie は `HttpOnly` + `SameSite=Lax` が既定。これを無効化しない。
