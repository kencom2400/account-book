# GitHub Actions - Projects API アクセス調査結果

## 🔍 問題の発見

Issue #209と#218がクローズされたにも関わらず、GitHub Projectsのステータスが「🚧 In Progress」のまま更新されない問題が発生。

## 📋 調査内容

### 1. ワークフロー実行状態の確認

```bash
gh run list --workflow=update-project-status.yml --limit 5
```

**結果**: ワークフローは正常に実行され、`success`ステータスで完了している

### 2. ワークフローログの確認

```bash
gh run view 19557997558 --log
```

**ログ内容**:

```
Processing issue/PR #209...
✅ Issue/PR is not in any project. Nothing to update.
```

**問題**: プロジェクトアイテムが取得できていない

### 3. GraphQLクエリの手動テスト

```bash
gh api graphql -f query='
query {
  repository(owner: "kencom2400", name: "account-book") {
    issue(number: 209) {
      projectItems(first: 10) {
        nodes {
          id
          project { title }
          fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue { name }
          }
        }
      }
    }
  }
}'
```

**結果**: 手動実行では正しくプロジェクトアイテムが取得できた

```json
{
  "id": "PVTI_lAHOANWYrs4BIOm-zghhs6k",
  "project": { "title": "Account Book Development" },
  "fieldValueByName": { "name": "🚧 In Progress" }
}
```

## 🎯 根本原因

**GITHUB_TOKENの権限不足**

GitHub Actionsのデフォルト`GITHUB_TOKEN`は、リポジトリレベルのProjectsにはアクセスできますが、**User-levelまたはOrganization-levelのProjectsにはアクセスできません**。

### 権限の違い

| トークン            | Repo Projects | User Projects | Org Projects |
| ------------------- | ------------- | ------------- | ------------ |
| GITHUB_TOKEN        | ✅            | ❌            | ❌           |
| PAT (project scope) | ✅            | ✅            | ✅           |

### プロジェクトレベルの確認

```bash
gh project view 1 --owner kencom2400 --format json | jq '.owner'
```

**結果**:

```json
{
  "login": "kencom2400",
  "type": "User"
}
```

このプロジェクトは**User-level**のため、`GITHUB_TOKEN`ではアクセスできない。

## ✅ 解決方法

### 1. Personal Access Token (PAT)の作成

1. [GitHub Settings > Tokens](https://github.com/settings/tokens) にアクセス
2. 「Generate new token (classic)」をクリック
3. 必要なスコープを選択:
   - `repo` - リポジトリへのフルアクセス
   - `project` - Projectsへの読み書きアクセス
4. トークンを生成してコピー

### 2. リポジトリシークレットへの追加

1. リポジトリの Settings > Secrets and variables > Actions
2. 「New repository secret」をクリック
3. Name: `PROJECT_PAT`
4. Secret: 作成したトークンを貼り付け
5. 「Add secret」をクリック

### 3. ワークフローの修正

```yaml
- name: Update Project Status to Done
  uses: actions/github-script@v7
  with:
    github-token: ${{ secrets.PROJECT_PAT || secrets.GITHUB_TOKEN }}
```

`secrets.PROJECT_PAT`が設定されていればそれを使用し、設定されていない場合は`GITHUB_TOKEN`にフォールバックする。

## 📊 影響範囲

### 動作するケース

- ✅ Repo-level Projects (GITHUB_TOKEN で動作)
- ✅ User/Org-level Projects (PROJECT_PAT が設定されている場合)

### 動作しないケース

- ❌ User/Org-level Projects (PROJECT_PAT が未設定の場合)

## 🔗 参考資料

- [GitHub Docs: Authenticating with GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [GitHub Docs: Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Projects V2 GraphQL API](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)

## 📝 今後の改善案

1. **エラーメッセージの改善**: プロジェクトアイテムが取得できない場合、権限不足の可能性を示唆するメッセージを追加
2. **ドキュメント強化**: README とISSUE_MANAGEMENT.md にPAT設定手順を明記（完了）
3. **代替手段の検討**: GitHub Appを使用した認証も検討可能

---

**調査日**: 2025-11-21  
**調査者**: AI Assistant (Cursor)  
**関連Issue**: #209, #218
