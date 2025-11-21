# Issue/PRステータス管理ルール

このルールは、AIアシスタント（Cursor）がユーザーとの対話の中で、適切なタイミングでGitHub IssueとPRのステータスを管理するためのガイドラインです。

## 🎯 基本方針

**AIアシスタントは、ユーザーとの会話の文脈を理解し、適切なタイミングでIssue/PRのステータスを更新します。**

- ✅ 自然な対話フローの中で状態を確認
- ✅ 文脈に応じた適切な判断
- ✅ ユーザーの意図を尊重
- ❌ 機械的・自動的な更新は行わない

## 📋 トリガー条件

以下の場合にIssue/PRステータスの更新を検討してください：

### 1. PR関連の会話

#### マージ完了時

```
ユーザー: "PRをマージしました"
ユーザー: "マージ完了"
ユーザー: "#217をマージした"
```

**アクション**:

1. PRの状態を確認
2. マージされている場合、関連Issueを特定
3. Issueステータスを「✅ Done」に更新

#### PRクローズ時（マージなし）

```
ユーザー: "PRをクローズしました"
ユーザー: "この実装は中止します"
```

**アクション**:

1. 理由を確認（必要に応じて質問）
2. 適切な場合のみIssueステータスを更新

### 2. 作業完了の報告

```
ユーザー: "実装完了"
ユーザー: "タスク完了"
ユーザー: "#219の作業が終わりました"
```

**アクション**:

1. 作業内容を確認
2. PRが作成されているか確認
3. PRの状態に応じてIssueステータスを更新

### 3. 明示的な指示

```
ユーザー: "Issueステータスを更新して"
ユーザー: "#219をDoneにして"
ユーザー: "プロジェクトステータスを変更してください"
```

**アクション**:

1. 指示に従ってステータスを更新
2. 更新結果を報告

## 🔄 実行フロー

### ステップ1: PR状態の確認

```bash
# PRの詳細を取得
gh pr view <PR番号> --json number,title,state,mergedAt,closedAt,body

# 例
gh pr view 217 --json number,title,state,mergedAt,closedAt
```

**判定条件**:

- `state: "MERGED"` かつ `mergedAt` が存在 → マージ済み
- `state: "CLOSED"` かつ `mergedAt` が null → クローズのみ
- `state: "OPEN"` → まだオープン

### ステップ2: 関連Issueの特定

PRの本文から関連Issueを抽出：

```
"Closes #209"
"Fixes #219"
"Resolves #123"
```

または、会話の文脈から特定。

### ステップ3: Issueステータスの更新

```bash
# In Progressに変更
./scripts/github/projects/set-issue-in-progress.sh <issue番号>

# Doneに変更
./scripts/github/projects/set-issue-done.sh <issue番号>
```

### ステップ4: 確認メッセージ

更新結果をユーザーに報告：

```
✅ Issue #209のステータスを「✅ Done」に更新しました
✅ プロジェクト: Account Book Development
```

## 📝 実装例

### 例1: PRマージ後の自動更新

```typescript
// ユーザー: "PR #217をマージしました"

// 1. PRの状態確認
const prStatus = await execCommand('gh pr view 217 --json state,mergedAt,body');

// 2. マージ確認
if (prStatus.state === 'MERGED') {
  // 3. 関連Issue抽出
  const issueMatch = prStatus.body.match(/Closes #(\d+)/);
  if (issueMatch) {
    const issueNumber = issueMatch[1];

    // 4. ステータス更新
    await execCommand(`./scripts/github/projects/set-issue-done.sh ${issueNumber}`);

    // 5. 報告
    console.log(`✅ Issue #${issueNumber}のステータスを「✅ Done」に更新しました`);
  }
}
```

### 例2: 作業開始時の更新

```typescript
// ユーザー: "@start-task" コマンド実行後

// 1. Issueを選択したら
const selectedIssue = 209;

// 2. ステータスを In Progress に更新
await execCommand(`./scripts/github/projects/set-issue-in-progress.sh ${selectedIssue}`);

// 3. 報告
console.log(`✅ Issue #${selectedIssue}のステータスを「🚧 In Progress」に更新しました`);
```

## ⚠️ 注意事項

### 1. 確認してから更新

**常にPRの状態を確認してから更新する**:

```bash
# 悪い例: 確認せずに更新
./scripts/github/projects/set-issue-done.sh 209

# 良い例: 状態確認後に更新
gh pr view 217 --json state
# state が MERGED であることを確認してから
./scripts/github/projects/set-issue-done.sh 209
```

### 2. ユーザーの意図を尊重

機械的に更新せず、必要に応じて確認：

```
AIアシスタント: "PR #217がマージされました。関連するIssue #209を「Done」に更新しますか？"
```

### 3. エラーハンドリング

スクリプト実行時のエラーを適切に処理：

```bash
# 実行結果を確認
if ! ./scripts/github/projects/set-issue-done.sh 209; then
  echo "⚠️ ステータスの更新に失敗しました"
fi
```

### 4. 複数Issue対応

1つのPRが複数のIssueに関連する場合：

```
PR本文: "Closes #209, Closes #210"
```

全ての関連Issueのステータスを更新する。

## 🔗 関連スクリプト

### ステータス更新スクリプト

```bash
# In Progress に変更
./scripts/github/projects/set-issue-in-progress.sh <issue番号>

# Done に変更
./scripts/github/projects/set-issue-done.sh <issue番号>

# To Do に変更（将来実装予定）
./scripts/github/projects/set-issue-todo.sh <issue番号>
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

### Issue情報取得

```bash
# Issue詳細取得
gh issue view <issue番号> --json number,title,state,labels

# プロジェクトステータス確認
gh project item-list 1 --owner kencom2400 --format json | jq '.items[] | select(.content.number == 209)'
```

## 📊 ステータス遷移

```
📋 Backlog
    ↓
📝 To Do  ← set-issue-todo.sh（将来実装）
    ↓
🚧 In Progress  ← set-issue-in-progress.sh
    ↓
👀 Review  ← （手動またはPR作成時）
    ↓
✅ Done  ← set-issue-done.sh（PRマージ時）
```

## 🎯 ベストプラクティス

### 1. タイミングを見極める

```
✅ 良いタイミング:
- PRがマージされた直後
- 作業完了が明確に報告された時
- ユーザーが明示的に指示した時

❌ 悪いタイミング:
- PRがまだオープンの時
- 作業中の時
- ユーザーの意図が不明確な時
```

### 2. 確認メッセージを出す

```
✅ 良い例:
"PR #217がマージされました。Issue #209を「Done」に更新しました。"

❌ 悪い例:
黙ってステータスを更新（ユーザーが気づかない）
```

### 3. エラー時の対応

```
✅ 良い例:
"⚠️ Issue #209のステータス更新に失敗しました。プロジェクトに追加されていない可能性があります。"

❌ 悪い例:
エラーを無視してそのまま進む
```

## 🔄 他のルールとの連携

### @start-task コマンドとの連携

`.cursor/rules/task-trigger.md` で定義されている `@start-task` コマンド実行時：

1. 最優先Issueを選択
2. ブランチ作成
3. **ステータスを「🚧 In Progress」に変更** ← このルールを適用
4. 作業開始

### commit.md コマンドとの連携

作業完了時：

1. コミット作成
2. PRプッシュ
3. **PRマージ後、Issueを「✅ Done」に更新** ← このルールを適用

## 📚 参考資料

- `.cursor/rules/task-trigger.md` - @start-task コマンドの詳細
- `.cursor/rules/commit.md` - コミットルール
- `.github/ISSUE_MANAGEMENT.md` - Issue管理ガイド
- `scripts/github/projects/` - ステータス更新スクリプト

---

**最終更新**: 2025-11-21
**関連Issue**: #219
