# Issue管理

## Issue管理

### Epic管理

#### Epic作成とSub-issue設定

**Epic Issue作成時のルール:**

- Epic Issueには必ず`epic`ラベルを付与する
- Issue番号は連番で管理（例: #181-196）
- GitHub Projectに追加し、ステータスを「🎯 Epic」に設定する

**Sub-issue関係の設定:**

- **GraphQL APIの`addSubIssue` mutationを使用してプログラム的に設定する**（推奨）

  ```bash
  # Issue Node IDを取得
  EPIC_ID=$(gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: 182) { id } } }' | jq -r '.data.repository.issue.id')
  SUB_ISSUE_ID=$(gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: 23) { id } } }' | jq -r '.data.repository.issue.id')

  # Sub-issue関係を設定
  gh api graphql -f query="mutation { addSubIssue(input: { issueId: \"$EPIC_ID\" subIssueId: \"$SUB_ISSUE_ID\" replaceParent: false }) { issue { subIssuesSummary { total completed } } } }"
  ```

- 利用可能なGraphQL mutations:
  - `addSubIssue`: Sub-issue関係を追加
  - `removeSubIssue`: Sub-issue関係を削除
  - `reprioritizeSubIssue`: Sub-issueの順序を変更
- 利用可能なフィールド:
  - `Issue.subIssues`: 子Issueの一覧
  - `Issue.parent`: 親Issue
  - `Issue.subIssuesSummary`: 進捗サマリー（total, completed, percentCompleted）

**注意事項:**

- 旧来の`trackedIssues` / `trackedInIssues`フィールドは非推奨
- Tasklist方式（Issue本文に`- [ ] #123`形式）は動作が不確定なため非推奨
- 手動UI設定も可能だが、自動化スクリプトを推奨

**参考スクリプト:**

- `scripts/github/setup-all-epic-subissues.sh`: 全Epic-Subissue関係の一括設定

### Issue作成時のルール

- **Issue作成時は必ずGitHub Projectsに追加する**
  - プロジェクト名: `Account Book Development`
  - コマンド例: `gh project item-add 1 --owner kencom2400 --url <issue_url>`
- **追加時のステータスは必ず「📋 Backlog」にする**
- 適切なラベルを付与する（bug、feature、enhancement等）
- テンプレートに従って詳細を記載する
- 関連するissueやPRがあれば明記する

### Issue取得時のルール

- **GitHub Projectsから取得する際は必ず「📋 To Do」ステータスから取得する**
  - コマンド例: `gh project item-list 1 --owner kencom2400 --format json | jq '.items[] | select(.status.name == "To Do")'`
- 作業を開始する際は、ステータスを「🏗 In Progress」に変更する
- 完了後は「✅ Done」に変更する

### Issue管理のベストプラクティス

- 1つのissueは1つの問題または機能に集中させる
- ただし、複数の関連する問題が同じ原因の場合はまとめて記載可能
- 優先度や影響範囲を明確に記載する
- 実装方針や修正方針を具体的に記述する

### GitHub Projects フィールド管理

#### ステータスフィールドの更新時の注意

**重要な制約:**

- `ProjectV2SingleSelectField`の`options`配列を更新すると、**すべてのオプションIDが再生成される**
- 既存のIssueが参照している古いオプションIDとの紐付けが切れる
- 結果として、すべてのIssueのステータスが「No Status」になる可能性がある

**対策:**

1. **新しいステータスオプションを追加する前にバックアップを取る**

   ```bash
   gh project item-list 1 --owner @me --format json --limit 200 > backup-$(date +%Y%m%d).json
   ```

2. **ステータス追加後は必ず既存Issueのステータスを確認**

   ```bash
   gh project item-list 1 --owner @me --format json | jq '.items[] | select(.status == null)'
   ```

3. **Issue TimelineからステータスHistoryを復元**
   - `ProjectV2ItemStatusChangedEvent`を利用して履歴を取得
   - 各Issueの最終ステータスを特定
   - 新しいステータスIDにマッピングして復元
   - 参考スクリプト: `scripts/github/restore-all-statuses-pagination.sh`

**復元手順:**

```bash
# 1. Issue Timelineからステータス履歴を取得
gh api graphql -f query='
query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 23) {
      timelineItems(last: 100) {
        nodes {
          __typename
          ... on ProjectV2ItemStatusChangedEvent {
            status
            createdAt
          }
        }
      }
    }
  }
}'

# 2. 最終ステータスを抽出
last_status=$(jq -r '[.data.repository.issue.timelineItems.nodes[] | select(.__typename == "ProjectV2ItemStatusChangedEvent")] | .[-1].status')

# 3. 新しいステータスIDにマッピング
case "$last_status" in
  "🎯 Epic") status_id="9aa232cf" ;;
  "📋 Backlog") status_id="f908f688" ;;
  "📝 To Do") status_id="f36fcf60" ;;
  "🚧 In Progress") status_id="16defd77" ;;
  "👀 Review") status_id="0f0f2f26" ;;
  "✅ Done") status_id="2f722d70" ;;
esac

# 4. ステータスを更新
gh api graphql -f query="mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: \"$PROJECT_ID\"
    itemId: \"$PROJECT_ITEM_ID\"
    fieldId: \"$STATUS_FIELD_ID\"
    value: { singleSelectOptionId: \"$status_id\" }
  }) {
    projectV2Item { id }
  }
}"
```

**参考ドキュメント:**

- `docs/project-status-restoration-report.md`: ステータス復元作業の詳細記録
- `docs/api-epic-investigation.md`: GitHub GraphQL API調査結果
- `docs/sub-issue-investigation-result.md`: Sub-issue設定の調査結果
