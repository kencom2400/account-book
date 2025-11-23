# @start-task - 最優先タスク自動開始

## トリガー

このプロンプトは `@start-task` で起動されます。

## 実行内容

最優先のIssueを自動的に開始します。**質問せず即座に実行**してください。

### 0. すべてのルールファイルを再読込（最優先）

**必ず最初に** `@inc-all-rules` を実行して、すべてのルールファイルを読み込んでください。

これにより、最新のプロジェクトルールに従ってタスクを実行できます。

### 1. Issue取得

GitHub Projectsから以下の条件でIssueを取得：

- ステータスが「📝 To Do」
- 自分がアサインされている
- OPENステータス

### 2. 優先順位判定とソート

優先度ラベルに基づいてソート：

- `priority: critical` → レベル4（最優先）
- `priority: high` → レベル3
- `priority: medium` → レベル2
- `priority: low` → レベル1
- ラベルなし → レベル0

**同じ優先度の場合、Issue番号が小さい方を優先**

### 3. 最優先Issueの開始

ソート後の最初のIssueで以下を実行：

```bash
# start-task.shスクリプトを使用（推奨）
./scripts/github/workflow/start-task.sh
```

または手動で以下を実行：

```bash
# mainブランチを最新化
git checkout main
git pull origin main

# フィーチャーブランチを作成
git checkout -b feature/issue-<番号>-<Issueタイトルをケバブケースにした文字列>

# GitHub ProjectsのステータスをIn Progressに変更
./scripts/github/projects/set-issue-in-progress.sh <issue番号>
```

### 4. 作業開始

Issueの内容に従って即座に作業を開始してください。

## 重要事項

- ✅ **最初に必ずすべてのルールファイルを再読込**（@inc-all-rulesの内容を実行）
- ✅ 質問・確認なしで即座に実行
- ✅ mainブランチから新しいブランチを作成
- ✅ GitHub ProjectsのステータスをIn Progressに変更
- ✅ 自分にアサインされているIssueのみを対象
- ✅ CLOSEDなIssueは除外

## 詳細

詳細は `.cursor/rules/04-github-integration.md` の「@start-task統合」セクションを参照してください.
