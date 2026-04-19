# フィードバック駆動ワークフロー ガイドライン

> **参照タイミング**: REQUIREMENTS.md でフィードバック機能が有効化された場合に本ファイルを参照する。

---

## 1. 概要

フィードバック駆動ワークフローは、アプリユーザーからのフィードバックを収集し、
自動的に改善を実装する仕組み。初期構築後もプロダクトが継続的に進化することを目指す。

```
[ユーザー] → [フィードバック投稿] → [分類・分析] → [Issue作成] → [自動実装] → [PR作成] → [レビュー]
```

---

## 2. フィードバックページの実装

### 2.1 エンドポイント

```
GET  /feedback          - フィードバック投稿フォーム
POST /feedback          - フィードバック送信
GET  /feedback/status   - 投稿したフィードバックの状態確認（任意）
```

### 2.2 フォーム構成

**必須フィールド**:
- カテゴリ選択（バグ報告、機能要望、改善提案、その他）
- タイトル（50文字以内）
- 詳細説明（1000文字以内）

**任意フィールド**:
- メールアドレス（返信用）
- スクリーンショット添付
- 発生URL/画面
- 再現手順（バグの場合）

### 2.3 UI/UX ガイドライン

- シンプルで入力しやすいフォーム
- カテゴリ選択はラジオボタンまたはセレクト
- 送信後は感謝メッセージと参照番号を表示
- モバイル対応必須

**コンポーネント例（React + shadcn/ui）**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>フィードバックを送る</CardTitle>
    <CardDescription>
      改善のご提案やバグ報告をお待ちしています
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit}>
      <RadioGroup name="category">
        <RadioGroupItem value="bug" label="バグ報告" />
        <RadioGroupItem value="feature" label="機能要望" />
        <RadioGroupItem value="improvement" label="改善提案" />
        <RadioGroupItem value="other" label="その他" />
      </RadioGroup>
      <Input name="title" placeholder="タイトル" required />
      <Textarea name="description" placeholder="詳細" required />
      <Button type="submit">送信</Button>
    </form>
  </CardContent>
</Card>
```

---

## 3. フィードバック処理パイプライン

### 3.1 受信・保存

フィードバックを受信したら、以下の情報と共に保存：

```typescript
interface Feedback {
  id: string;                    // UUID
  category: FeedbackCategory;    // bug | feature | improvement | other
  title: string;
  description: string;
  email?: string;
  screenshot?: string;           // URL
  url?: string;                  // 発生画面
  createdAt: Date;
  status: FeedbackStatus;        // new | analyzing | implementing | done | rejected
  priority?: Priority;           // critical | high | medium | low
  issueUrl?: string;             // GitHub Issue URL
  prUrl?: string;                // PR URL
}
```

### 3.2 分類・優先度判定

フィードバック内容を分析し、優先度を自動判定：

**判定ロジック**:
```
キーワード分析:
  - "エラー", "動かない", "クラッシュ" → バグ、優先度 High
  - "セキュリティ", "情報漏洩" → Critical（手動対応フラグ）
  - "欲しい", "追加して" → 機能要望、優先度 Low
  - "改善", "使いにくい" → 改善提案、優先度 Medium
```

**分類結果の記録**:
- カテゴリと優先度を Feedback レコードに記録
- 判定理由を内部ログに保存

### 3.3 GitHub Issue 作成

優先度判定後、GitHub Issue を自動作成：

**Issue テンプレート**:
```markdown
## 概要
[フィードバックタイトル]

## カテゴリ
[バグ報告 / 機能要望 / 改善提案 / その他]

## 優先度
[🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low]

## 詳細
[フィードバック本文]

## 再現情報
- 発生URL: [URL]
- スクリーンショット: [添付]

## メタ情報
- フィードバックID: [ID]
- 投稿日時: [日時]
- 自動実装対象: [✅ はい / ❌ いいえ]

---
*このIssueはフィードバックシステムにより自動作成されました*
```

**ラベル設定**:
- `feedback` - フィードバック由来
- `bug` / `feature` / `improvement` - カテゴリ
- `priority:critical` / `priority:high` / `priority:medium` / `priority:low`
- `auto-implement` - 自動実装対象

---

## 4. 自動実装判定

### 4.1 自動実装の条件

以下を**すべて**満たす場合のみ自動実装：

| 条件 | チェック方法 |
|------|-------------|
| 優先度が閾値以下 | `priority <= config.auto_implement_max_priority` |
| 影響範囲が限定的 | 影響ファイル数 ≤ 3 |
| 既存アーキテクチャで対応可能 | 新規依存関係の追加なし |
| セキュリティリスクなし | セキュリティ関連キーワードなし |
| テストが壊れない見込み | 既存テストへの影響分析 |

### 4.2 自動実装の除外ケース

以下の場合は Issue 作成のみ：

- カテゴリが「機能要望」で大規模な変更が必要
- 優先度が High 以上
- セキュリティに関わる変更
- DB スキーマ変更が必要
- 外部 API 連携の変更
- 複数の独立した変更が混在

### 4.3 実装フロー

自動実装対象と判定された場合：

1. **コンテキスト収集**
   - 関連するコードファイルを特定
   - 既存のテストを確認
   - REQUIREMENTS.md を参照

2. **実装計画作成**
   - 変更内容の概要
   - 影響するファイル一覧
   - テスト方針

3. **TDD サイクル**
   - RED: 失敗するテストを追加
   - GREEN: 最小限の実装
   - REFACTOR: 整理

4. **検証**
   - 全テスト実行
   - lint チェック
   - ビルド確認

5. **PR 作成**
   - フィードバックへの参照を含める
   - 変更内容のサマリー
   - テスト結果

---

## 5. PR 作成ガイドライン

### 5.1 PR テンプレート

```markdown
## 概要
[フィードバック: #[Issue番号]] の対応

## 変更内容
- [変更点1]
- [変更点2]

## フィードバック内容
> [元のフィードバック引用]

## 技術的な変更
- 影響ファイル: [ファイル一覧]
- 新規依存: なし / [依存名]

## テスト結果
- [ ] 単体テスト: ✅ Pass
- [ ] 統合テスト: ✅ Pass
- [ ] E2E テスト: ✅ Pass

## チェックリスト
- [ ] REQUIREMENTS.md と整合性あり
- [ ] 既存機能への影響なし
- [ ] テストカバレッジ維持

---
*このPRはフィードバックシステムにより自動作成されました*
*レビュー後、問題なければマージしてください*
```

### 5.2 ブランチ命名規則

```
feedback/[issue番号]-[概要]
例: feedback/123-fix-button-alignment
```

### 5.3 コミットメッセージ

```
fix: [概要] (feedback #[ID])

Closes #[Issue番号]

フィードバック内容:
- [要約]

変更内容:
- [詳細]
```

---

## 6. 設定ファイル

### 6.1 feedback_config.toml

```toml
# .agents/feedback_config.toml

[feedback]
# フィードバック機能の有効化
enabled = true

# フィードバックページのパス
page_path = "/feedback"

# データストア
# "database" - アプリのDBに保存
# "github_issues" - GitHub Issuesのみ使用
store = "database"

[feedback.auto_implement]
# 自動実装を有効化
enabled = true

# 自動実装の優先度閾値
# この優先度以下のみ自動実装対象
# "low" | "medium" | "high" | "critical"
max_priority = "medium"

# 自動マージ（非推奨）
auto_merge = false

# 1日あたりの自動実装上限
daily_limit = 5

[feedback.notifications]
# 新規フィードバック通知
on_new = true

# PR作成時通知
on_pr_created = true

# チャンネル設定
# "github" - GitHub通知
# "slack" - Slack連携
# "email" - メール通知
channel = "github"

# Slack Webhook URL（channel = "slack" の場合）
# slack_webhook = "https://hooks.slack.com/..."

[feedback.github]
# Issue作成先リポジトリ（デフォルトは現在のリポジトリ）
# repository = "owner/repo"

# ラベル設定
labels = ["feedback"]

# アサイン先（任意）
# assignees = ["username"]
```

---

## 7. GitHub Actions によるワークフロー自動化

### 7.1 概要

フィードバックから PR 作成までの自動化は GitHub Actions で実現する。

```
[フィードバック投稿]
       ↓
[GitHub Issue 作成（アプリ側）]
       ↓
[ラベル付与: auto-implement]
       ↓
[GitHub Actions トリガー]
       ↓
[AI エージェント実行 → 実装]
       ↓
[PR 作成]
```

### 7.2 ワークフローファイル

`.github/workflows/feedback-auto-implement.yml`:

```yaml
name: Auto Implement Feedback

on:
  issues:
    types: [labeled]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  implement:
    # auto-implement ラベルが付与された時のみ実行
    if: github.event.label.name == 'auto-implement'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      # AI ツール側は好みで選択。以下は Claude Code の例。
      # Codex CLI: npm install -g @openai/codex
      # Cursor CLI: 公式ドキュメント参照
      - name: Install AI CLI
        run: npm install -g @anthropic-ai/claude-code
      
      - name: Get Issue Details
        id: issue
        uses: actions/github-script@v7
        with:
          script: |
            const issue = await github.rest.issues.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number
            });
            core.setOutput('title', issue.data.title);
            core.setOutput('body', issue.data.body);
            core.setOutput('number', context.issue.number);
      
      - name: Create implementation branch
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git checkout -b feedback/${{ steps.issue.outputs.number }}
      
      # 以下は Claude Code の例。Codex CLI を使う場合は:
      #   env: OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      #   run: codex --approval-mode full-auto --quiet "..."
      - name: Run AI agent to implement
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude --print --dangerously-skip-permissions \
            "以下のフィードバックに対応する実装を行ってください。
            
            Issue #${{ steps.issue.outputs.number }}: ${{ steps.issue.outputs.title }}
            
            ${{ steps.issue.outputs.body }}
            
            要件:
            1. 既存のコードスタイルに従う
            2. テストを追加する
            3. 変更は最小限に抑える
            4. REQUIREMENTS.md に沿った実装をする"
      
      - name: Run tests
        run: |
          if [ -f "package.json" ]; then
            npm ci
            npm test || echo "Tests failed, but continuing to create PR for review"
          fi
      
      - name: Commit changes
        run: |
          git add -A
          git diff --staged --quiet || git commit -m "fix: implement feedback #${{ steps.issue.outputs.number }}

          Addresses feedback from Issue #${{ steps.issue.outputs.number }}
          
          ${{ steps.issue.outputs.title }}"
      
      - name: Push branch
        run: git push -u origin feedback/${{ steps.issue.outputs.number }}
      
      - name: Create Pull Request
        uses: actions/github-script@v7
        with:
          script: |
            const { data: pr } = await github.rest.pulls.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `fix: feedback #${{ steps.issue.outputs.number }} - ${{ steps.issue.outputs.title }}`,
              head: `feedback/${{ steps.issue.outputs.number }}`,
              base: 'main',
              body: `## 概要
            
            [Feedback Issue #${{ steps.issue.outputs.number }}](https://github.com/${context.repo.owner}/${context.repo.repo}/issues/${{ steps.issue.outputs.number }}) への対応
            
            ## 元のフィードバック
            
            > ${{ steps.issue.outputs.title }}
            
            ## 自動実装について
            
            このPRはフィードバックシステムにより自動作成されました。
            レビュー後、問題なければマージしてください。
            
            ---
            Closes #${{ steps.issue.outputs.number }}`
            });
            
            // Issue にコメントを追加
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ steps.issue.outputs.number }},
              body: `🤖 自動実装が完了しました！\n\nPR: #${pr.number}\n\nレビューをお待ちしています。`
            });

  # 自動実装が失敗した場合の通知
  notify-failure:
    needs: implement
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Comment on Issue
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `⚠️ 自動実装に失敗しました。\n\n手動での対応が必要です。\n\n[ワークフロー実行ログ](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`
            });
            
            // auto-implement ラベルを削除し、needs-manual-review を追加
            await github.rest.issues.removeLabel({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              name: 'auto-implement'
            });
            
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: ['needs-manual-review']
            });
```

### 7.3 セットアップ手順

1. **AI ツールの API キー設定**
   使用するツールに応じて以下のキーを Secrets に登録:
   - Claude Code: `ANTHROPIC_API_KEY`
   - Codex CLI: `OPENAI_API_KEY`
   - Cursor: 各公式ドキュメント参照
   ```
   GitHub リポジトリ → Settings → Secrets and variables → Actions
   → New repository secret
   → Name: <ツールに応じたキー名>
   → Value: <APIキー>
   ```

2. **ワークフローファイルの配置**
   ```
   .github/
   └── workflows/
       └── feedback-auto-implement.yml
   ```

3. **必要なラベルの作成**
   - `auto-implement` - 自動実装対象
   - `needs-manual-review` - 手動対応必要
   - `feedback` - フィードバック由来

4. **ブランチ保護ルール（推奨）**
   ```
   Settings → Branches → Branch protection rules
   → main ブランチに対して:
   - Require a pull request before merging
   - Require approvals: 1
   ```

### 7.4 アプリ側の Issue 作成処理

フィードバック受信時に GitHub Issue を作成するコード例（Node.js）:

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN 
});

async function createFeedbackIssue(feedback: Feedback) {
  const labels = ['feedback', feedback.category];
  
  // 自動実装対象の判定
  if (shouldAutoImplement(feedback)) {
    labels.push('auto-implement');
  }
  
  // 優先度ラベル
  labels.push(`priority:${feedback.priority}`);
  
  const { data: issue } = await octokit.issues.create({
    owner: 'YOUR_ORG',
    repo: 'YOUR_REPO',
    title: `[Feedback] ${feedback.title}`,
    body: formatIssueBody(feedback),
    labels,
  });
  
  return issue;
}

function shouldAutoImplement(feedback: Feedback): boolean {
  // 自動実装の条件判定
  const config = loadFeedbackConfig();
  
  if (!config.auto_implement.enabled) return false;
  if (priorityLevel(feedback.priority) > priorityLevel(config.auto_implement.max_priority)) return false;
  if (feedback.category === 'feature' && isLargeFeature(feedback)) return false;
  if (containsSecurityKeywords(feedback.description)) return false;
  
  return true;
}
```

### 7.5 手動トリガー

自動判定されなかった Issue を後から自動実装対象にする場合：

1. GitHub Issue ページを開く
2. 右側の「Labels」から `auto-implement` を追加
3. GitHub Actions が自動的にトリガーされる

### 7.6 ワークフローのカスタマイズ

**テスト実行の追加**:
```yaml
- name: Run tests
  run: |
    npm ci
    npm test
  continue-on-error: true  # テスト失敗でも PR は作成
```

**Slack 通知の追加**:
```yaml
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🤖 Feedback #${{ steps.issue.outputs.number }} の自動実装PRが作成されました"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 8. セキュリティ考慮事項

### 7.1 入力検証

- すべての入力をサニタイズ
- ファイルアップロードは画像のみ許可
- サイズ制限を設ける（スクリーンショット: 5MB以内）

### 7.2 レート制限

- 同一IPからの投稿: 10件/時間
- 同一セッションからの投稿: 5件/時間

### 7.3 自動実装の制限

- セキュリティ関連のキーワードを含む場合は自動実装しない
- 認証・認可に関わるコードは自動変更しない
- 環境変数やシークレットに関わる変更は手動のみ

---

## 9. 監視・分析

### 9.1 メトリクス

収集すべきメトリクス：

- フィードバック総数（日次、週次）
- カテゴリ別の内訳
- 優先度別の内訳
- 自動実装率
- 自動実装の成功率（マージ率）
- 平均対応時間

### 9.2 ダッシュボード（任意）

開発者向けにフィードバック分析ダッシュボードを提供：

- `/admin/feedback` - フィードバック一覧
- フィルタリング（カテゴリ、優先度、ステータス）
- トレンド分析

---

## 10. トラブルシューティング

### 自動実装が動作しない

1. `feedback_config.toml` の `auto_implement.enabled` を確認
2. 優先度が閾値を超えていないか確認
3. 除外条件に該当していないか確認

### Issue が作成されない

1. GitHub トークンの権限を確認（`repo` スコープ必要）
2. リポジトリへの書き込み権限を確認

### PR のテストが失敗する

1. 自動実装のログを確認
2. 手動で修正し、PR を更新
3. 必要に応じて自動実装対象から除外
