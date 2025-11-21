# GitHub Issue管理ガイド

このドキュメントでは、本プロジェクトにおけるGitHub Issueの管理方法について説明します。

## 📋 目次

1. [Issueテンプレート](#issueテンプレート)
2. [ラベルの使い方](#ラベルの使い方)
3. [マイルストーンの使い方](#マイルストーンの使い方)
4. [プロジェクトボードの使い方](#プロジェクトボードの使い方)
5. [Issue作成のベストプラクティス](#issue作成のベストプラクティス)
6. [セットアップ手順](#セットアップ手順)

## 📝 Issueテンプレート

### 1. 機能要件（Feature Request）

新機能や機能拡張の要望を記録するためのテンプレートです。

**使用タイミング:**

- 新しい機能の実装が必要なとき
- 既存機能の拡張が必要なとき
- 機能要件書（FR-001〜FR-031）に基づいた実装

**自動付与ラベル:**

- `feature`
- 機能要件IDに応じた機能別ラベル

### 2. バグ報告（Bug Report）

バグや不具合を報告するためのテンプレートです。

**使用タイミング:**

- アプリケーションが正常に動作しないとき
- エラーが発生したとき
- 期待される動作と異なる動作をしたとき

**自動付与ラベル:**

- `bug`
- 影響範囲に応じた優先度ラベル

### 3. タスク（Task）

開発タスク、リファクタリング、ドキュメント作成などを記録するためのテンプレートです。

**使用タイミング:**

- リファクタリングが必要なとき
- ドキュメントの作成・更新が必要なとき
- 環境構築やCI/CD設定が必要なとき
- テストの追加・改善が必要なとき

**自動付与ラベル:**

- `task`
- 作業内容に応じた種別ラベル

## 🏷️ ラベルの使い方

### ラベルの種類

#### 1. タイプ別ラベル

| ラベル           | 説明               | 色          |
| ---------------- | ------------------ | ----------- |
| `feature`        | 新機能の実装       | 🟢 緑       |
| `bug`            | バグ修正           | 🔴 赤       |
| `enhancement`    | 既存機能の改善     | 🔵 水色     |
| `refactor`       | リファクタリング   | 🟡 黄       |
| `documentation`  | ドキュメント関連   | 🔵 青       |
| `testing`        | テスト関連         | 🔵 青       |
| `infrastructure` | インフラ・環境構築 | 🟣 紫       |
| `security`       | セキュリティ関連   | 🟠 オレンジ |
| `task`           | 開発タスク         | ⚪ グレー   |

#### 2. 領域別ラベル

| ラベル     | 説明                      |
| ---------- | ------------------------- |
| `backend`  | バックエンド（NestJS）    |
| `frontend` | フロントエンド（Next.js） |
| `library`  | 共通ライブラリ            |
| `database` | データベース              |
| `api`      | API関連                   |

#### 3. 機能別ラベル

| ラベル           | 対応機能要件 | 説明                   |
| ---------------- | ------------ | ---------------------- |
| `integration`    | FR-001〜007  | 外部連携（銀行・証券） |
| `classification` | FR-008〜011  | データ分類             |
| `category`       | FR-008〜011  | カテゴリ管理           |
| `credit-card`    | FR-012〜015  | クレジットカード管理   |
| `reconciliation` | FR-012〜015  | 照合機能               |
| `aggregation`    | FR-016〜022  | 集計機能               |
| `event`          | FR-021〜022  | イベント機能           |
| `visualization`  | FR-023〜027  | 可視化・グラフ         |
| `chart`          | FR-023〜027  | チャート表示           |
| `settings`       | FR-028〜031  | 設定機能               |
| `sync`           | -            | 同期機能               |
| `notification`   | -            | 通知機能               |
| `alert`          | -            | アラート               |

#### 4. 優先度ラベル

| ラベル               | 説明       | 対応時間       |
| -------------------- | ---------- | -------------- |
| `priority: critical` | 最優先     | 即座に対応     |
| `priority: high`     | 優先度：高 | 当日〜翌日     |
| `priority: medium`   | 優先度：中 | 1週間以内      |
| `priority: low`      | 優先度：低 | 時間があるとき |

#### 5. ステータスラベル

| ラベル                | 説明       |
| --------------------- | ---------- |
| `status: completed`   | 完了       |
| `status: in-progress` | 進行中     |
| `status: blocked`     | ブロック中 |
| `status: on-hold`     | 保留       |
| `status: review`      | レビュー中 |

#### 6. サイズラベル（工数見積もり）

| ラベル     | 工数      |
| ---------- | --------- |
| `size: XS` | 0.5日以下 |
| `size: S`  | 0.5〜1日  |
| `size: M`  | 1〜3日    |
| `size: L`  | 3〜5日    |
| `size: XL` | 5日以上   |

### ラベル付与の例

#### 例1: 銀行連携機能の実装

```
- feature
- integration
- bank
- backend
- priority: high
- size: L
```

#### 例2: グラフ表示のバグ修正

```
- bug
- visualization
- chart
- frontend
- priority: medium
- size: S
```

#### 例3: ドキュメント更新タスク

```
- task
- documentation
- priority: low
- size: XS
```

## 🎯 マイルストーンの使い方

### マイルストーンの設定

本プロジェクトでは、開発フェーズに応じてマイルストーンを設定します。

| マイルストーン            | 説明                             | 期間        |
| ------------------------- | -------------------------------- | ----------- |
| Phase 0: 基盤構築         | プロジェクト初期化、開発環境構築 | 完了済み    |
| Phase 1: データ取得       | 外部API連携、データ取得機能      | FR-001〜007 |
| Phase 2: 分類機能         | 自動分類、カテゴリ管理           | FR-008〜011 |
| Phase 3: クレジットカード | カード管理、照合機能             | FR-012〜015 |
| Phase 4: 集計・分析       | 月次・年次集計、イベント         | FR-016〜022 |
| Phase 5: 可視化           | グラフ・チャート表示             | FR-023〜027 |
| Phase 6: 設定機能         | 各種設定画面                     | FR-028〜031 |
| Phase 7: 最適化           | パフォーマンス、セキュリティ     | NFR関連     |

### マイルストーンの作成コマンド

```bash
# GitHub CLIを使用したマイルストーン作成
gh milestone create "Phase 1: データ取得" --description "FR-001〜007: 外部API連携、データ取得機能の実装" --due-date 2025-12-31
gh milestone create "Phase 2: 分類機能" --description "FR-008〜011: 自動分類、カテゴリ管理の実装" --due-date 2026-01-31
gh milestone create "Phase 3: クレジットカード" --description "FR-012〜015: カード管理、照合機能の実装" --due-date 2026-02-28
gh milestone create "Phase 4: 集計・分析" --description "FR-016〜022: 月次・年次集計、イベント機能の実装" --due-date 2026-03-31
gh milestone create "Phase 5: 可視化" --description "FR-023〜027: グラフ・チャート表示の実装" --due-date 2026-04-30
gh milestone create "Phase 6: 設定機能" --description "FR-028〜031: 各種設定画面の実装" --due-date 2026-05-31
gh milestone create "Phase 7: 最適化" --description "パフォーマンス最適化、セキュリティ強化" --due-date 2026-06-30
```

## 📊 プロジェクトボードの使い方

### ボードの構成

以下のカラムでKanbanスタイルのプロジェクトボードを構成します：

1. **📋 Backlog** - 未着手のIssue
2. **📝 To Do** - 着手予定のIssue
3. **🚧 In Progress** - 作業中のIssue
4. **👀 Review** - レビュー待ちのIssue/PR
5. **✅ Done** - 完了したIssue/PR

### ボードの自動化

GitHub Actionsで以下の自動化を設定しています：

#### 計画中の自動化（TODO）

以下の自動化ルールは今後実装予定です：

- Issueが作成されたら → Backlogに追加
- Issueに`status: in-progress`ラベルが付いたら → In Progressに移動
- Issueに`status: review`ラベルが付いたら → Reviewに移動
- PRが作成されたら → Reviewに追加

#### `.github/workflows/update-project-status.yml` (実装済み)

**Issue/PRクローズ時の自動更新:**

- IssueまたはPRがクローズされると、自動的にGitHub Projectsのステータスが「✅ Done」に更新されます
- 複数のプロジェクトに属していても、全てのプロジェクトで自動更新されます
- すでに「Done」ステータスの場合はスキップされます
- エラーが発生してもワークフロー全体は失敗しません（graceful degradation）

**手動更新が必要な場合:**

- ステータスを「📝 To Do」や「🚧 In Progress」に変更する場合は、手動でプロジェクトボードを操作するか、以下のスクリプトを使用：
  - `./scripts/github/projects/set-issue-in-progress.sh <issue番号>` - In Progressに変更
  - `./scripts/github/projects/set-issue-done.sh <issue番号>` - Doneに変更（手動で必要な場合）

## ✍️ Issue作成のベストプラクティス

### 1. 明確なタイトル

❌ **悪い例:**

```
バグ
グラフが表示されない
```

✅ **良い例:**

```
[BUG] 月次収支グラフが2025年11月のデータで表示されない
[FEATURE] FR-023: 月別収支グラフの実装
[TASK] カテゴリAPIのリファクタリング
```

### 2. 詳細な説明

- **何を**実装するのか
- **なぜ**必要なのか
- **どのように**実装するのか
  を明確に記載する

### 3. 受入基準（Acceptance Criteria）の明記

```markdown
## 受入基準

- [ ] ユーザーがダッシュボードで月次収支グラフを表示できる
- [ ] グラフは収入と支出を別々の色で表示する
- [ ] 月を選択できるドロップダウンが動作する
- [ ] データがない場合は適切なメッセージを表示する
```

### 4. 関連Issueやドキュメントへのリンク

```markdown
## 関連情報

- 機能要件書: [FR-023](../docs/functional-requirements/FR-023-027_visualization.md)
- 関連Issue: #123, #124
- デザイン: [Figma Link]
```

### 5. 適切なラベル付け

- 最低でも「タイプ」「領域」「優先度」のラベルを付ける
- 工数見積もりのサイズラベルを付ける

## 🚀 セットアップ手順

### 1. ラベルの一括作成

```bash
# GitHub CLIを使用（推奨）
cd /Users/kencom/github/account-book
gh label list # 既存ラベルの確認

# .github/labels.ymlからラベルを作成する場合は以下のスクリプトを実行
# (手動でWebから作成することも可能)
```

### 2. マイルストーンの作成

上記の「マイルストーンの作成コマンド」を実行

### 3. プロジェクトボードの作成

```bash
# GitHub CLIでプロジェクトを作成
gh project create --owner @me --title "Account Book Development" --description "資産管理アプリ開発プロジェクト"

# または、WebのGitHub Projects (beta)から作成
# https://github.com/users/YOUR_USERNAME/projects
```

### 4. 既存Issueの移行

既存の設計ドキュメントに基づいてIssueを一括作成する場合：

```bash
# スクリプトで一括作成（別途作成が必要）
./scripts/create-issues-from-requirements.sh
```

## 📚 参考資料

- [GitHub Issueドキュメント](https://docs.github.com/ja/issues)
- [GitHub Projects](https://docs.github.com/ja/issues/planning-and-tracking-with-projects)
- [要件定義書](../docs/requirements-specification.md)
- [システム構成要件書](../docs/system-architecture.md)
- [機能要件書一覧](../docs/functional-requirements/)

---

## 💡 Tips

### Issueの検索

```bash
# ラベルで絞り込み
label:feature label:frontend

# マイルストーンで絞り込み
milestone:"Phase 3: クレジットカード"

# 担当者で絞り込み
assignee:@me

# ステータスで絞り込み
label:"status: in-progress"

# 複合検索
is:open label:bug label:backend priority:high
```

### Issue番号の活用

コミットメッセージやPRでIssue番号を参照：

```bash
git commit -m "feat: 月次収支グラフの実装 #123"

# 自動的にIssueをクローズ
git commit -m "fix: グラフ表示バグの修正 Closes #124"
```

---

**最終更新**: 2025-11-15
