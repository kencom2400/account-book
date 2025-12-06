# プロジェクト全体のガイドライン - ディレクトリ

## 目的

このディレクトリには、プロジェクト全体のガイドライン（概要、技術スタック、アーキテクチャ原則、コーディング規約）が含まれています。

## ファイル一覧と優先順位

1. **`README.md`** - このファイル（ディレクトリの説明）
2. **`01-overview.md`** - プロジェクト概要
3. **`02-tech-stack.md`** - 技術スタック
4. **`03-architecture.md`** - アーキテクチャ原則
5. **`04-coding-standards.md`** - コーディング規約
6. **`05-issue-management.md`** - Issue管理

## セクション間の関係性

```
01-overview.md
    ↓
02-tech-stack.md → 03-architecture.md
    ↓
04-coding-standards.md
    ↓
05-issue-management.md
```

## 関連する他のディレクトリ

- **`00-workflow-checklist.d/`** - ワークフロー全体像
- **`02-code-standards.d/`** - コード品質基準（詳細）
- **`03-git-workflow.d/`** - Gitワークフロー（詳細）

## 使用方法

このディレクトリのファイルは、`@inc-all-rules`で自動的に読み込まれます。

個別に参照する場合は、以下のように指定してください：

```markdown
参照: `.cursor/rules/01-project.d/03-architecture.md`
```
