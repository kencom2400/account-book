# ワークフロー・チェックリスト - ディレクトリ

## 目的

このディレクトリには、タスク開始から完了までの全体フローを示すルールファイルが含まれています。

## ファイル一覧と優先順位

1. **`README.md`** - このファイル（ディレクトリの説明）
2. **`01-overview.md`** - ワークフロー全体像
3. **`02-task-start.md`** - タスク開始フェーズ
4. **`03-implementation.md`** - 実装フェーズ
5. **`04-push-check.md`** - push前チェック
6. **`05-pr-review.md`** - PR作成・レビュー
7. **`06-completion.md`** - マージ・完了報告

## セクション間の関係性

```
01-overview.md
    ↓
02-task-start.md → 03-implementation.md → 04-push-check.md
    ↓
05-pr-review.md → 06-completion.md
```

## 関連する他のディレクトリ

- **`01-project.d/`** - プロジェクト概要・技術スタック・アーキテクチャ
- **`02-code-standards.d/`** - コード品質・型安全性・テスト
- **`03-git-workflow.d/`** - ブランチ・コミット・PR（詳細）
- **`04-github-integration.d/`** - Issue管理・ステータス・報告（詳細）

## 使用方法

このディレクトリのファイルは、`@inc-all-rules`で自動的に読み込まれます。

個別に参照する場合は、以下のように指定してください：

```markdown
参照: `.cursor/rules/00-workflow-checklist.d/02-task-start.md`
```
