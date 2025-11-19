# Sub-issue設定の調査結果

## 📊 調査日時

2025-11-19

## 🎉 最終結論（更新）

**✅ GitHub GraphQL APIの`addSubIssue` mutationによるsub-issue設定が可能であることが判明しました。**

全16個のEpicに対して142個のsub-issueを自動設定完了しました。

---

## 🔍 調査内容

ユーザーが手動で#182に#23をsub-issue化したとのことで、その設定がどのように管理されているかを調査しました。

この調査により、以下のことが判明しました：

1. GitHub Issues には `Issue.subIssues` と `Issue.parent` フィールドが存在
2. GraphQL APIの `addSubIssue` mutation でプログラム的に設定可能
3. 旧来の `trackedIssues` / `trackedInIssues` フィールドは非推奨

---

## ✅ 発見事項（更新）

### 1. GitHub Projects に親子関係フィールドが存在

Project #1 ("Account Book Development") には以下のフィールドが確認できました：

```json
{
  "id": "PVTF_lAHOANWYrs4BIOm-zg4wCEA",
  "name": "Parent issue",
  "type": "ProjectV2Field"
},
{
  "id": "PVTF_lAHOANWYrs4BIOm-zg4wCEE",
  "name": "Sub-issues progress",
  "type": "ProjectV2Field"
}
```

### 2. GitHub Issues API に専用フィールドが存在

調査の結果、以下のフィールドとmutationが利用可能であることが判明：

**読み取り用フィールド**:

- `Issue.subIssues`: 子Issueの一覧
- `Issue.parent`: 親Issue
- `Issue.subIssuesSummary`: 進捗サマリー（total, completed, percentCompleted）

**書き込み用mutation**:

- `addSubIssue`: Sub-issue関係を設定
- `removeSubIssue`: Sub-issue関係を削除
- `reprioritizeSubIssue`: Sub-issueの順序を変更

### 3. 実装完了

`scripts/github/setup-all-epic-subissues.sh` を使用して、全16個のEpicに対して142個のsub-issueを自動設定完了しました。

---

## 💡 正しい設定方法（更新）

### 方法1: GraphQL API（推奨）⭐⭐⭐⭐⭐

```bash
# Issue Node IDを取得
EPIC_ID=$(gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: 182) { id } } }' | jq -r '.data.repository.issue.id')
SUB_ISSUE_ID=$(gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: 23) { id } } }' | jq -r '.data.repository.issue.id')

# Sub-issue関係を設定
gh api graphql -f query="mutation { addSubIssue(input: { issueId: \"$EPIC_ID\" subIssueId: \"$SUB_ISSUE_ID\" replaceParent: false }) { issue { subIssuesSummary { total completed } } } }"
```

**結果確認**:

```bash
gh api graphql -f query='query { repository(owner: "kencom2400", name: "account-book") { issue(number: 182) { subIssuesSummary { total completed percentCompleted } } } }'
```

### 方法2: Issue UIから（手動）

1. Issue #182 を開く
2. 右側のサイドバーで **「Development」** セクションを探す
3. 「**Convert to issue**」または「**Add sub-issue**」ボタンをクリック
4. #23を検索して追加

### 方法3: Project UIから（手動）

1. Project #1 を開く
2. #23をクリック
3. 右側パネルで **「Parent issue」** フィールドを探す
4. #182を選択

### 方法4: Issue本文のTasklist（非推奨）

Issue #182の本文に以下を追加：

```markdown
## Sub-issues

- [ ] #23
```

**注意**: この方法は動作が不確定なため、GraphQL APIの使用を推奨します。

---

## 🔧 実装済みスクリプト

全Epic-Subissue関係の設定は `scripts/github/setup-all-epic-subissues.sh` で自動化済みです。

**実行例**:

```bash
chmod +x scripts/github/setup-all-epic-subissues.sh
./scripts/github/setup-all-epic-subissues.sh
```

**実行結果**:

- 全16個のEpicに対して142個のsub-issueを設定
- 各Epicの進捗が自動的に計算される
- Project UIで階層表示が確認可能

---

## 🎯 完了状況

✅ **全て完了しました！**

1. ✅ GraphQL APIの`addSubIssue` mutationを特定
2. ✅ 自動設定スクリプトを作成・実行
3. ✅ 全16個のEpicに対して142個のsub-issueを設定
4. ✅ Project UIで階層表示を確認

---

**作成日**: 2025-11-19  
**最終更新**: 2025-11-19  
**ステータス**: ✅ 完了
