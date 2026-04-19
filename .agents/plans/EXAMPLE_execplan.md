# [機能名] ExecPlan

この ExecPlan は生きたドキュメントである。`Progress`、`Surprises & Discoveries`、`Decision Log`、`Outcomes & Retrospective` セクションは、作業の進行に合わせて常に最新に保たなければならない。

本ドキュメントは `.agents/EXECPLAN_GUIDE.md` のガイドラインに従って作成・保守される。


## Purpose / Big Picture

[2-3文で、この変更後に何が得られ、どうすれば動作していると分かるかを説明する。ユーザー視点での価値を明確にする。]

例：「この変更により、ユーザーはダッシュボードからリアルタイムで売上データを確認できるようになる。動作確認は、ダッシュボードにアクセスして過去24時間の売上グラフが表示されることで行う。」


## Progress

作業の進捗を追跡する。停止するたびに必ず更新すること。

- [ ] マイルストーン1: [説明]
  - [ ] (YYYY-MM-DD HH:MMZ) タスク1.1
  - [ ] タスク1.2
- [ ] マイルストーン2: [説明]
  - [ ] タスク2.1


## Surprises & Discoveries

実装中に見つかった予期せぬ挙動、バグ、最適化、気づきを記録する。

（まだ発見なし）


## Decision Log

作業中に行ったすべての決定を記録する。

- 決定：[何を決定したか]
  根拠：[なぜその決定をしたか]
  日付/著者：YYYY-MM-DD / エージェント


## Outcomes & Retrospective

完了時に成果、ギャップ、学びをまとめる。

（作業完了後に記載）


## Context and Orientation

### 関連ファイル

このタスクに関係するファイルをフルパスで列挙する。

- `src/example/file.ts` - [役割の説明]
- `tests/example.test.ts` - [テストの説明]


### 用語定義

非自明な用語を定義する。

- **[用語]**: [定義と、このリポジトリでどこに現れるか]


## Plan of Work

文章で、編集や追加の順序を説明する。

最初に [ファイルA] を変更して [機能X] を追加する。次に [ファイルB] を作成し、[コンポーネントY] を実装する。その後、[ファイルC] のテストを追加して振る舞いを検証する。最後に、統合テストを実行して全体の動作を確認する。


## Concrete Steps

### マイルストーン1: [名前]

#### スコープ

このマイルストーンで達成すること。

#### 手順

1. 作業ディレクトリ: `リポジトリルート`

       npm install [必要なパッケージ]

   期待される出力：

       added X packages

2. ファイル `src/example.ts` を編集:

       // 追加するコードの概要

3. テスト実行:

       npm test

   期待される結果：

       Tests: X passed, X total

#### 受け入れ条件

- [ ] [具体的な検証項目1]
- [ ] [具体的な検証項目2]


### マイルストーン2: [名前]

（同様の構造で記述）


## Validation and Acceptance

### 動作確認手順

1. サーバーを起動:

       npm run dev

2. ブラウザで `http://localhost:3000/[path]` にアクセス

3. 期待される振る舞い:
   - [具体的な入力] を行うと [具体的な出力] が得られる


### テスト実行

    npm test

期待される結果:

    PASS src/example.test.ts
    ✓ [テスト名1]
    ✓ [テスト名2]

    Tests: X passed, X total


## Idempotence and Recovery

この手順は何度実行しても安全である。失敗した場合は以下の手順でリカバリする：

1. [リカバリ手順]


## Artifacts and Notes

成功の証拠となるログ、差分、断片をここに記録する。

（作業完了後に追加）


## Interfaces and Dependencies

### 使用ライブラリ

- `[ライブラリ名]` (v[バージョン]) - [使用理由]

### 定義するインターフェース

    // ファイルパス: src/types/example.ts
    export interface ExampleInterface {
      property: string;
      method(): void;
    }


---

## 変更履歴

| 日付 | 変更者 | 内容 |
|------|--------|------|
| YYYY-MM-DD | エージェント | 初版作成 |
