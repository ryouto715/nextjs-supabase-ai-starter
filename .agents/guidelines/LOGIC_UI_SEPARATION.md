# ロジックと UI の分離

> **参照タイミング**: React コンポーネントを書くとき、hook を分離するか迷ったとき。

---

## 1. 基本原則

**コンポーネントファイルの中にビジネスロジックを書かない**。コンポーネントは「状態を受け取って JSX を返す」役割に閉じる。

| レイヤ | 責務 | 置き場所 |
|--------|------|----------|
| Server Component / Page | データ取得・認証チェック・Hono or use-case 呼び出し | `src/app/**` |
| Client Component | DOM イベントのハンドリング・state の表示 | `src/app/**` または `src/features/<domain>/components/` |
| Hook | fetch / state / 副作用の束ね | `src/features/<domain>/use-<domain>.ts` |
| Use-case | ドメインロジック（Supabase / Drizzle を引数で受ける） | `src/features/<domain>/use-cases/*.ts` |
| Schema | 入出力の型・検証 | `src/features/<domain>/types.ts` |

---

## 2. "use client" をつける判断

- **つけない**: データフェッチ、認証チェック、条件付きレンダリング（サーバー側で解決できる条件）
- **つける**: `useState` / `useEffect` / DOM イベント / ブラウザ API（`window`, `localStorage` 等）を使う

既定は Server Component。必要になった最小単位だけ Client Component に切り出す。

---

## 3. hook の切り出し基準

コンポーネント内で以下のいずれかに該当したら hook を分離する:

1. `useEffect` が 2 つ以上
2. state が 3 つ以上で相互に依存する
3. 他のコンポーネントで同じ fetch を繰り返す

hook は `features/<domain>/use-<domain>.ts` に置き、シグネチャは `(...args) => { data, loading, error, ...actions }` のパターンに揃える。

---

## 4. テスト戦略

| 対象 | テスト手段 | 場所 |
|------|-----------|------|
| Zod schema | vitest（node 環境） | `features/<domain>/__tests__/types.test.ts` |
| Use-case | vitest + Supabase モック or 実 DB | `features/<domain>/__tests__/<use-case>.test.ts` |
| Hook | vitest + `@testing-library/react`（jsdom） | `features/<domain>/__tests__/use-<domain>.component.test.tsx` |
| ページ（統合） | Playwright E2E | `e2e/*.spec.ts` |

- **Use-case を fat に保ち、コンポーネントを薄く保つ**。これにより Playwright の本数を最小限に抑えつつ網羅率が上がる。
- hook のテストはマウント/アンマウントや副作用のエッジケースに絞る。通常フローは E2E で確認。

---

## 5. style / class のルール

- inline style はプロトタイプ用途に限定（本スターターは最小限のため当面 inline で可）。
- 本格運用に入る段階で CSS Modules or Tailwind を追加する。`.agents/rules/styling.md` に方針を記録してから移行すること。
- className の動的生成は 3 つ以上の条件で `clsx` を導入する目安。

---

## 6. フォームの扱い

- `use client` + `useState` + プレーンな `<form onSubmit>` を既定とする。
- 複雑なバリデーションや状態管理が必要になったら `react-hook-form` + `@hookform/resolvers/zod` を導入。`features/<domain>/types.ts` の Zod を再利用する。
