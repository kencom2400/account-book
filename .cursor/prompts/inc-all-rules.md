# @inc-all-rules - すべてのルール再読込

## トリガー

このプロンプトは `@inc-all-rules` で起動されます。

## 実行内容

`.cursor/rules/` ディレクトリ内のすべてのルールファイルを再読込します。

### 読込対象ファイル

以下のファイルをすべて読み込んでください：

- **`.cursor/rules/00-WORKFLOW-CHECKLIST.md`** - ワークフロー・チェックリスト（最優先ガイド）
- **`.cursor/rules/GIT-WORKFLOW-ENFORCEMENT.md`** - Gitワークフロー遵守チェックリスト（再発防止ガイド）
- **`.cursor/rules/01-project.md`** - プロジェクト全体のガイドライン
- **`.cursor/rules/02-code-standards.md`** - コード品質基準とテスト
- **`.cursor/rules/03-git-workflow.md`** - Git ワークフロー
- **`.cursor/rules/04-github-integration.md`** - GitHub統合
- **`.cursor/rules/05-ci-cd.md`** - CI/CD設定ガイドライン
- **`.cursor/rules/templates/issue-report.md`** - Issue報告テンプレート
- **`.cursor/rules/templates/pr-description.md`** - PR説明テンプレート
- **`.cursor/rules/learned-from-gemini-perf-review.md`** - Geminiレビューからの学習内容

## 実行方法

以下のコマンドですべてのルールファイルを読み込んでください：

```typescript
// すべてのルールファイルをread_fileツールで読み込む
await Promise.all([
  read_file('.cursor/rules/00-WORKFLOW-CHECKLIST.md'),
  read_file('.cursor/rules/GIT-WORKFLOW-ENFORCEMENT.md'),
  read_file('.cursor/rules/01-project.md'),
  read_file('.cursor/rules/02-code-standards.md'),
  read_file('.cursor/rules/03-git-workflow.md'),
  read_file('.cursor/rules/04-github-integration.md'),
  read_file('.cursor/rules/05-ci-cd.md'),
  read_file('.cursor/rules/templates/issue-report.md'),
  read_file('.cursor/rules/templates/pr-description.md'),
  read_file('.cursor/rules/learned-from-gemini-perf-review.md'),
]);
```

## 完了メッセージ

すべてのルールファイルを読み込んだ後、以下のメッセージを表示してください：

```
✅ すべてのルールファイルを再読込しました

📋 読込完了:
- 00-WORKFLOW-CHECKLIST.md
- GIT-WORKFLOW-ENFORCEMENT.md
- 01-project.md
- 02-code-standards.md
- 03-git-workflow.md
- 04-github-integration.md
- 05-ci-cd.md
- templates/issue-report.md
- templates/pr-description.md
- learned-from-gemini-perf-review.md

🚀 準備完了！プロジェクトルールに従って作業を開始できます。
```

## 重要事項

- ✅ すべてのルールファイルを漏れなく読み込む
- ✅ 読み込み完了を確認メッセージで通知
- ✅ エラーが発生した場合は具体的なエラー内容を報告
- ✅ 並列読み込みで効率化（可能な場合）

## 用途

以下のような場合に使用：

- コンテキスト切り替え後の再設定
- ルールファイルの更新後の再読込
- 新しいセッション開始時の初期化
- 長時間作業後のルール確認
