---
name: framework-version-check
description: プロジェクトで追従対象としている言語・フレームワーク・主要ライブラリが最新 LTS / stable バージョンに乗っているかを確認するスキル。依存関係更新・定期レビュー・新規セットアップ前に参照。`CONTEXT.md` の「要追従フレームワーク」テーブルを入力とし、各対象の最新版と現在版を照合する。
license: MIT
---

# フレームワークバージョン確認スキル

## 概要

本スキルは、プロジェクトが「追従対象」として宣言している言語・フレームワーク・主要ライブラリについて、**最新の LTS / stable バージョン**と**現在採用しているバージョン**のギャップを調査し、アップグレードすべきかを判断するための手順を提供する。

AI エージェントはこのスキルを参照して、自律的にバージョンチェックを行い、Decision Log に結果を記録する。

## このスキルを使用するタイミング

- **定期レビュー**: 月次など、プロジェクトで定めた間隔で追従状況を確認
- **依存関係更新 PR 作成前**: `npm update` / `npm audit fix` を実行する前の事前調査
- **新規プロジェクトセットアップ直後**: `CONTEXT.md` に記載したバージョンが真に「最新」か検証
- **脆弱性報告を受けたとき**: 該当バージョンが修正版かの確認
- **Breaking Change の噂を見かけたとき**: メジャー更新が必要か事前調査

## 入力: 要追従フレームワークテーブル

プロジェクト直下の `CONTEXT.md` に以下の形式でテーブルが定義されている前提で動作する:

```markdown
## 要追従フレームワーク

| フレームワーク | 現在のバージョン | 追従ポリシー |
|---|---|---|
| Node.js | 22 LTS | LTS 追従（新 LTS リリース時に検討） |
| Next.js | 15+ | stable 追従 |
| ... | ... | ... |
```

テーブルが存在しない場合は、`package.json` / `engines` / `.tool-versions` / `.nvmrc` / `Gemfile` / `requirements.txt` などから候補を推定し、**ユーザーに追加を提案する**（スキル側で勝手に作らない）。

## 追従ポリシーの分類

| ポリシー | 意味 | 判定基準 |
|---------|------|---------|
| **LTS 追従** | 長期サポート版の最新のみ採用 | 新 LTS がリリースされていれば「要検討」、それ以外は「OK」 |
| **stable 追従** | stable チャネルの最新メジャー | 1 メジャー遅れまでは「OK」、2 メジャー以上は「要検討」 |
| **一つ前の LTS 固定** | 安定運用のため旧 LTS に留める | 該当 LTS がまだサポート中なら「OK」、EOL 間近なら「要移行」 |
| **ピン止め** | メジャー更新は人間判断 | 現在版と最新版の差分のみ記録、判定はしない |

## 調査手順

### Step 1: 最新版の取得

フレームワーク種別ごとに確認先を使い分ける。**公式ソースに限定**（ブログ記事や Stack Overflow は使わない）。

#### npm パッケージ

```bash
# 最新 stable バージョン
npm view <package> version

# dist-tags（latest / next / beta 等）
npm view <package> dist-tags

# 過去バージョン一覧（最近のもののみ）
npm view <package> versions --json | tail -20
```

対象例: `next`, `hono`, `drizzle-orm`, `drizzle-kit`, `@supabase/ssr`, `@supabase/supabase-js`, `react`, `typescript`, `vitest`, `@playwright/test`

#### Node.js

- **公式**: https://nodejs.org/en/about/previous-releases
- 現在の LTS コードネーム（例: `Jod`, `Iron`）を確認し、マイナー/パッチ版の最新を取得
- WebSearch を使う場合は `"Node.js LTS release schedule"` で公式サイトに辿り着いてから確認

#### Deno / Bun 等の別ランタイム

- Deno: https://github.com/denoland/deno/releases
- Bun: https://github.com/oven-sh/bun/releases

#### Python / Ruby / Go 等

- Python: https://www.python.org/downloads/
- Ruby: https://www.ruby-lang.org/en/downloads/
- Go: https://go.dev/dl/

#### Supabase CLI

```bash
npx supabase --version                    # 現在インストール版
npm view supabase version                 # npm 経由で配布されているバージョン
```

公式 CLI リリース: https://github.com/supabase/cli/releases

#### GitHub Actions のアクション

`uses: actions/checkout@v4` のような記述は `.github/workflows/*.yml` を grep で抽出し、`actions/checkout`, `actions/setup-node` 等のメジャータグの最新を GitHub API で確認する:

```bash
gh api repos/actions/checkout/releases/latest --jq '.tag_name'
```

### Step 2: 現在版の抽出

| 対象 | 抽出元 | コマンド例 |
|------|--------|-----------|
| npm パッケージ | `package.json` | `jq '.dependencies, .devDependencies' package.json` |
| Node.js | `package.json` の `engines.node` / `.nvmrc` / `.tool-versions` | `cat .nvmrc` |
| Supabase CLI | `package.json` または CI workflow | `grep -r 'supabase' package.json .github/` |
| Actions | `.github/workflows/*.yml` | `grep -hE 'uses: [^ ]+' .github/workflows/*.yml \| sort -u` |

### Step 3: 照合と判定

各フレームワークについて、以下の形式で判定する:

```
- <フレームワーク>: 現在 X.Y.Z / 最新 A.B.C
  - ポリシー: <LTS 追従 | stable 追従 | ...>
  - 判定: <✅ OK | 🟡 マイナー更新あり | 🟠 メジャー更新あり | 🔴 要移行（EOL 間近）>
  - 備考: <breaking changes のサマリ、公式 migration guide の URL>
```

判定ルール:

- **✅ OK**: 現在版 == 最新版（パッチ差は OK）
- **🟡 マイナー更新あり**: semver の minor 差のみ。低リスクで更新推奨
- **🟠 メジャー更新あり**: semver の major 差。breaking changes の影響範囲調査が必要
- **🔴 要移行**: 現在版が EOL、またはセキュリティ修正を受けない状態

### Step 4: レポート生成

結果を以下のいずれかに書き出す:

1. **Decision Log への追記**（ExecPlan 駆動中の場合）
2. **`.agents/rules/framework-versions-YYYY-MM.md`**（定期レビューの場合）
3. **PR description**（依存更新 PR を作る場合）

テンプレート:

```markdown
## フレームワークバージョン確認 (YYYY-MM-DD)

| フレームワーク | 現在 | 最新 | 判定 | アクション |
|---|---|---|---|---|
| Node.js | 22.10.0 | 22.12.0 (Jod LTS) | 🟡 | 次回依存更新 PR で同梱 |
| Next.js | 15.0.3 | 15.1.2 | 🟡 | 同上 |
| ... | ... | ... | ... | ... |

### 調査ソース

- npm registry: `npm view <pkg> version`
- Node.js 公式: https://nodejs.org/en/about/previous-releases
- <他に参照した URL>

### Breaking Changes のハイライト

- <メジャー更新がある場合、該当 framework の migration guide 要約>
```

## 禁止事項・注意点

- **推測で「最新版」と断定しない**。必ず公式ソースから取得した値のみを使う（過去に類推 URL でハルシネーションした前例あり）
- **メジャー更新を自律で実行しない**。判定まで行い、実際の `npm install <pkg>@latest` は人間の承認後
- **短縮 URL / 転載ブログの引用禁止**。一次ソース（公式 GitHub / 公式サイト / npm registry）のみ
- **ネットワークが無効な環境では実行しない**。オフライン状態ではスキルを起動せず、その旨をユーザーに伝える

## 典型的な実行フロー例

### 例 1: Next.js + Supabase プロジェクトの月次チェック

```
1. CONTEXT.md を読み「要追従フレームワーク」テーブルを取得
2. 各行について最新版を取得:
   - npm view next version
   - npm view hono version
   - npm view drizzle-orm version
   - npm view @supabase/ssr version
   - Node.js LTS 最新 → 公式ページを WebSearch / WebFetch
3. package.json と照合
4. `.agents/rules/framework-versions-2026-04.md` にレポート生成
5. 🟡 / 🟠 の項目があれば、依存更新 ExecPlan を提案
```

### 例 2: 新規プロジェクト立ち上げ直後の検証

```
1. CONTEXT.md の 要追従フレームワーク テーブルが真に最新か確認
2. ずれがあれば CONTEXT.md と package.json を両方更新
3. コミットメッセージは `chore(deps): align starter versions with current LTS/stable`
```

## このスキルを呼び出す標準文言

スキル呼び出し側（AGENTS.md / ExecPlan / ユーザー指示）が以下の文言を使うことを推奨する:

> `@.agents/skills/framework-version-check/SKILL.md` を参照してバージョン確認を実施し、結果を `.agents/rules/framework-versions-<YYYY-MM>.md` にレポートしてください。
