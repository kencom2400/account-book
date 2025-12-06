# @inc-all-rules - すべてのルール再読込

## トリガー

このプロンプトは `@inc-all-rules` で起動されます。

## 実行内容

`.cursor/rules/` ディレクトリ内のすべてのルールファイルを再読込します。

### 新しいディレクトリ構造

Phase 2のリファクタリングにより、ルールファイルは以下のディレクトリ構造に整理されました：

```
.cursor/rules/
├── 00-workflow-checklist.d/    # ワークフロー・チェックリスト
├── 01-project.d/                # プロジェクト全体のガイドライン
├── 02-code-standards.d/         # コード品質基準とテスト
├── 03-git-workflow.d/           # Git ワークフロー
├── 04-github-integration.d/     # GitHub統合
├── 05-ci-cd.d/                  # CI/CD設定ガイドライン
└── templates/                    # テンプレート
```

各`.d`ディレクトリには、機能別に分割されたルールファイルが含まれています。

### 読込対象ファイル

以下のディレクトリ内のすべての`.md`ファイルを読み込んでください：

#### 1. ワークフロー・チェックリスト（最優先）

- `.cursor/rules/00-workflow-checklist.d/README.md`
- `.cursor/rules/00-workflow-checklist.d/01-overview.md`
- `.cursor/rules/00-workflow-checklist.d/02-task-start.md`
- `.cursor/rules/00-workflow-checklist.d/03-implementation.md`
- `.cursor/rules/00-workflow-checklist.d/04-push-check.md`
- `.cursor/rules/00-workflow-checklist.d/05-pr-review.md`
- `.cursor/rules/00-workflow-checklist.d/06-completion.md`

#### 2. プロジェクト全体のガイドライン

- `.cursor/rules/01-project.d/README.md`
- `.cursor/rules/01-project.d/01-overview.md`
- `.cursor/rules/01-project.d/02-tech-stack.md`
- `.cursor/rules/01-project.d/03-architecture.md`
- `.cursor/rules/01-project.d/04-coding-standards.md`
- `.cursor/rules/01-project.d/05-issue-management.md`

#### 3. コード品質基準とテスト

- `.cursor/rules/02-code-standards.d/README.md`
- `.cursor/rules/02-code-standards.d/01-type-safety.md` ⭐ 最優先
- `.cursor/rules/02-code-standards.d/02-test-requirements.md`
- `.cursor/rules/02-code-standards.d/03-data-access.md`
- `.cursor/rules/02-code-standards.d/04-architecture.md`
- `.cursor/rules/02-code-standards.d/05-test-guidelines.md`
- `.cursor/rules/02-code-standards.d/06-eslint-config.md`
- `.cursor/rules/02-code-standards.d/07-react-ui.md`
- `.cursor/rules/02-code-standards.d/08-implementation-checklist.md`
- `.cursor/rules/02-code-standards.d/09-script-tools.md`
- `.cursor/rules/02-code-standards.d/10-push-check.md`
- `.cursor/rules/02-code-standards.d/11-shell-scripts.md`
- `.cursor/rules/02-code-standards.d/12-gemini-learnings.md`

#### 4. Git ワークフロー

- `.cursor/rules/03-git-workflow.d/README.md`
- `.cursor/rules/03-git-workflow.d/01-branch-management.md`
- `.cursor/rules/03-git-workflow.d/02-commit-rules.md`
- `.cursor/rules/03-git-workflow.d/03-push-check.md`
- `.cursor/rules/03-git-workflow.d/04-pr-review.md`

#### 5. GitHub統合

- `.cursor/rules/04-github-integration.d/README.md`
- `.cursor/rules/04-github-integration.d/01-projects-setup.md`
- `.cursor/rules/04-github-integration.d/02-status-management.md`
- `.cursor/rules/04-github-integration.d/03-issue-reporting.md`
- `.cursor/rules/04-github-integration.d/04-start-task.md`

#### 6. CI/CD設定ガイドライン

- `.cursor/rules/05-ci-cd.d/README.md`
- `.cursor/rules/05-ci-cd.d/01-test-scripts.md`
- `.cursor/rules/05-ci-cd.d/02-env-management.md`
- `.cursor/rules/05-ci-cd.d/03-playwright-config.md`
- `.cursor/rules/05-ci-cd.d/04-github-actions.md`

#### 7. テンプレート

- `.cursor/rules/templates/issue-report.md`
- `.cursor/rules/templates/pr-description.md`

## 実行方法

以下のように、各ディレクトリ内のすべての`.md`ファイルを読み込んでください：

```typescript
// ディレクトリごとに読み込み
const directories = [
  '00-workflow-checklist.d',
  '01-project.d',
  '02-code-standards.d',
  '03-git-workflow.d',
  '04-github-integration.d',
  '05-ci-cd.d',
];

// 各ディレクトリ内の全ファイルを読み込み
for (const dir of directories) {
  const files = [
    `${dir}/README.md`,
    `${dir}/01-*.md`,
    `${dir}/02-*.md`,
    `${dir}/03-*.md`,
    `${dir}/04-*.md`,
    `${dir}/05-*.md`,
    `${dir}/06-*.md`,
    `${dir}/07-*.md`,
    `${dir}/08-*.md`,
    `${dir}/09-*.md`,
    `${dir}/10-*.md`,
    `${dir}/11-*.md`,
    `${dir}/12-*.md`,
  ];

  // 存在するファイルのみ読み込む
  await Promise.all(files.map((file) => read_file(`.cursor/rules/${file}`).catch(() => null)));
}

// テンプレートも読み込む
await Promise.all([
  read_file('.cursor/rules/templates/issue-report.md'),
  read_file('.cursor/rules/templates/pr-description.md'),
]);
```

**実用的なアプローチ**: 各ディレクトリの`README.md`を確認し、そこに記載されているファイル一覧に基づいて読み込むことを推奨します。

## 完了メッセージ

すべてのルールファイルを読み込んだ後、以下のメッセージを表示してください：

```
✅ すべてのルールファイルを再読込しました

📋 読込完了:
- 00-workflow-checklist.d/ (7ファイル)
- 01-project.d/ (6ファイル)
- 02-code-standards.d/ (13ファイル)
- 03-git-workflow.d/ (5ファイル)
- 04-github-integration.d/ (5ファイル)
- 05-ci-cd.d/ (5ファイル)
- templates/ (2ファイル)

合計: 43ファイル

🚀 準備完了！プロジェクトルールに従って作業を開始できます。
```

## 重要事項

- ✅ すべてのルールファイルを漏れなく読み込む
- ✅ 各ディレクトリの`README.md`を最初に読み込んで、ファイル一覧を確認
- ✅ 存在しないファイルの読み込みエラーは無視（オプショナルファイルのため）
- ✅ 読み込み完了を確認メッセージで通知
- ✅ エラーが発生した場合は具体的なエラー内容を報告
- ✅ 並列読み込みで効率化（可能な場合）

## 用途

以下のような場合に使用：

- コンテキスト切り替え後の再設定
- ルールファイルの更新後の再読込
- 新しいセッション開始時の初期化
- 長時間作業後のルール確認

## 注意事項

- 各`.d`ディレクトリには`README.md`が含まれており、ディレクトリの説明とファイル一覧が記載されています
- ファイル名は`01-`, `02-`などの数値プレフィックスで優先順位が示されています
- 最優先ファイル（例: `01-type-safety.md`）は最初に読み込むことを推奨します
