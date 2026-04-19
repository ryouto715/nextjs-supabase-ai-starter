# ワークフロー

AI エージェント（Claude Code / Codex CLI / Cursor）が複数の手順をまたいで実行する共通作業の定義集。

## 参照方式

各ツールのコマンド定義やエントリーポイントから `@path` 記法で参照する:

    @.agents/workflows/precommit.md の手順で precommit を実行してください。

Claude Code のスラッシュコマンドは `.claude/commands/*.md` に薄い pointer を置き、ここから本ディレクトリの workflow を参照する構造になっている。

## 同梱ワークフロー

| ワークフロー | 用途 | 対応コマンド |
|-------------|------|-------------|
| `precommit.md` | コミット前の整形 / lint / 型 / テスト / ビルドのグリーン確認 | `/precommit` |
| `fix-ci.md` | CI 失敗の根本原因特定と TDD による修正 | `/fix-ci` |

## ワークフロー追加時の規約

- ゴール・前提・実行手順・ガードレールを明記する
- 特定のコマンド名（`task precommit` 等）はプロジェクト依存なので、`CONTEXT.md` または `.agents/rules/*.md` への参照にとどめる
- 新しい workflow を追加したら本 README の表に登録し、対応するツール側コマンド（`.claude/commands/` 等）も併せて整備する
