# スキル

AI エージェントが特定タスクで参照する、再利用可能なスキルパッケージの集合。

## 参照方式

各エントリーポイント（`CLAUDE.md` / `AGENTS.md` / `.cursor/rules/main.mdc`）から `@path` 記法で参照する:

    @.agents/skills/readable-code/SKILL.md を参照してください。

物理ファイルは 1 箇所のみ存在し、symlink を使わずに複数ツールから共有する。

## 同梱スキル

| スキル | 用途 | 想定タスク |
|--------|------|-----------|
| `readable-code/` | 理解しやすいコードを書く原則 | 新規実装、リファクタリング、コードレビュー |
| `test-writing/` | 読みやすく保守しやすいテストコード | テスト追加、テストリファクタリング、TDD サイクル |
| `framework-version-check/` | 追従対象フレームワークの最新 LTS / stable 確認 | 依存更新 PR 前、月次レビュー、新規セットアップ直後 |

## スキル追加時の規約

- 各スキルは `skill-name/SKILL.md` に配置
- `SKILL.md` 冒頭に YAML frontmatter (`name` / `description` / `license`) を記載
- 参考資料・画像・補助スクリプトがある場合は同ディレクトリに配置
- description は「何のスキルで、いつ参照すべきか」を 1〜2 文で記述（AI が読む誘導コメントとして機能）

## 外部スキルを取り込む場合

Vercel / Supabase 等の公式スキルパックなど、外部由来のスキルを追加する場合は、オリジナルのライセンスファイル (`LICENSE`) をスキルディレクトリに同梱すること。
