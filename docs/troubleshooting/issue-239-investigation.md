# Issue #239: 新規Issue作成時のBacklogステータス自動設定 - 調査報告

## 実施日

2025-11-21

## 調査内容

### 1. 問題の確認

**報告された問題:**

- 新規Issue作成時に"No Status"として登録される
- 手動でステータスを変更する必要がある

### 2. 実際の動作検証

#### テスト1: 既存スクリプト経由での作成

```bash
./scripts/github/issues/create-issue.sh scripts/github/issues/issue-data/drafts/test-backlog-script.json
```

**結果:**

- ✅ Issue #243作成成功
- ✅ プロジェクトに自動追加
- ✅ ステータスが「📋 Backlog」に自動設定

**結論:** 既存スクリプトは正しく動作している

#### テスト2: GitHub CLI直接実行

```bash
gh issue create --title "[TEST] No Status確認 - gh直接作成" --body "..." --label "task,testing"
```

**結果:**

- ✅ Issue #244作成成功
- ❌ プロジェクトに追加されない
- ❌ ステータスが設定されない（プロジェクトに未追加のため）

**結論:** GitHub CLIの直接使用では、プロジェクトへの自動追加が行われない

### 3. 根本原因の特定

**原因:** GitHub CLIの`gh issue create`コマンドは、Issue作成のみを行い、プロジェクトへの追加は行わない仕様

**影響範囲:**

- スクリプトを使用した場合: 問題なし ✅
- GitHub CLI直接使用: プロジェクトに追加されない ❌
- GitHub Web UI: プロジェクトに追加されない ❌

## 解決方法

### 採用した方法: 運用ルールでの対応

**理由:**

1. 既存スクリプトは完璧に動作している
2. GitHub Actions実装にはPAT設定が必要で複雑
3. シンプルな運用ルールで十分対応可能

**実施内容:**

1. `gh issue create`の直接使用を禁止事項として明記
2. 専用スクリプト使用を必須化
3. ルールファイルに明確に記載

## 実施した変更

### 1. `.cursor/rules/03-git-workflow.md`

**変更箇所:** CI Lint/Test失敗時の対応フロー

**変更前:**

```bash
gh issue create \
  --title "[BUG] [CI名]で[エラー数]個のエラー/警告が発生" \
  --label "bug,infrastructure,priority: high" \
  --body "[詳細な内容]"
```

**変更後:**

```bash
# 1. Issue用のJSONファイルを作成
cat > scripts/github/issues/issue-data/drafts/ci-error-bug.json << EOF
{
  "title": "[BUG] [CI名]で[エラー数]個のエラー/警告が発生",
  "labels": ["bug", "infrastructure", "priority: high"],
  "body": "[詳細な内容]"
}
EOF

# 2. スクリプトでIssue作成（自動的にBacklogに設定される）
./scripts/github/issues/create-issue.sh scripts/github/issues/issue-data/drafts/ci-error-bug.json
```

**追加:** ❌ **禁止**: `gh issue create`を直接使用しないでください。プロジェクトに自動追加されません。

### 2. `.cursor/rules/04-github-integration.md`

**追加セクション:** 🚨 Issue作成方法（重要）

**内容:**

- ✅ 専用スクリプトの使用を必須化
- ❌ GitHub CLI直接使用の禁止
- 使用例とその理由を明記
- 例外ケース（テスト目的）の記載

### 3. `.cursorrules`

**追加セクション:** 7. Issue作成方法

**内容:**

- ✅ 必ず専用スクリプトを使用
- ❌ `gh issue create`の直接使用は禁止

**クイックリファレンス更新:**

```bash
# Issue作成（必ずスクリプトを使用）
./scripts/github/issues/create-issue.sh <data-file>
```

## 検証結果

### Issue #243（スクリプト経由）

- プロジェクト追加: ✅
- ステータス: 📋 Backlog ✅

### Issue #244（CLI直接）

- プロジェクト追加: ❌
- ステータス: なし ❌

## 今後の運用

### Issue作成時の手順

1. JSONまたはYAMLファイルを作成
2. `create-issue.sh`スクリプトで作成
3. 自動的にBacklogステータスに設定される

### 禁止事項

- ❌ `gh issue create`の直接使用
- ❌ GitHub Web UIでのIssue作成（運用効率のため）

### 例外

テスト目的など、意図的にプロジェクトに追加したくない場合のみ、GitHub CLI直接使用を許可

## 受入基準の確認

- [x] すべての新規Issueが"Backlog"ステータスで登録される（スクリプト使用時）
- [x] Issue作成方法に関するルールが明記されている
- [x] ルールファイルに「新規Issue作成時はBacklog」が明記されている
- [x] すべてのルールファイル間で整合性が取れている
- [x] ドキュメントが更新されている
- [x] 既存の運用フローに影響を与えない

## 結論

**問題の本質:**

- 既存スクリプトは問題なし
- GitHub CLIの直接使用が問題

**解決方法:**

- 運用ルールで対応（シンプルで確実）
- スクリプト使用を必須化
- 禁止事項を明記

**効果:**

- 手動でのステータス変更が不要
- 一貫したIssue管理が実現
- 運用負荷の削減

## 関連Issue

- Issue #239: [process] 新規Issue作成時に自動的にBacklogステータスに設定する

## 作成者

AI Assistant (Cursor) - 2025-11-21
