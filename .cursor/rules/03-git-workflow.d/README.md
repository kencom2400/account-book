# Git ワークフロー - ディレクトリ

## 目的

このディレクトリには、ブランチ管理、コミット、Pull Requestの運用ルールが含まれています。

## ファイル一覧と優先順位

1. **`README.md`** - このファイル（ディレクトリの説明）
2. **`01-branch-management.md`** - ブランチ管理
3. **`02-commit-rules.md`** - コミットルール
4. **`03-push-check.md`** - push前チェック
5. **`04-pr-review.md`** - PR作成・レビュー

## セクション間の関係性

```
01-branch-management.md
    ↓
02-commit-rules.md
    ↓
03-push-check.md
    ↓
04-pr-review.md
```

## 絶対禁止事項

1. **mainブランチでの直接作業**: `01-branch-management.md`参照
2. **PRなしでのmainへのマージ**: `04-pr-review.md`参照
3. **PRマージ前にIssueをDoneに変更**: `04-pr-review.md`参照

## 関連する他のディレクトリ

- **`00-workflow-checklist.d/`** - ワークフロー全体像
- **`02-code-standards.d/`** - コード品質基準（push前チェックで参照）
- **`04-github-integration.d/`** - Issue管理・ステータス管理

## 使用方法

このディレクトリのファイルは、`@inc-all-rules`で自動的に読み込まれます。

個別に参照する場合は、以下のように指定してください：

```markdown
参照: `.cursor/rules/03-git-workflow.d/03-push-check.md`
```
