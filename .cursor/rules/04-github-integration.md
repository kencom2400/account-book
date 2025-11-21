# GitHub統合 - Issue管理・ステータス・報告

このファイルは、GitHub Projects管理、Issueステータス管理、Issue完了報告の運用ルールを統合したものです。

---

## 📋 目次

1. [GitHub Projects設定](#1-github-projects設定)
2. [Issueステータス管理](#2-issueステータス管理)
3. [Issue完了報告](#3-issue完了報告)
4. [@start-task統合](#4-start-task統合)

---

## 1. GitHub Projects設定

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

### Issueワークフロー

```
📋 Backlog → 📝 To Do → 🚧 In Progress → 👀 Review → ✅ Done
```

**ステータス遷移のタイミング:**

- **To Do**: 次に取り組むIssueとして選択した時
- **In Progress**: 実際の作業を開始した時
- **Review**: PRを作成し、レビューを依頼した時
- **Done**: PRがマージされ、Issueをクローズした時

---

## 2. Issueステータス管理

### 基本方針

**AIアシスタントは、ユーザーとの会話の文脈を理解し、適切なタイミングでIssue/PRのステータスを更新します。**

- ✅ 自然な対話フローの中で状態を確認
- ✅ 文脈に応じた適切な判断
- ✅ ユーザーの意図を尊重
- ❌ 機械的・自動的な更新は行わない

### トリガー条件

#### 1. PR関連の会話

**マージ完了時:**

```
ユーザー: "PRをマージしました"
ユーザー: "マージ完了"
ユーザー: "#217をマージした"
```

**アクション:**

1. PRの状態を確認（`gh pr view <PR番号> --json state,mergedAt`）
2. マージされている場合（`state: "MERGED"`）、関連Issueを特定
   - PR本文から「Closes #XXX」「Fixes #XXX」「Resolves #XXX」を抽出
   - 会話の文脈から関連Issueを特定
3. **プロジェクトステータスを「✅ Done」に更新**（`./scripts/github/projects/set-issue-done.sh <issue番号>`）
4. Issueをクローズ（必要に応じて）

**重要**: ユーザーが「マージします」と言った場合、マージ実行後に自動的にステータスを更新する

#### 2. 作業完了の報告

```
ユーザー: "実装完了"
ユーザー: "タスク完了"
ユーザー: "#219の作業が終わりました"
```

**アクション:**

1. 作業内容を確認
2. PRが作成されているか確認
3. PRの状態に応じてIssueステータスを更新

#### 3. 明示的な指示

```
ユーザー: "Issueステータスを更新して"
ユーザー: "#219をDoneにして"
```

**アクション:**

1. 指示に従ってステータスを更新
2. 更新結果を報告

### 実行フロー

#### ステップ1: PR状態の確認

```bash
# PRの詳細を取得
gh pr view <PR番号> --json number,title,state,mergedAt,closedAt,body
```

**判定条件:**

- `state: "MERGED"` かつ `mergedAt` が存在 → マージ済み
- `state: "CLOSED"` かつ `mergedAt` が null → クローズのみ
- `state: "OPEN"` → まだオープン

#### ステップ2: 関連Issueの特定

PRの本文から関連Issueを抽出：

```typescript
// 複数のIssueキーワードに対応
const issueKeywords = ['Closes', 'Fixes', 'Resolves', 'closes', 'fixes', 'resolves'];
const issueNumbers: number[] = [];

for (const keyword of issueKeywords) {
  const regex = new RegExp(`${keyword}\\s+#(\\d+)`, 'g');
  let match;
  while ((match = regex.exec(prBody)) !== null) {
    const issueNumber = parseInt(match[1], 10);
    if (!issueNumbers.includes(issueNumber)) {
      issueNumbers.push(issueNumber);
    }
  }
}
```

#### ステップ3: Issueステータスの更新

```bash
# In Progressに変更
./scripts/github/projects/set-issue-in-progress.sh <issue番号>

# Doneに変更
./scripts/github/projects/set-issue-done.sh <issue番号>
```

#### ステップ4: 確認メッセージ

更新結果をユーザーに報告：

```
✅ Issue #209のステータスを「✅ Done」に更新しました
✅ プロジェクト: Account Book Development
```

### 注意事項

#### 1. 確認してから更新

**常にPRの状態を確認してから更新する**:

```bash
# 良い例: 状態確認後に更新
gh pr view 217 --json state
# state が MERGED であることを確認してから
./scripts/github/projects/set-issue-done.sh 209
```

#### 2. ユーザーの意図を尊重

機械的に更新せず、必要に応じて確認

#### 3. エラーハンドリング

スクリプト実行時のエラーを適切に処理

#### 4. 複数Issue対応

1つのPRが複数のIssueに関連する場合：

```
PR本文: "Closes #209, Closes #210"
```

全ての関連Issueのステータスを更新する。

---

## 3. Issue完了報告

```
╔══════════════════════════════════════════════════════════════╗
║  🚨 Issue作業完了時は必ずGitHub Issueに報告コメント 🚨      ║
║                                                              ║
║  タイミング:                                                 ║
║  1. commit完了後（push前でも可）                             ║
║  2. 長時間作業（4時間超）の場合は途中報告                    ║
║                                                              ║
║  方法: gh issue comment コマンドで自動投稿                   ║
╚══════════════════════════════════════════════════════════════╝
```

### トリガー条件

以下のいずれかが満たされた時、自動的に報告コメントを作成：

1. **commit完了時**: 最終コミット完了後（push前でも可）
2. **作業完了を明示的に宣言した時**: 「作業完了」「完了しました」等のキーワード
3. **長時間作業の途中**: 4時間経過時

**推奨フロー**:

```
1. 作業完了
   ↓
2. git commit（すべての変更をコミット）
   ↓
3. Issue報告コメント投稿 ⭐ ここで報告
   ↓
4. git push
   ↓
5. PR作成
```

### 報告対象のIssueタイプ

すべてのIssueタイプで報告を行う：

- `feature`, `task`, `bug`, `enhancement`, `process`, `documentation`

### 除外対象

**Issueが存在しない場合のみ除外**

### 報告コマンドの実行

#### 基本フォーマット

```bash
# コメント本文をヒアドキュメントで変数に格納
BODY=$(cat <<'EOF'
## 🎉 作業完了報告

Issue #<ISSUE_NUMBER>「<Issueタイトル>」の作業が完了しました。

---

## 📊 実施した作業

### <作業項目1>

**内容**:
- <詳細内容>

**成果物**:
- <ファイル1>
- <ファイル2>

**コミット**: `<コミットメッセージ>`

---

## 📂 成果物

### 新規作成ファイル（合計Xファイル）

1. **<カテゴリ1>** (Xファイル)
   - `path/to/file1`
   - `path/to/file2`

### 更新ファイル（合計Xファイル）

1. **<ファイル名>**
   - `path/to/file`
   - <変更内容の概要>

---

## ✅ 達成した目標

### Issueの受入基準

- [x] <受入基準1>
- [x] <受入基準2>

### 期待される効果

✅ **<効果1>**
- <詳細>

---

## 🚀 次のステップ

### 1. レビュー依頼
- [ ] <レビュー項目1>

### 2. マージ後
- [ ] <実施事項1>

---

## 📊 作業時間

- <作業項目1>: 約X時間
- **合計**: 約X時間

---

## 🔗 関連リンク

- **PR**: <PR URL または「作成予定」>
- **ブランチ**: `feature/issue-XXX-description`
- **コミット数**: X

---

以上で、Issue #<ISSUE_NUMBER>の作業が完了しました。

**次のアクション**:
- [ ] git push
- [ ] PR作成
- [ ] レビュー依頼
EOF
)

# GitHub CLIでコメント投稿
gh issue comment <ISSUE_NUMBER> --body "$BODY"
```

### 必須項目

1. **実施した作業**: 作業項目ごとに内容・成果物・コミットを記載
2. **成果物サマリ**: 新規作成ファイルと更新ファイルをカテゴリ別に整理
3. **達成した目標**: 受入基準チェックと期待される効果
4. **次のステップ**: レビュー依頼とマージ後のタスク
5. **メタ情報**: 作業時間と関連リンク

### チェックリスト

報告前に以下を確認：

- [ ] Issue番号が正しい
- [ ] 実施した作業が具体的に記載されている
- [ ] 成果物（ファイル）が列挙されている
- [ ] 受入基準の達成状況が明記されている
- [ ] 次のステップ（レビュー依頼等）が明記されている
- [ ] PRへのリンクが含まれている
- [ ] コミット情報が含まれている

---

## 4. @start-task統合

### 🚨 トリガー: `@start-task` コマンド

**実行内容:**

1. **Issue取得**
   - GitHub Projectsから「📝 To Do」ステータスのIssueを取得
   - 各IssueのAssignee情報を確認
   - 自分にアサインされているOPENなIssueをフィルタリング

2. **優先順位判定とソート**
   - `priority: critical` → レベル4
   - `priority: high` → レベル3
   - `priority: medium` → レベル2
   - `priority: low` → レベル1
   - ラベルなし → レベル0
   - 同じ優先度の場合、Issue番号が小さい方を優先

3. **最優先Issueの選択と開始**
   - ソート後の最初のIssueを選択
   - Issueの詳細を表示
   - mainブランチを最新化してからブランチを作成
   - **GitHub ProjectsのステータスをIn Progressに変更**
   - Issueの内容に従って作業を即座に開始

### Issue取得コマンド

```bash
# ステップ1: GitHub Projectsから "📝 To Do" ステータスのIssue番号を取得
PROJECT_NUMBER=1
OWNER="kencom2400"

TODO_ISSUES=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 9999 | \
  jq -r '.items[] | select(.status == "📝 To Do") | .content.number')

# ステップ2: 各IssueのAssignee情報とState（OPEN/CLOSED）を確認
ASSIGNED_ISSUES=()
for issue_num in $TODO_ISSUES; do
  assignee=$(gh issue view "$issue_num" --json assignees --jq '.assignees[].login' 2>/dev/null)
  issue_state=$(gh issue view "$issue_num" --json state --jq '.state' 2>/dev/null)
  current_user=$(gh api user --jq '.login')

  # OPENなIssueかつ自分にアサインされているもののみを対象
  if [ "$issue_state" = "OPEN" ] && echo "$assignee" | grep -q "$current_user"; then
    ASSIGNED_ISSUES+=("$issue_num")
  fi
done

# ステップ3: アサインされているIssueの詳細を取得
if [ ${#ASSIGNED_ISSUES[@]} -eq 0 ]; then
  echo "[]"
else
  for issue_num in "${ASSIGNED_ISSUES[@]}"; do
    gh issue view "$issue_num" --json number,title,labels,url
  done | jq -s '.'
fi
```

### ブランチ作成とステータス更新

```bash
# mainブランチを最新化
git checkout main
git pull origin main

# 新しいブランチを作成
git checkout -b feature/issue-<番号>-<説明>

# GitHub ProjectsのステータスをIn Progressに変更
./scripts/github/projects/set-issue-in-progress.sh <issue番号>
```

**重要事項:**

- ✅ 質問・確認なしで即座に実行
- ✅ GitHub ProjectsのステータスをIn Progressに変更
- ✅ 各IssueのAssignee情報を確認し、自分にアサインされているものをフィルタリング
- ✅ CLOSEDなIssueは除外（OPENなもののみ対象）

### 自動実行の対象外

以下のIssueは自動的に除外される：

- ✅ クローズ済みのIssue（`--state open` で除外）
- 👤 他のユーザーにアサインされているIssue（Assignee情報で除外）
- 📝 「📝 To Do」ステータス以外のIssue
- 📋 「📋 Backlog」ステータスのIssue

---

## 📚 よく使うコマンド集

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

### Project操作

```bash
# Project全体の状態確認
gh project view 1 --owner @me

# Project Item一覧（JSON）
gh project item-list 1 --owner @me --format json --limit 200

# ステータス別集計
gh project item-list 1 --owner @me --format json | jq '[.items[] | {number: .content.number, status: .status}] | group_by(.status) | map({status: .[0].status, count: length})'
```

### PR状態確認

```bash
# PR詳細取得
gh pr view <PR番号> --json number,title,state,mergedAt,closedAt,body

# PRリスト取得
gh pr list --state all --limit 10

# 特定IssueのPR検索
gh pr list --search "Closes #209"
```

---

## 🔄 他のルールとの連携

### commit.md との連携

作業完了時：

1. コミット作成
2. PRプッシュ
3. **PRマージ後、プロジェクトステータスを「✅ Done」に更新**
   - `./scripts/github/projects/set-issue-done.sh <issue番号>`を実行
   - 関連するすべてのIssueのステータスを更新

---

## 📚 参考資料

- `.cursor/rules/00-WORKFLOW-CHECKLIST.md` - ワークフロー全体
- `.cursor/rules/03-git-workflow.md` - Git ワークフロー
- `templates/issue-report.md` - Issue報告テンプレート
