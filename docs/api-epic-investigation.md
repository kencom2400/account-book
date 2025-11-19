# GitHub API での Epic-Subissue 関係設定の調査結果

## 📋 調査サマリー

**調査日**: 2025-11-19  
**対象機能**: GitHub Issues の「Tracked by」/ Sub-issues 機能  
**最終更新**: 2025-11-19  
**結論**: ✅ **GraphQL APIの`addSubIssue` mutationで設定可能**

---

## 🎉 最終結論（更新）

### GraphQL APIでの設定が可能

GitHub GraphQL APIには以下のmutationが存在し、プログラムによるsub-issue設定が可能です：

```graphql
mutation {
  addSubIssue(
    input: { issueId: "親IssueのNode ID", subIssueId: "子IssueのNode ID", replaceParent: false }
  ) {
    issue {
      subIssuesSummary {
        total
        completed
      }
    }
  }
}
```

### 実装済みスクリプト

`scripts/github/setup-all-epic-subissues.sh` で全16個のEpicに対して142個のsub-issueを自動設定済みです。

---

## 🔍 調査結果（詳細）

### 1. GraphQL API の確認

✅ **読み取りは可能**:

- `Issue.trackedIssues` フィールドで子Issueの取得が可能
- `Issue.trackedBy` フィールドで親Issueの取得が可能

```graphql
query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 182) {
      trackedIssues(first: 10) {
        totalCount
        nodes {
          number
          title
        }
      }
    }
  }
}
```

✅ **書き込みも可能**:

- **`addSubIssue` mutation**を使用してsub-issue関係を設定可能
- **`removeSubIssue` mutation**でsub-issue関係を削除可能
- **`reprioritizeSubIssue` mutation**でsub-issueの順序を変更可能

**利用可能なフィールド**:

- `Issue.subIssues`: 子Issueの一覧を取得
- `Issue.parent`: 親Issueを取得
- `Issue.subIssuesSummary`: 進捗サマリー（total, completed, percentCompleted）

### 2. REST API の確認

❌ **サポートなし**:

- Sub-issues / Tracked issues 機能のREST APIエンドポイントは提供されていない

### 3. Tasklist との関係

⚠️ **部分的に可能**:
GitHubは、Issue本文内のtasklist（`- [ ] #123`形式）を自動的にsub-issueに変換する機能を持っています。

**理論**:

1. Epic Issueの本文にtasklist形式で子Issueを記載
2. GitHubが自動的に `trackedIssues` として認識
3. UIで階層表示される

**実際の動作**:

- Issueの**本文（description）** にtasklistを記載した場合のみ有効
- コメントに記載しても無効
- 自動変換されるまでに時間がかかる場合がある
- すべてのリポジトリで有効とは限らない（ベータ機能）

---

## 💡 実現可能なアプローチ

### アプローチ1: GraphQL API（推奨）⭐⭐⭐⭐⭐

#### 手順:

1. 各IssueのNode IDを取得
2. `addSubIssue` mutationを実行

```bash
gh api graphql -f query='
mutation {
  addSubIssue(input: {
    issueId: "I_kwDOQWG80s7YVsye"
    subIssueId: "I_kwDOQWG80s7YVq2N"
    replaceParent: false
  }) {
    issue {
      subIssuesSummary {
        total
        completed
      }
    }
  }
}
'
```

#### メリット:

- ✅ 100%確実に動作
- ✅ 即座に反映
- ✅ 完全に自動化可能
- ✅ 公式サポート機能

#### 実装状況:

✅ **完了** - `scripts/github/setup-all-epic-subissues.sh` で全Epic-Subissue関係を設定済み

---

### アプローチ2: Tasklist方式（非推奨）

#### 手順:

1. Epic Issueの**Description**にtasklist形式で子Issueを追加

   ```markdown
   ## 関連Issue

   - [ ] #47
   - [ ] #48
   - [ ] #49
   ```

2. GitHub APIで本文を更新

   ```bash
   gh issue edit 182 --body "$(cat epic-body.md)"
   ```

3. GitHubが自動的に`trackedIssues`として認識（数分〜数時間）

#### メリット:

- ✅ API経由で実装可能
- ✅ 既存のEpic Issueを更新するだけ

#### デメリット:

- ⚠️ 自動変換されない可能性がある
- ⚠️ タイミングが不確定
- ⚠️ ベータ機能のため、動作保証なし
- ❌ **GraphQL APIの方が確実なため、このアプローチは非推奨**

---

### アプローチ3: 手動UI設定（GraphQL APIが使えない場合）

#### 手順:

1. GitHub Project を開く
2. 各Issueで「Tracked by」を手動設定
3. または Epic側から「Tracks」に子Issueを追加

#### メリット:

- ✅ 100%確実に動作
- ✅ 即座に反映
- ✅ 公式サポート機能

#### デメリット:

- ❌ 手動作業が必要（30-45分）
- ❌ 自動化不可

---

### アプローチ4: GitHub Actions + Workflow（将来的な自動化）

GitHub GraphQL APIで実装可能になったため、以下のような自動化も実現可能です：

```yaml
name: Auto-link Epic
on:
  issues:
    types: [opened, labeled]
jobs:
  link:
    runs-on: ubuntu-latest
    steps:
      - name: Extract Epic from description
      - name: Call addSubIssue mutation
        run: |
          gh api graphql -f query='
            mutation {
              addSubIssue(input: {
                issueId: "${{ steps.extract.outputs.epic_id }}"
                subIssueId: "${{ github.event.issue.node_id }}"
                replaceParent: false
              }) {
                issue { id }
              }
            }
          '
```

#### 現状:

✅ **API実装済み** - 手動実行スクリプトが利用可能

---

## 🎯 推奨アクション（更新）

### ✅ 完了済み

すべてのEpic-Subissue関係は`scripts/github/setup-all-epic-subissues.sh`により設定完了しています。

### 今後の追加Issue対応

新しいIssueを追加する場合：

```bash
# Issue Node IDを取得
ISSUE_ID=$(gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: 新Issue番号) { id } } }' | jq -r '.data.repository.issue.id')

# Epic Node IDを取得
EPIC_ID=$(gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: Epic番号) { id } } }' | jq -r '.data.repository.issue.id')

# Sub-issue関係を設定
gh api graphql -f query="mutation { addSubIssue(input: { issueId: \"$EPIC_ID\" subIssueId: \"$ISSUE_ID\" replaceParent: false }) { issue { id } } }"
```

---

## 📊 結論（更新）

| 方法             | API可能 | 確実性    | 所要時間    | 推奨度     |
| ---------------- | ------- | --------- | ----------- | ---------- |
| **GraphQL API**  | ✅ Yes  | ✅ 100%   | 5分         | ⭐⭐⭐⭐⭐ |
| **手動UI設定**   | ❌ No   | ✅ 100%   | 30-45分     | ⭐⭐⭐     |
| **Tasklist方式** | ✅ Yes  | ⚠️ 不確定 | 5分〜24時間 | ⭐         |

### 最終推奨

1. **GraphQL APIの`addSubIssue` mutationを使用**（最も推奨）
2. APIが使えない環境の場合は手動UI設定
3. Tasklist方式は非推奨（動作が不確定）

---

## ✅ 設定完了状況

- **全16個のEpic** (#181-196) に対して設定完了
- **142個のsub-issue** を自動設定
- 使用スクリプト: `scripts/github/setup-all-epic-subissues.sh`

---

## 📚 参考資料

- [GitHub Docs: About task lists](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-task-lists)
- [GitHub Docs: About tracked issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-tracked-by-and-tracks-in-issues)
- [GitHub GraphQL API: Issue](https://docs.github.com/en/graphql/reference/objects#issue)

---

## ⚠️ 重要な注意

GitHub の「Sub-issues」/ 「Tracked by」機能は、2024-2025年に導入された**比較的新しい機能**です。
API サポートが完全でない可能性があり、今後のアップデートで改善される可能性があります。

定期的にGitHub Changelogを確認することを推奨します：
https://github.blog/changelog/

---

**作成日**: 2025-11-19  
**最終更新**: 2025-11-19
