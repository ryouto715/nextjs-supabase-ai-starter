# CLAUDE.md

Claude Code が本リポジトリで作業を開始する際に最初に読むエントリーポイント。

## 必読ドキュメント

以下のファイルを必ず読むこと:

- **AGENTS.md** — ワークフロー、TDD + SDD、フェーズ分割、継続開発モード、コマンド、ガードレール
- **CONTEXT.md** — プロジェクト固有の概要、技術スタック、用語集、ディレクトリ構造（各プロジェクトで埋める）
- **`.agents/EXECPLAN_GUIDE.md`** — ExecPlan の書き方・保守ルール（複雑な作業では必読）
- **`.agents/SECURITY_POLICY.md`** — セキュリティポリシーの説明（自律動作時の境界）

## ガイドラインの読み分け

`.agents/guidelines/` 配下は「必要時のみ参照」する詳細ルール集。AGENTS.md 内の誘導に従って、タスクの性質に応じて読み込むこと。

## 自己修正ループ

ユーザーから修正指示を受けた場合、または自分の間違いに気づいた場合は、再発防止のためルールを更新することを提案する:

- **プロジェクト固有の規約・パターン** → `.agents/rules/*.md` に追記（例: API 仕様、DB スキーマ、命名慣習、固有ライブラリの使い方）
- **AI ツール固有ではなく AI エージェント全体に適用される知見** → 同じく `.agents/rules/*.md` に追記し、Claude Code / Codex / Cursor いずれからも参照できるようにする
- 1 エントリは 2〜3 行以内、可能ならコード例付きで簡潔に
- 追記前に既存エントリと重複しないか確認。既存エントリが誤っていた場合は修正する

`.claude/` 配下はツール固有の設定・コマンドのみを置く。規約類は `.agents/rules/` に集約する（Claude Code / Codex / Cursor で共通参照するため）。

## 参照方式

`.agents/` 配下のファイルは、ツール間で symlink せず `@path` 参照方式で読み込む。例:

    @.agents/guidelines/ARCHITECTURE.md を参照してください。

物理ファイルは 1 箇所だけ存在し、各ツール（Claude Code / Codex / Cursor）はそれぞれのエントリーポイント（CLAUDE.md / AGENTS.md / `.cursor/rules/main.mdc`）から `@path` で参照する。

## worktree 運用

複数 worktree で作業する場合:

- 同一ファイルを同時編集しない
- 各 worktree は独立したブランチで作業する
- メイン worktree でのマージ操作に注意する
