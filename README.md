# Autonomous AI Harness

AI エージェント（Claude Code / Codex CLI / Cursor）を使った**完全自律型 AI 開発**のためのスタック非依存ハーネス。

ユーザーは「何を作りたいか」を伝えるだけ。要件定義から実装、テスト、継続的改善まで、AI エージェントが自律的に遂行する。**特定のフレームワーク・言語に依存しない**ので、Node/TS・Python・Go・Rust のどのプロジェクトにも導入できる。

> Next.js + Supabase のフルスタック構成を同梱した実動スターターが必要な場合は、派生リポジトリ **`nextjs-supabase-ai-starter`** を参照（Track 2、別途公開予定）。

---

## 特徴

- **マルチ AI ツール対応**: Claude Code を主、Codex CLI / Cursor を従として同じハーネスで動作
- **フェーズ分割型ワークフロー**: 仕様策定 → 自律実装 → 継続的改善
- **ゴールドリブン・アプローチ**: ユーザーの目的から最適な要件を導出
- **TDD + SDD**: テスト駆動 + 仕様駆動の厳密な開発プロセス
- **自己修正ループ**: 修正指示を `.agents/rules/` に蓄積して再発防止
- **継続開発対応**: 初期構築後のリファクタリング・機能追加にも対応
- **フィードバック駆動改善**: ユーザーフィードバックから自動で PR 作成（オプション）

---

## クイックスタート

### 1. テンプレートとして利用

```bash
# GitHub テンプレート機能で新規リポジトリを作成
# または直接クローン
git clone https://github.com/YOUR_ORG/autonomous-ai-harness.git my-project
cd my-project
```

### 2. 利用する AI ツールをインストール

いずれか一つ以上:

```bash
# Claude Code（推奨）
# https://docs.claude.com/en/docs/claude-code/ からインストール

# Codex CLI
npm install -g @openai/codex

# Cursor
# https://cursor.sh/ からインストール
```

### 3. API キーを設定

使用するツールに応じて設定:

```bash
# Claude Code
export ANTHROPIC_API_KEY="sk-ant-..."

# Codex CLI
export OPENAI_API_KEY="sk-..."
```

### 4. プロジェクトを開始

```bash
# Claude Code の場合
claude "タスク管理アプリを作りたい。シンプルで使いやすいものがいい。"

# Codex CLI の場合
codex "タスク管理アプリを作りたい。シンプルで使いやすいものがいい。"
```

これだけで、エージェントが:

1. 市場調査・競合分析を実施
2. `REQUIREMENTS.md`（要件定義書）を作成
3. ユーザー承認後、完全自律で実装
4. テストを書きながら TDD で開発
5. PR を作成して完了報告

---

## ワークフロー概要

```
┌─────────────────────────────────────────────────────────────────────┐
│  フェーズ1: 目的起点の仕様策定                                        │
│  ユーザーの目的を理解 → 市場調査 → REQUIREMENTS.md 作成              │
│  → ユーザー承認                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  フェーズ2: 完全自律実装                                              │
│  ExecPlan 生成 → TDD サイクル → 追加質問なしで実装完了               │
│  → PR 作成 → 「MISSION COMPLETE」                                    │
├─────────────────────────────────────────────────────────────────────┤
│  フェーズ3: 継続的改善（オプション）                                   │
│  フィードバック収集 → 自動分類 → GitHub Issue 作成                   │
│  → 条件を満たせば自動で PR 作成                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ディレクトリ構成

```
.
├── CLAUDE.md                          # Claude Code 用エントリーポイント
├── AGENTS.md                          # AI エージェント全般の行動指針（コア）
├── CONTEXT.md                         # プロジェクト固有コンテキスト（要書き換え）
├── README.md                          # このファイル
│
├── .claude/                           # Claude Code 固有の設定（PR#1-4 で整備予定）
├── .codex/                            # Codex CLI 固有の設定
│   ├── config.toml
│   └── requirements.example.toml
├── .cursor/                           # Cursor 固有のルール（PR#1-4 で整備予定）
│
└── .agents/                           # AI エージェント共通のハーネス本体
    ├── EXECPLAN_GUIDE.md              # ExecPlan のフォーマット・必須要件
    ├── REQUIREMENTS_TEMPLATE.md       # 要件定義書テンプレート
    ├── SECURITY_POLICY.md             # セキュリティポリシー
    ├── guidelines/                    # 詳細ガイドライン（必要時のみ参照）
    │   ├── UI_UX.md
    │   ├── FEEDBACK_WORKFLOW.md
    │   ├── ERROR_HANDLING.md
    │   ├── OBSERVABILITY.md
    │   └── AGENT_EVALUATION.md
    ├── rules/                         # 自己修正ループの出力先
    ├── plans/                         # 個別の ExecPlan ファイル
    ├── skills/                        # 再利用スキル（readable-code / test-writing 同梱）
    └── workflows/                     # 共通ワークフロー（後続で整備）
```

---

## 主要ファイル

### CLAUDE.md

Claude Code が最初に読むエントリーポイント。AGENTS.md と CONTEXT.md への誘導、自己修正ループの起動トリガーを定義。

### AGENTS.md

AI エージェント全般の動作を定義する中核ファイル。

- フェーズ分割型ワークフローの定義
- TDD + SDD の実装ルール
- 継続開発モードの判断基準
- 自己修正ループ
- 用語集

### CONTEXT.md

プロジェクト固有のコンテキストを記載するテンプレート。**導入時に実プロジェクトの情報で埋める必要がある**。

### `.agents/EXECPLAN_GUIDE.md`

ExecPlan（実行計画）の書き方・保守ルールの定義。複雑な作業を始める前に必読。

### `.agents/SECURITY_POLICY.md`

AI エージェントが自律動作する際の境界を定義。完全自律モードでも絶対に違反してはならないルール。

---

## AI ツール別の使い分け

| ツール | エントリーポイント | 主な用途 |
|--------|----------------|---------|
| **Claude Code**（推奨） | `CLAUDE.md` → `AGENTS.md` | 主要な開発作業 |
| **Codex CLI** | `AGENTS.md` | CLI 完結の自律タスク |
| **Cursor** | `.cursor/rules/main.mdc` → `AGENTS.md` | IDE 内の対話型編集 |

いずれも `.agents/` 配下を共有参照する。ツール固有の規約を `.claude/` や `.cursor/` に分散させず、`.agents/rules/` に集約することで一貫性を保つ。

---

## 自己修正ループ

ユーザー指摘や自身の誤りに気づいた時、AI は再発防止ルールを `.agents/rules/` に蓄積する。詳細は `AGENTS.md` の「自己修正ループ」節を参照。

```
[修正指示] → [ルール追記] → [次回以降は自動で回避]
```

---

## セキュリティ

### 基本原則

- **最小権限の原則**: タスクに必要な最小限の権限のみ使用
- **可逆性の確保**: 破壊的変更は段階的に実行、ロールバック手順を記録
- **シークレット保護**: 環境変数パターンで機密情報を除外

詳細は `.agents/SECURITY_POLICY.md` を参照。

---

## よくある質問

### Q: 特定のフレームワーク・言語が前提？

いいえ。本リポジトリはスタック非依存の汎用ハーネスです。Next.js や Supabase を同梱したフルスタック版が必要なら `nextjs-supabase-ai-starter`（別リポ、Track 2）を利用してください。

### Q: 既存プロジェクトに適用できる？

可能。`.agents/`（と必要に応じて `.claude/` / `.codex/` / `.cursor/`）をコピーし、`CLAUDE.md` / `AGENTS.md` / `CONTEXT.md` をリポジトリルートに置けば、エージェントが既存コードベースを理解して作業を開始します。

### Q: 複数の AI ツールを同時利用できる？

できます。`.agents/` が全ツールの source of truth なので、同じルールが Claude Code / Codex CLI / Cursor で参照されます。ツール固有の設定（`.claude/` / `.codex/` / `.cursor/`）は並行して置いても衝突しません。

### Q: ネットワークアクセスが必要な場合は？

各ツールの設定ファイルで制御します（Codex CLI: `.codex/config.toml` の `network_access = true`、Claude Code: `.claude/settings.json` の `permissions.allow`）。`.agents/SECURITY_POLICY.md` の許可ドメイン方針を必ず守ること。

---

## 貢献

Issue や Pull Request を歓迎します。

1. Fork する
2. Feature ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'feat: add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request を作成
