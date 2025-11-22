# start-task.sh - Issue開始スクリプト

## 概要

`start-task.sh`は、GitHub Issueの作業開始を自動化するスクリプトです。

## 機能

### 基本機能

1. **自動選択モード（引数なし）**
   - GitHub Projectsから「📝 To Do」ステータスのIssueを取得
   - 自分にアサインされているIssueをフィルタリング
   - 優先度順にソート（critical > high > medium > low）
   - 最優先Issueを自動選択して開始

2. **Issue ID指定モード（引数あり）**
   - 指定したIssue番号で作業を開始
   - Issue存在確認、ステータス確認、アサイン確認を実施
   - 問題がなければ作業を開始

### 実行される処理

1. Issue情報の取得と確認
   - Issue存在確認
   - OPENステータス確認
   - アサイン状況確認

2. 自分にアサイン（未アサインの場合）

3. mainブランチの最新化

   ```bash
   git checkout main
   git pull origin main
   ```

4. フィーチャーブランチの作成
   - ブランチ名: `feature/issue-{番号}-{タイトルのkebab-case}`
   - 例: `feature/issue-201-start-task-enhancement`

5. ステータスを「🚧 In Progress」に変更

## 使い方

### 基本的な使い方

```bash
# 最優先Issueを自動選択
./scripts/github/workflow/start-task.sh

# Issue #198を開始
./scripts/github/workflow/start-task.sh #198

# Issue #198を開始（#なしでもOK）
./scripts/github/workflow/start-task.sh 198

# ヘルプ表示
./scripts/github/workflow/start-task.sh --help
```

### 実行例

#### 自動選択モード

```bash
$ ./scripts/github/workflow/start-task.sh

🔍 GitHub Projectsから最優先Issueを取得中...

📌 最優先Issue: #201
   タイトル: [enhancement] @start-task コマンドに Issue ID 指定機能を追加
   優先度: medium

🔍 Issue #201 を確認中...

📋 開始するIssue:
   #201: [enhancement] @start-task コマンドに Issue ID 指定機能を追加

👤 アサイン中...
🔄 mainブランチを最新化中...
🌿 ブランチを作成中: feature/issue-201-start-task-enhancement
🚧 ステータスを '🚧 In Progress' に変更中...

✅ Issue #201 を開始しました
   タイトル: [enhancement] @start-task コマンドに Issue ID 指定機能を追加
   ステータス: 🚧 In Progress
   ブランチ: feature/issue-201-start-task-enhancement

Issue URL: https://github.com/kencom2400/account-book/issues/201
```

#### Issue ID指定モード

```bash
$ ./scripts/github/workflow/start-task.sh #198

🔍 Issue #198 を確認中...

📋 開始するIssue:
   #198: [documentation] 金融機関連携機能 (FR-001〜FR-005) モジュール詳細設計書の作成

👤 アサイン中...
🔄 mainブランチを最新化中...
🌿 ブランチを作成中: feature/issue-198-documentation-fr001-005
🚧 ステータスを '🚧 In Progress' に変更中...

✅ Issue #198 を開始しました
   タイトル: [documentation] 金融機関連携機能 (FR-001〜FR-005) モジュール詳細設計書の作成
   ステータス: 🚧 In Progress
   ブランチ: feature/issue-198-documentation-fr001-005

Issue URL: https://github.com/kencom2400/account-book/issues/198
```

## エラーハンドリング

### エラーケース1: Issue が存在しない

```bash
$ ./scripts/github/workflow/start-task.sh #999

🔍 Issue #999 を確認中...
❌ エラー: Issue #999 が見つかりません
```

### エラーケース2: Issue が既にクローズ済み

```bash
$ ./scripts/github/workflow/start-task.sh #100

🔍 Issue #100 を確認中...
❌ エラー: Issue #100 は既にクローズされています
   ステータス: ✅ Done
```

### エラーケース3: 既に自分にアサイン済み

```bash
$ ./scripts/github/workflow/start-task.sh #198

🔍 Issue #198 を確認中...
⚠️  注意: Issue #198 は既にあなたにアサインされています
   現在のステータス: 🚧 In Progress

続行しますか？ [y/N]: n
キャンセルしました
```

### エラーケース4: 他の人にアサイン済み

```bash
$ ./scripts/github/workflow/start-task.sh #150

🔍 Issue #150 を確認中...
❌ エラー: Issue #150 は既に @other-user にアサインされています
   ステータス: 🚧 In Progress

※ 先にアサインを解除するか、別のIssueを選択してください
```

### エラーケース5: 無効な形式

```bash
$ ./scripts/github/workflow/start-task.sh invalid

❌ エラー: 無効な形式です
   正しい形式: start-task.sh #198
   または: start-task.sh 198
```

## 設定ファイル

### config.sh

プロジェクト固有の設定を管理します。

```bash
# リポジトリ情報
export REPO_OWNER="kencom2400"
export REPO_NAME="account-book"

# プロジェクト情報
export PROJECT_NUMBER=1
export PROJECT_ID="PVT_kwHOANWYrs4BIOm-"

# ステータスフィールドID
export STATUS_FIELD_ID="PVTSSF_lAHOANWYrs4BIOm-zg4wCDo"

# ステータスオプションID
export BACKLOG_OPTION_ID="f908f688"
export TODO_OPTION_ID="f36fcf60"
export IN_PROGRESS_OPTION_ID="16defd77"
export REVIEW_OPTION_ID="0f0f2f26"
export DONE_OPTION_ID="2f722d70"

# ステータス名の定義
export STATUS_BACKLOG="📦 Backlog"
export STATUS_TODO="📝 To Do"
export STATUS_IN_PROGRESS="🚧 In Progress"
export STATUS_REVIEW="👀 Review"
export STATUS_DONE="✅ Done"
```

## 優先度の判定

スクリプトは以下のロジックで優先度を判定します：

| ラベル               | 優先度レベル |
| -------------------- | ------------ |
| `priority: critical` | 4            |
| `priority: high`     | 3            |
| `priority: medium`   | 2            |
| `priority: low`      | 1            |
| ラベルなし           | 0            |

同じ優先度の場合、Issue番号が小さい方を優先します。

## 依存関係

### 必須ツール

- `gh` (GitHub CLI)
- `git`
- `jq` (JSON処理)

### 関連スクリプト

- `scripts/github/projects/set-issue-in-progress.sh` - ステータス変更
- `scripts/github/projects/update-issue-status.sh` - 汎用ステータス更新

## トラブルシューティング

### GitHub CLIの認証エラー

```bash
# GitHub CLIに認証
gh auth login
```

### jqがインストールされていない

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Gitブランチの作成に失敗

```bash
# 既存のブランチを削除
git branch -D feature/issue-XXX-XXX

# mainブランチを最新化
git checkout main
git pull origin main
```

## 制限事項

- ブランチ名は最大60文字に制限されます
- 同じIssue番号で複数回実行すると、既にアサインされている警告が表示されます
- 他の人にアサインされているIssueは開始できません

## 今後の拡張

- `@complete-task` コマンドの実装
- `@review-task` コマンドの実装
- 複数Issue同時開始のサポート
- Cursorからのシームレスな実行

## 参考資料

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub GraphQL API - Projects V2](https://docs.github.com/en/graphql/reference/mutations)
- [Issue #201](https://github.com/kencom2400/account-book/issues/201)
