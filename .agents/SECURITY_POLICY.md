# セキュリティポリシー

このドキュメントは、AI エージェント（Claude Code / Codex CLI / Cursor など）が自律的に動作する際のセキュリティポリシーを定義する。
完全自律モードであっても、このポリシーに違反する操作は**絶対に実行してはならない**。

最終更新: 2026-04-18


## 設定ファイルとの関係

このドキュメントは**人間向けのポリシー説明**であり、実際のツール動作は各ツールの設定ファイルで制御される。

| ファイル | 役割 | 場所 |
|----------|------|------|
| `settings.json` / `settings.local.json` | Claude Code 設定 | `.claude/settings*.json` |
| `config.toml` | Codex CLI 設定（自動読み込み） | `.codex/config.toml` |
| `requirements.example.toml` | 管理者制約テンプレート（Codex CLI 用） | `.codex/requirements.example.toml` |
| `main.mdc` | Cursor ルール | `.cursor/rules/main.mdc` |
| `SECURITY_POLICY.md` | ポリシーの説明と根拠（本ファイル） | `.agents/SECURITY_POLICY.md` |

**重要**: 設定ファイルの変更時は、本ドキュメントのポリシーと整合性を確認すること。


## 1. 基本原則

### 1.1 最小権限の原則

エージェントは、タスク完了に**必要最小限の権限**のみを使用する。

- 読み取りで済む場合は書き込み権限を使用しない
- ローカルで完結する場合はネットワークアクセスを使用しない
- 一時的な権限昇格が必要な場合は、使用後すぐに元に戻す


### 1.2 明示的同意の原則

以下の操作は、事前に明示的な許可がない限り実行しない：

- プロジェクトディレクトリ外へのファイル書き込み
- ネットワークアクセス（許可リストにないドメイン）
- システム設定の変更
- 他プロセスへの干渉


### 1.3 可逆性の原則

可能な限り、操作は元に戻せる形で実行する：

- 削除前にバックアップを作成（または git で管理されていることを確認）
- 破壊的変更は段階的に実行
- ロールバック手順を Decision Log に記録


## 2. サンドボックス設定

**実際の設定は各 AI ツールの設定ファイルで行う**（Claude Code: `.claude/settings.json`、Codex CLI: `.codex/config.toml`、Cursor: ツール側 UI/設定）。

### 2.1 推奨設定（Codex CLI 例）

```toml
# .codex/config.toml

# サンドボックスモード
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false
writable_roots = []
```

### 2.2 ネットワークアクセスについて

**重要**: Codex CLI のネットワークアクセスはオン/オフのバイナリ制御のみ。
ドメイン単位の許可リストは Codex Cloud 版でのみ設定可能。Claude Code はコマンド許可リスト（`permissions.allow`）で WebFetch / WebSearch の粒度制御が可能。

Codex CLI でネットワークを有効化する場合:

```toml
[sandbox_workspace_write]
network_access = true
```

許可すべきドメインの参考リスト（Cloud版または代替ツールで設定）:

    github.com
    api.github.com
    registry.npmjs.org
    pypi.org
    crates.io

### 2.3 モード別の動作

| モード | ファイル読取 | ファイル書込 | コマンド実行 | ネットワーク |
|--------|------------|------------|------------|------------|
| `read-only` | ✅ 自動 | ❌ 承認必要 | ❌ 承認必要 | ❌ 承認必要 |
| `workspace-write` | ✅ 自動 | ✅ 作業領域内 | ✅ 作業領域内 | ❌ 承認必要 |
| `danger-full-access` | ✅ 自動 | ✅ 全領域 | ✅ 全領域 | ✅ 自動 |

**注意**: `danger-full-access` は開発中の特殊なデバッグ用途以外では使用禁止。


## 3. ファイルアクセス制御

### 3.1 許可パス（Allowlist）

以下のパスへのアクセスは許可される：

    # プロジェクト内（相対パス）
    ./**/*

    # 一時ファイル
    /tmp/codex-* /tmp/claude-*
    /var/folders/**/codex-* /var/folders/**/claude-*

### 3.2 禁止パス（Denylist）

以下のパスへのアクセスは**いかなる場合も禁止**：

    # 認証情報
    ~/.ssh/**
    ~/.aws/**
    ~/.config/gcloud/**
    ~/.gnupg/**
    ~/.netrc
    ~/.git-credentials

    # システム設定
    ~/.bashrc
    ~/.zshrc
    ~/.bash_profile
    ~/.zprofile
    ~/.profile
    /etc/**
    /usr/**
    /var/** (except /var/folders for temp)

    # 他プロジェクト
    ~/**/node_modules/** (except current project)
    ~/Desktop/**
    ~/Documents/** (except current project)
    ~/Downloads/**

    # シークレットファイル（読取は可、外部送信禁止）
    **/.env
    **/.env.*
    **/*.pem
    **/*.key
    **/*.p12
    **/*.pfx
    **/credentials.json
    **/service-account*.json

### 3.3 シークレット検出パターン

以下のパターンを含むデータは外部に送信してはならない：

    # API キー
    (api[_-]?key|apikey)["\s]*[:=]["\s]*[a-zA-Z0-9_\-]{20,}

    # AWS
    AKIA[0-9A-Z]{16}

    # GitHub
    gh[ps]_[a-zA-Z0-9]{36}
    github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}

    # Slack
    xox[baprs]-[0-9]{10,13}-[a-zA-Z0-9-]*

    # 一般的なシークレット
    (password|secret|token|auth)["\s]*[:=]["\s]*[^\s]{8,}


## 4. ネットワークアクセス制御

### 4.1 許可ドメイン（カテゴリ別）

**パッケージレジストリ**:

    registry.npmjs.org
    registry.yarnpkg.com
    pypi.org
    files.pythonhosted.org
    crates.io
    static.crates.io
    rubygems.org
    repo.maven.apache.org
    plugins.gradle.org

**ソースコードホスティング**:

    github.com
    api.github.com
    raw.githubusercontent.com
    gitlab.com
    bitbucket.org

**公式ドキュメント**:

    docs.github.com
    docs.python.org
    docs.rs
    developer.mozilla.org
    nodejs.org
    typescriptlang.org
    reactjs.org
    nextjs.org
    vercel.com

**その他（プロジェクト固有で追加）**:

    # プロジェクトで使用する API
    # api.example.com

### 4.2 拒否ドメイン

以下のドメインへのアクセスは禁止：

    # URL短縮サービス（リダイレクト先が不明）
    bit.ly
    t.co
    tinyurl.com
    goo.gl
    ow.ly
    is.gd

    # ファイル共有（検証困難）
    pastebin.com
    hastebin.com
    ghostbin.com

    # 動的IP・匿名サービス
    *.onion
    *.i2p


### 4.3 HTTP メソッド制限

| メソッド | 許可条件 |
|----------|----------|
| GET | 許可リストのドメインに対して自由に使用可 |
| POST | パッケージインストール、API 呼び出し（業務関連のみ） |
| PUT/PATCH | 明示的に許可された API のみ |
| DELETE | 原則禁止（特別な承認が必要） |


## 5. コマンド実行制御

### 5.1 許可コマンド

    # パッケージ管理
    npm install, npm ci, npm run, npm test
    yarn, yarn add, yarn install
    pip install, pip freeze
    cargo build, cargo test, cargo run

    # バージョン管理
    git status, git add, git commit, git push, git pull
    git branch, git checkout, git merge, git rebase
    git log, git diff, git show

    # ビルド・テスト
    make, cmake
    go build, go test, go run
    pytest, jest, vitest, mocha

    # Lint・フォーマット
    eslint, prettier, black, ruff, rustfmt

    # その他
    ls, cat, head, tail, grep, find (read-only operations)
    mkdir, touch, cp, mv (within workspace)

### 5.2 禁止コマンド

    # システム破壊
    rm -rf / , rm -rf ~, rm -rf /*
    dd if=* of=/dev/*
    mkfs.*
    fdisk

    # 権限操作
    chmod -R 777
    chown -R
    sudo (unless explicitly approved)
    su

    # ネットワーク（直接）
    curl | bash
    wget -O - | sh
    nc (netcat)
    nmap

    # プロセス操作
    kill -9 1
    killall
    pkill (system processes)

    # 環境汚染
    export (sensitive variables)
    unset PATH
    alias (system commands)

### 5.3 危険パターン検出

以下のパターンを含むコマンドは実行前に警告：

    # パイプでの直接実行
    curl .* \| .*sh
    wget .* \| .*sh

    # 再帰的削除（作業ディレクトリ外）
    rm -r[f]? [^.][^/]*

    # 環境変数への機密情報設定
    export .*(?:PASSWORD|SECRET|TOKEN|KEY)=


## 6. Web検索・外部情報収集

### 6.1 許可される検索クエリ

- 技術ドキュメント、API リファレンス
- エラーメッセージの解決方法
- ライブラリ・フレームワークの使用方法
- 業界動向、技術トレンド（REQUIREMENTS.md で指定された場合）
- 競合分析（REQUIREMENTS.md で指定された場合）

### 6.2 禁止される検索クエリ

- 個人を特定する情報（名前、住所、電話番号等）
- 機密性の高いビジネス情報（明示的許可がない限り）
- 違法行為に関連する情報
- セキュリティ攻撃手法（防御目的以外）

### 6.3 検索結果の取り扱い

1. **ソース記録**: 使用した情報源を Decision Log に記録
2. **信頼性評価**: 公式ドキュメント > 公式ブログ > Stack Overflow > 個人ブログ
3. **クロスチェック**: 重要な情報は複数ソースで確認
4. **ライセンス確認**: コードを引用する場合はライセンスを確認


## 7. インシデント対応

### 7.1 インシデントレベル

| レベル | 説明 | 対応 |
|--------|------|------|
| L1（軽微） | 意図しないファイル変更 | 自動ロールバック、ログ記録 |
| L2（中程度） | 禁止パスへのアクセス試行 | 操作中断、警告出力 |
| L3（重大） | シークレット漏洩の可能性 | 即座停止、**SECURITY INCIDENT** 出力 |
| L4（緊急） | システム破壊の可能性 | 即座停止、全操作ロールバック |

### 7.2 インシデント発生時の手順

1. **検出**: セキュリティポリシー違反を検出
2. **停止**: 現在の操作を即座に中断
3. **記録**: `Surprises & Discoveries` に詳細を記録
   - 何が起きたか
   - いつ起きたか
   - どのコマンド/操作が原因か
   - 影響範囲の推定
4. **通知**: 重大度に応じて出力
   - L1-L2: ログに記録、作業継続可
   - L3-L4: **「SECURITY INCIDENT: [概要]」** を出力し停止
5. **復旧**: 可能な限りロールバック
6. **報告**: ExecPlan の Outcomes に記録


## 8. 監査とログ

### 8.1 記録すべき操作

- ファイルの作成・編集・削除
- 外部ネットワークへのアクセス
- コマンド実行（特に副作用のあるもの）
- シークレットを含むファイルの読み取り

### 8.2 ログの保管

ログは以下の場所に保管される：

    .agents/logs/
    ├── operations.log    # 操作ログ
    ├── network.log       # ネットワークアクセスログ
    └── security.log      # セキュリティイベントログ

**注意**: ログにはシークレットを含めない。シークレットは `[REDACTED]` でマスクする。


## 9. ポリシー更新

このセキュリティポリシーは以下の場合に更新される：

1. 新しい脅威パターンの発見
2. プロジェクト要件の変更
3. AI ツール（Claude Code / Codex CLI / Cursor など）のアップデート

更新時は変更履歴セクションに記録すること。


---

## 変更履歴

| 日付 | 変更者 | 内容 |
|------|--------|------|
| 2025-01-21 | - | 初版作成 |


## 参考資料

- [Claude Code Settings](https://docs.claude.com/en/docs/claude-code/settings)
- [OpenAI Codex Security](https://developers.openai.com/codex/security/)
- [OpenAI Codex Advanced Configuration](https://developers.openai.com/codex/config-advanced/)
