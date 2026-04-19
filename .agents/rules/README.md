# .agents/rules/

プロジェクト固有の規約・パターン・API 仕様など、**自己修正ループ**（CLAUDE.md / AGENTS.md 参照）で蓄積される知見の置き場所。

## 目的

AI エージェント（Claude Code / Codex / Cursor など）が同じ間違いを繰り返さないよう、プロジェクトで発見された規約・制約を蓄積する。ツール固有ディレクトリ（`.claude/` や `.cursor/`）ではなく本ディレクトリに集約することで、どの AI ツールからも同じルールが参照される。

## 書き方

1 ファイル = 1 トピック。ファイル名は内容を表すケバブケース（例: `api-error-format.md`、`db-naming-conventions.md`、`testing-patterns.md`）。

各エントリは:

- 2〜3 行以内で簡潔に
- 可能ならコード例を含める
- 既存エントリと重複しないか追記前に確認
- 既存エントリが誤っていたら修正する

## 例

`.agents/rules/api-error-format.md`:

    # API エラーレスポンス形式

    - すべての API エラーは `{ error: { code: string, message: string } }` 形式
    - `message` は日本語、`code` は英数字アンダースコア

## 参照タイミング

- AI エージェントは作業開始時に本ディレクトリ配下のファイルを一度目を通す
- AGENTS.md の「実装時に参照すべきガイドライン」節で誘導する場合もある
