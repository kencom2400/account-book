# ブランチ管理ルール

## 基本原則

- **Issue開始前に必ず適切なブランチを切ること**
- **ブランチ作成後、すぐにGitHub ProjectsのステータスをIn Progressに変更すること**
- ブランチ名は機能や修正内容を明確に表現する
- mainブランチへの直接コミットは禁止

## ブランチ命名規則

### 機能追加（feature）

```
feature/issue-<番号>-<簡潔な説明>
```

例: `feature/issue-24-yearly-graph`

### バグ修正（fix）

```
fix/issue-<番号>-<簡潔な説明>
```

例: `fix/issue-12-balance-calculation`

### リファクタリング（refactor）

```
refactor/issue-<番号>-<簡潔な説明>
```

例: `refactor/issue-8-onion-architecture`

### ドキュメント更新（docs）

```
docs/issue-<番号>-<簡潔な説明>
```

例: `docs/issue-5-api-documentation`

## ブランチ作成フロー

### 1. Issue開始時

```bash
# 最新のmainブランチを取得
git checkout main
git pull origin main

# 新しいブランチを作成
git checkout -b feature/issue-<番号>-<説明>

# GitHub ProjectsでステータスをIn Progressに変更
# 方法1: GitHub Web UIで手動変更（推奨）
#   1. GitHubのプロジェクトボードを開く
#   2. 該当Issueを見つける
#   3. ステータスを "📋 Backlog" から "🚧 In Progress" にドラッグ&ドロップ
#
# 方法2: GitHub CLI（プロジェクトのフィールドID、オプションIDが必要）
# gh project item-edit --project-id <PROJECT_ID> --id <ITEM_ID> --field-id <FIELD_ID> --option-id <OPTION_ID>
```

**重要**: ブランチを切った直後、作業開始前に必ずGitHub ProjectsのステータスをIn Progressに更新すること

**ステータス変更の確認方法**:

```bash
# プロジェクトのIssue一覧を確認
gh project item-list <プロジェクト番号> --owner <オーナー名> --format json | jq '.items[] | select(.content.number==<Issue番号>)'
```

### 2. 作業中

```bash
# 定期的にコミット
git add .
git commit -m "適切なコミットメッセージ"

# リモートにプッシュ
git push origin feature/issue-<番号>-<説明>
```

### 3. 作業完了時

```bash
# 最新のmainを取り込む
git fetch origin
git rebase origin/main

# Pull Requestを作成
# GitHub UIまたはgh cliを使用
```

## ブランチ保護ルール

### mainブランチ

- 直接pushは禁止
- Pull Request経由でのみマージ可能
- レビュー承認が必要（将来的に）
- CIテストが全て成功していること

### developブランチ（将来追加予定）

- 開発中の機能を統合するブランチ
- mainへのマージ前に安定性を確認

## ブランチ削除

### マージ後の削除

```bash
# リモートブランチの削除
git push origin --delete feature/issue-<番号>-<説明>

# ローカルブランチの削除
git branch -d feature/issue-<番号>-<説明>
```

## 注意事項

- ブランチ名は英小文字とハイフンのみ使用
- Issue番号を必ず含める（トレーサビリティ確保）
- 長期間マージされないブランチは定期的に見直す
- 不要なブランチは積極的に削除する

## Conflict解決

### リベース時のコンフリクト

```bash
# コンフリクトを確認
git status

# ファイルを編集してコンフリクトを解決
# ... エディタで修正 ...

# 解決後、リベースを続行
git add .
git rebase --continue
```

### マージ時のコンフリクト

```bash
# mainブランチの最新を取得
git fetch origin
git merge origin/main

# コンフリクトを解決
# ... エディタで修正 ...

# コミット
git add .
git commit -m "Resolve merge conflicts"
```

## 緊急対応（hotfix）

本番環境で緊急の修正が必要な場合：

```bash
# mainから直接hotfixブランチを作成
git checkout main
git checkout -b hotfix/issue-<番号>-<説明>

# 修正後、即座にmainへマージ
# レビューは事後でも可
```

## 参考

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://docs.github.com/ja/get-started/quickstart/github-flow)
