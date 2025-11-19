# GitHub Project ステータス復元作業記録

## 📋 作業サマリー

**作業日**: 2025-11-19  
**対象**: GitHub Project "Account Book Development" (Project #1)  
**問題**: 「Epic」ステータス追加時に、他のIssueのステータスが失われた  
**結果**: ✅ 全Issue（142件）のステータスを履歴から復元完了

---

## 🔍 発生した問題

### 問題の経緯

1. **Epic専用ステータスの追加要望**
   - Backlogの前に「🎯 Epic」ステータスを追加

2. **ステータスフィールドの更新実施**
   - GraphQL APIで`ProjectV2SingleSelectField`を更新
   - 新しいステータスオプション「🎯 Epic」を追加

3. **副作用の発生**
   - 既存のステータスオプションのIDが再生成された
   - Epic以外の全Issueのステータスが「No Status」に変更された

### 原因分析

GitHub Projects V2 では、`ProjectV2SingleSelectField`の`options`配列を更新すると、**すべてのオプションIDが再生成**されます。

既存のIssueは古いオプションIDを参照していたため、新しいIDとの紐付けが切れてしまいました。

---

## 💡 解決方法

### アプローチ: Issue Timeline から履歴を復元

GitHub Issues の`ProjectV2ItemStatusChangedEvent`を利用して、各Issueの最終ステータスを取得し、復元しました。

### 実装

#### 1. Issue Timeline からステータス履歴を取得

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

#### 2. 最終ステータスを特定

```bash
last_status=$(echo "$response" | jq -r '[.data.repository.issue.timelineItems.nodes[] | select(.__typename == "ProjectV2ItemStatusChangedEvent")] | .[-1].status')
```

#### 3. 新しいステータスIDにマッピング

```bash
case "$last_status" in
  "🎯 Epic") status_id="9aa232cf" ;;
  "📋 Backlog") status_id="f908f688" ;;
  "📝 To Do") status_id="f36fcf60" ;;
  "🚧 In Progress") status_id="16defd77" ;;
  "👀 Review") status_id="0f0f2f26" ;;
  "✅ Done") status_id="2f722d70" ;;
esac
```

#### 4. ステータスを更新

```bash
gh api graphql -f query="mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: \"$PROJECT_ID\"
    itemId: \"$project_item_id\"
    fieldId: \"$STATUS_FIELD_ID\"
    value: { singleSelectOptionId: \"$status_id\" }
  }) {
    projectV2Item { id }
  }
}"
```

---

## 📊 復元結果

### 処理サマリー

- **合計処理**: 158件（Issue + Pull Request）
- **復元成功**: 142件
- **履歴なし**: 0件（すべてのIssueに履歴が存在）
- **Pull Request**: 6件（ステータスなし - 正常）
- **Epic**: 16件（「🎯 Epic」ステータスに既に設定済み）

### ステータス別内訳

| ステータス     | 件数    |
| -------------- | ------- |
| 🎯 Epic        | 16      |
| 📋 Backlog     | 111     |
| 📝 To Do       | 4       |
| 🚧 In Progress | 0       |
| 👀 Review      | 0       |
| ✅ Done        | 27      |
| **合計**       | **158** |

---

## 🛠️ 作成したスクリプト

### 1. テスト用スクリプト（削除済み）

- `scripts/github/test-restore-3-issues.sh`
- Issue #23, #24, #25 で動作確認

### 2. 本番スクリプト（保存済み）

#### `scripts/github/restore-all-statuses-fixed.sh`

- 最初の100件のIssueを復元

#### `scripts/github/restore-all-statuses-pagination.sh` ⭐推奨

- ページネーション対応
- 全Issueを自動的に取得・復元
- 今後、同様の問題が発生した場合に再利用可能

---

## 🎓 教訓

### 1. GitHub Projects V2 の制約

**問題**: SingleSelectFieldのオプション更新時、既存のオプションIDが変更される

**対策**:

- 新しいオプションを追加する際は、既存のIssueへの影響を考慮
- 更新後は必ず既存Issueのステータスを確認
- 復元スクリプトを事前に準備しておく

### 2. Issue Timeline の活用

**発見**: `ProjectV2ItemStatusChangedEvent`により、過去のステータス変更履歴を取得可能

**メリット**:

- Issueごとのステータス履歴が完全に保存されている
- 復元が100%正確に実施可能
- 手動での再設定作業が不要

### 3. GraphQL API の強力さ

**活用したAPI**:

- `Issue.timelineItems`: イベント履歴の取得
- `updateProjectV2ItemFieldValue`: ステータスの更新
- ページネーション: 大量データの効率的な取得

---

## 📝 推奨事項

### 将来的な対策

1. **バックアップの実施**

   ```bash
   # Project状態のバックアップ
   gh project item-list 1 --owner @me --format json --limit 200 > backup-$(date +%Y%m%d).json
   ```

2. **変更前の確認**
   - SingleSelectFieldの更新前に、影響範囲を確認
   - テスト用Projectで事前検証

3. **復元スクリプトの維持**
   - `restore-all-statuses-pagination.sh` を定期的に更新
   - 新しいステータスが追加されたら、マッピングを更新

### 復元スクリプトの使い方

```bash
cd /Users/kencom/github/account-book
chmod +x scripts/github/restore-all-statuses-pagination.sh
./scripts/github/restore-all-statuses-pagination.sh
```

---

## ✅ 確認方法

### 1. Project UIで確認

https://github.com/users/kencom2400/projects/1

- 各Issueにステータスが設定されているか確認
- Epic Issueが「🎯 Epic」ステータスになっているか確認

### 2. API で確認

```bash
# ステータス別集計
gh project item-list 1 --owner @me --format json --limit 200 | \
  jq '[.items[] | {number: .content.number, status: .status}] |
      group_by(.status) |
      map({status: .[0].status, count: length}) |
      sort_by(.status)'
```

### 3. 個別Issue確認

```bash
# Issue #23 の現在のステータス
gh api graphql -f query='
query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 23) {
      projectItems(first: 1) {
        nodes {
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { name }
              }
            }
          }
        }
      }
    }
  }
}' | jq -r '.data.repository.issue.projectItems.nodes[0].fieldValues.nodes[] | select(.field.name == "Status") | .name'
```

---

## 🎉 結論

**✅ 全Issue（142件）のステータス復元に成功しました！**

- Timeline履歴から正確に復元
- 手動作業なし（完全自動化）
- 再現可能なスクリプトを作成
- 今後の同様問題に対応可能

---

**作成日**: 2025-11-19  
**最終更新**: 2025-11-19  
**ステータス**: ✅ 完了
