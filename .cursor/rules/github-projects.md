# GitHub Projects & Issue 管理ルール

## 🎯 GitHub Projects 設定

### プロジェクト情報

- **プロジェクト名**: Account Book Development
- **プロジェクト番号**: #1
- **プロジェクトID**: `PVT_kwHOANWYrs4BIOm-`
- **所有者**: @kencom2400

### ステータスフィールド

**ステータス一覧（順序）:**

1. 🎯 Epic (ID: `9aa232cf`)
2. 📋 Backlog (ID: `f908f688`)
3. 📝 To Do (ID: `f36fcf60`)
4. 🚧 In Progress (ID: `16defd77`)
5. 👀 Review (ID: `0f0f2f26`)
6. ✅ Done (ID: `2f722d70`)

**ステータスフィールドID**: `PVTSSF_lAHOANWYrs4BIOm-zg4wCDo`

---

## 📋 Epic管理

### Epic Issue の作成ルール

1. **ラベル**: 必ず`epic`ラベルを付与
2. **Issue番号**: 連番で管理（例: #181-196）
3. **ステータス**: GitHub Projectに追加後、「🎯 Epic」に設定
4. **タイトル形式**: `[EPIC] {機能領域名} - {概要説明}`
   - 例: `[EPIC] データ取得機能 - 金融機関API連携と取引データ取得`

### Sub-issue関係の設定

**推奨方法: GraphQL API（完全自動化）**

```bash
# 1. Node IDを取得
EPIC_ID=$(gh api graphql -f query='query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 182) { id }
  }
}' | jq -r '.data.repository.issue.id')

SUB_ISSUE_ID=$(gh api graphql -f query='query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 23) { id }
  }
}' | jq -r '.data.repository.issue.id')

# 2. Sub-issue関係を設定
gh api graphql -f query="mutation {
  addSubIssue(input: {
    issueId: \"$EPIC_ID\"
    subIssueId: \"$SUB_ISSUE_ID\"
    replaceParent: false
  }) {
    issue {
      subIssuesSummary {
        total
        completed
        percentCompleted
      }
    }
  }
}"
```

**利用可能なGraphQL API:**

- **Mutations**:
  - `addSubIssue`: Sub-issue関係を追加
  - `removeSubIssue`: Sub-issue関係を削除
  - `reprioritizeSubIssue`: Sub-issueの順序を変更

- **Query Fields**:
  - `Issue.subIssues`: 子Issueの一覧
  - `Issue.parent`: 親Issue
  - `Issue.subIssuesSummary`: 進捗サマリー
    - `total`: 合計Sub-issue数
    - `completed`: 完了したSub-issue数
    - `percentCompleted`: 完了率

**❌ 非推奨の方法:**

- Tasklist方式（Issue本文に`- [ ] #123`）: 動作が不確定
- 旧来の`trackedIssues` / `trackedInIssues`フィールド: 非推奨

**参考スクリプト:**

- `scripts/github/setup-all-epic-subissues.sh`: 全Epic-Subissue一括設定

---

## ⚠️ 重要な制約と注意事項

### ProjectV2SingleSelectField の制約

**問題:**

- `ProjectV2SingleSelectField`（ステータスフィールド）の`options`配列を更新すると、**全オプションIDが再生成される**
- 既存Issueが参照している古いオプションIDとの紐付けが切れる
- 結果として、全Issueのステータスが「No Status」になる

**対策:**

#### 1. 事前バックアップ（必須）

```bash
gh project item-list 1 --owner @me --format json --limit 200 > backup-$(date +%Y%m%d).json
```

#### 2. ステータス確認

```bash
# ステータスなしのIssueを確認
gh project item-list 1 --owner @me --format json | jq '.items[] | select(.status == null)'

# ステータス別集計
gh project item-list 1 --owner @me --format json | jq '[.items[] | {status: .status}] | group_by(.status) | map({status: .[0].status, count: length})'
```

#### 3. ステータス復元（Timeline履歴から）

**復元スクリプトの実行:**

```bash
cd /Users/kencom/github/account-book
chmod +x scripts/github/restore-all-statuses-pagination.sh
./scripts/github/restore-all-statuses-pagination.sh
```

**復元の仕組み:**

1. Issue Timelineから`ProjectV2ItemStatusChangedEvent`を取得
2. 各Issueの最終ステータスを特定
3. 新しいステータスオプションIDにマッピング
4. `updateProjectV2ItemFieldValue` mutationで更新

**Timeline取得クエリ例:**

```graphql
query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 23) {
      timelineItems(last: 100) {
        nodes {
          __typename
          ... on ProjectV2ItemStatusChangedEvent {
            status
            previousStatus
            createdAt
          }
        }
      }
    }
  }
}
```

---

## 📊 Issue管理フロー

### 新規Issue作成時

1. **Issue作成**

   ```bash
   gh issue create --title "タイトル" --body "本文" --label "feature"
   ```

2. **GitHub Projectに追加**

   ```bash
   gh project item-add 1 --owner kencom2400 --url <issue_url>
   ```

3. **ステータスを設定**
   - 通常Issue: 「📋 Backlog」
   - Epic Issue: 「🎯 Epic」

### Issue作業フロー

```
📋 Backlog → 📝 To Do → 🚧 In Progress → 👀 Review → ✅ Done
```

**ステータス遷移のタイミング:**

- **To Do**: 次に取り組むIssueとして選択した時
- **In Progress**: 実際の作業を開始した時
- **Review**: PRを作成し、レビューを依頼した時
- **Done**: PRがマージされ、Issueをクローズした時

### Epic進捗の確認

```bash
# Epic #182の進捗を確認
gh api graphql -f query='
query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 182) {
      title
      subIssuesSummary {
        total
        completed
        percentCompleted
      }
      subIssues(first: 100) {
        nodes {
          number
          title
          state
        }
      }
    }
  }
}'
```

---

## 🛠️ よく使うコマンド集

### Issue操作

```bash
# Issue一覧取得
gh issue list --limit 100

# 特定ステータスのIssue取得（Project経由）
gh project item-list 1 --owner @me --format json | jq '.items[] | select(.status == "📝 To Do")'

# Issueのステータス更新
gh api graphql -f query="mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: \"PVT_kwHOANWYrs4BIOm-\"
    itemId: \"<PROJECT_ITEM_ID>\"
    fieldId: \"PVTSSF_lAHOANWYrs4BIOm-zg4wCDo\"
    value: { singleSelectOptionId: \"f36fcf60\" }
  }) {
    projectV2Item { id }
  }
}"
```

### Epic操作

```bash
# Epicの一覧取得
gh issue list --label epic --limit 100

# Epic配下のSub-issue追加
./scripts/github/setup-all-epic-subissues.sh

# Epic進捗確認
gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: 182) { subIssuesSummary { total completed percentCompleted } } } }'
```

### Project操作

```bash
# Project全体の状態確認
gh project view 1 --owner @me

# Project Item一覧（JSON）
gh project item-list 1 --owner @me --format json --limit 200

# ステータス別集計
gh project item-list 1 --owner @me --format json | jq '[.items[] | {number: .content.number, status: .status}] | group_by(.status) | map({status: .[0].status, count: length})'
```

---

## 📚 参考ドキュメント

### 作業記録・調査結果

- **`docs/epic-list.md`**: 16個のEpic一覧と概要
- **`docs/epic-completion-report.md`**: Epic作成作業の完了報告
- **`docs/api-epic-investigation.md`**: GraphQL API調査結果（Sub-issue管理）
- **`docs/sub-issue-investigation-result.md`**: Sub-issue設定の調査・検証結果
- **`docs/project-status-restoration-report.md`**: ステータス復元作業の詳細記録
- **`docs/epic-hierarchy-setup-guide.md`**: Epic階層化の手動設定ガイド（参考資料）
- **`docs/epic-project-management.md`**: Epic管理の総合ガイド

### スクリプト

- **`scripts/github/restore-all-statuses-pagination.sh`**: ステータス復元（ページネーション対応）
- **`scripts/github/projects/set-issue-in-progress.sh`**: Issueステータスを"In Progress"に変更
- **`scripts/github/projects/set-issue-done.sh`**: Issueステータスを"Done"に変更
- **`scripts/github/projects/move-issues-to-backlog.sh`**: IssueをBacklogに移動

---

## ✅ チェックリスト

### 新規Epic作成時

- [ ] Epicラベルを付与
- [ ] GitHub Projectに追加
- [ ] ステータスを「🎯 Epic」に設定
- [ ] 関連IssueをSub-issueとして設定（GraphQL API使用）
- [ ] Epic進捗を確認（subIssuesSummary）

### ステータスフィールド更新時

- [ ] 事前バックアップを取得
- [ ] 更新実施
- [ ] 全Issueのステータスを確認
- [ ] 必要に応じて復元スクリプト実行
- [ ] 復元結果を確認

### 新規Issue作成時

- [ ] 適切なラベルを付与
- [ ] GitHub Projectに追加
- [ ] ステータスを「📋 Backlog」に設定
- [ ] 関連するEpicがあればSub-issueとして追加
- [ ] Issueテンプレートに従って詳細を記載

---

**最終更新**: 2025-11-19
