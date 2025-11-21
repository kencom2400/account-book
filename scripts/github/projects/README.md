# GitHub Projects スクリプト集

GitHub Projectsのステータス管理に使用するスクリプト集です。

## スクリプト一覧

### 汎用スクリプト

#### `update-issue-status.sh`

任意のステータスにIssueを変更できる汎用スクリプトです。

**使い方:**

```bash
./scripts/github/projects/update-issue-status.sh <issue番号> <ステータス>
```

**例:**

```bash
# In Progressに変更
./scripts/github/projects/update-issue-status.sh 24 "🚧 In Progress"

# Doneに変更
./scripts/github/projects/update-issue-status.sh 24 "✅ Done"

# To Doに変更
./scripts/github/projects/update-issue-status.sh 24 "📝 To Do"

# Backlogに変更
./scripts/github/projects/update-issue-status.sh 24 "📦 Backlog"
```

**利用可能なステータス:**

- `📝 To Do`
- `🚧 In Progress`
- `✅ Done`
- `📦 Backlog`

---

### 便利なラッパースクリプト

以下のスクリプトは`update-issue-status.sh`のラッパーで、よく使うステータスへの変更を簡単に行えます。

#### `set-issue-in-progress.sh`

IssueをIn Progressに変更します。

**使い方:**

```bash
./scripts/github/projects/set-issue-in-progress.sh <issue番号>
```

**例:**

```bash
./scripts/github/projects/set-issue-in-progress.sh 24
```

---

#### `set-issue-done.sh`

IssueをDoneに変更します。

**使い方:**

```bash
./scripts/github/projects/set-issue-done.sh <issue番号>
```

**例:**

```bash
./scripts/github/projects/set-issue-done.sh 24
```

---

### その他のスクリプト

#### `move-issues-to-backlog.sh`

複数のIssueをBacklogに移動します。

#### `move-issues-to-backlog-graphql.sh`

GraphQL APIを使用して、複数のIssueをBacklogに移動します。

#### `move-issues-to-backlog-graphql-simple.sh`

GraphQL APIを使用して、複数のIssueをBacklogに移動します（シンプル版）。

---

## 内部実装について

### 後方互換性

`set-issue-in-progress.sh`と`set-issue-done.sh`は、`update-issue-status.sh`のラッパーとして実装されています。これにより、既存のスクリプトを使用しているコードは変更なく動作し、コードの重複も削減されます。

### アーキテクチャ

```
update-issue-status.sh (汎用スクリプト)
    ↑
    ├── set-issue-in-progress.sh (ラッパー)
    └── set-issue-done.sh (ラッパー)
```

---

## トラブルシューティング

### エラー: プロジェクトが見つからない

プロジェクト番号が正しいか確認してください。デフォルトは`1`です。

### エラー: Issueが見つからない

Issue番号が正しいか、Issueがプロジェクトに追加されているか確認してください。

### エラー: ステータスが見つからない

ステータス名（絵文字含む）を正確に入力してください。利用可能なステータスは`update-issue-status.sh`の実行時に表示されます。

---

## 注意事項

- すべてのスクリプトは`gh`コマンド（GitHub CLI）が必要です
- スクリプト実行には適切な権限が必要です
- Issue番号とステータス名は正確に指定してください
