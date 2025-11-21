# Git ワークフロー遵守チェックリスト

このドキュメントは、Git ワークフローの遵守を徹底するためのチェックリストです。

---

## 🚨 絶対禁止事項（CRITICAL）

これらの行為は**絶対に禁止**です。違反すると重大な問題を引き起こします。

### ❌ mainブランチでの直接作業

**禁止事項:**

- mainブランチで直接コードを編集
- mainブランチに直接コミット
- mainブランチに直接push

**正しい手順:**

1. フィーチャーブランチを作成: `git checkout -b feat/XXX-description`
2. フィーチャーブランチで作業
3. フィーチャーブランチにコミット・push
4. PRを作成してレビュー
5. 承認後にmainにマージ

**確認方法:**

```bash
# 現在のブランチを確認
git branch

# mainブランチにいる場合は即座にフィーチャーブランチを作成
git checkout -b feat/XXX-description
```

---

### ❌ PRなしでのmainへのマージ

**禁止事項:**

- PRを作成せずにmainブランチにマージ
- `git merge`を使ってローカルでmainにマージ
- mainブランチに直接push

**正しい手順:**

1. フィーチャーブランチにpush
2. GitHub UIまたは`gh pr create`でPRを作成
3. レビュー・承認を待つ
4. GitHub UIで「Merge pull request」ボタンを押す
5. ローカルでmainブランチを更新: `git checkout main && git pull`

---

### ❌ PRマージ前にIssueをDoneに変更

**禁止事項:**

- PR作成時にIssueをDoneに変更
- PRレビュー中にIssueをDoneに変更
- PRマージ前にIssueをDoneに変更

**正しいタイミング:**

- ✅ **PRがmainにマージされた後のみ** IssueをDoneに変更

**実行コマンド:**

```bash
# PRマージ後のみ実行
./scripts/github/projects/set-issue-done.sh <ISSUE_NUMBER>
```

---

## ✅ 正しいワークフロー

### 1. タスク開始（@start-task）

```bash
# ステップ1: GitHub ProjectsからIssueを取得
# ステップ2: フィーチャーブランチを作成
git checkout -b feat/XXX-description  # または fix/XXX-description

# ステップ3: IssueをIn Progressに変更
./scripts/github/projects/set-issue-in-progress.sh <ISSUE_NUMBER>

# ステップ4: 現在のブランチを確認（mainでないことを確認）
git branch
# * feat/XXX-description ← これが表示されればOK
```

---

### 2. 実装・コミット

```bash
# 実装作業...

# ステップ1: 変更をステージング
git add -A

# ステップ2: コミット
git commit -m "feat: 機能の説明 (#ISSUE_NUMBER)"

# ステップ3: 現在のブランチを確認（mainでないことを再確認）
git branch
# * feat/XXX-description ← mainでないことを確認
```

---

### 3. push前チェック

```bash
# 必須チェック（約3-4分）
./scripts/test/lint.sh
./scripts/test/test.sh all
./scripts/test/test-e2e.sh frontend  # ドキュメントのみの変更時はスキップ可

# すべて成功したら push
git push origin feat/XXX-description  # mainではなくフィーチャーブランチ名を指定
```

---

### 4. PR作成

```bash
# GitHub CLIでPRを作成
gh pr create --title "feat: 機能の説明 (#ISSUE_NUMBER)" --body "..." --base main

# または、GitHub UIで作成
# https://github.com/<owner>/<repo>/pull/new/feat/XXX-description
```

**重要:** この時点ではIssueは**In Progressのまま**維持

---

### 5. PR承認・マージ

```bash
# PRがレビュー・承認された後、GitHub UIで「Merge pull request」ボタンを押す

# ローカルのmainブランチを更新
git checkout main
git pull origin main

# フィーチャーブランチを削除（オプション）
git branch -d feat/XXX-description
```

---

### 6. Issue完了（PRマージ後のみ）

```bash
# PRマージ確認後、IssueをDoneに変更
./scripts/github/projects/set-issue-done.sh <ISSUE_NUMBER>

# Issueに完了報告をコメント
gh issue comment <ISSUE_NUMBER> --body "✅ PRがマージされました。完了しました。"
```

---

## 🔍 トラブルシューティング

### 誤ってmainブランチで作業してしまった場合

```bash
# ステップ1: 現在の変更をstash
git stash

# ステップ2: フィーチャーブランチを作成
git checkout -b feat/XXX-description

# ステップ3: stashを適用
git stash pop

# ステップ4: コミット・push
git add -A
git commit -m "feat: ..."
git push origin feat/XXX-description
```

---

### 誤ってmainブランチにコミットしてしまった場合

```bash
# ステップ1: コミットを取り消す（まだpushしていない場合）
git reset --soft 'HEAD^'

# ステップ2: フィーチャーブランチを作成
git checkout -b feat/XXX-description

# ステップ3: 再度コミット
git commit -m "feat: ..."

# ステップ4: push
git push origin feat/XXX-description
```

---

### 誤ってmainブランチにpushしてしまった場合

```bash
# ⚠️ 警告: この操作は慎重に行ってください

# ステップ1: mainブランチのコミットを取り消す
git reset --hard 'HEAD^'

# ステップ2: force pushでリモートも巻き戻す
git push origin main --force

# ステップ3: フィーチャーブランチを作成して作業をやり直す
git checkout -b feat/XXX-description

# ステップ4: 変更を再度実装してPR作成
```

---

### 誤ってIssueをDoneに変更してしまった場合

```bash
# ステップ1: IssueをIn Progressに戻す
./scripts/github/projects/set-issue-in-progress.sh <ISSUE_NUMBER>

# ステップ2: PR作成・レビュー・マージを進める

# ステップ3: PRマージ後、改めてDoneに変更
./scripts/github/projects/set-issue-done.sh <ISSUE_NUMBER>
```

---

## 📝 チェックリスト

### タスク開始時

- [ ] フィーチャーブランチを作成した
- [ ] 現在のブランチがmainでないことを確認した（`git branch`）
- [ ] IssueをIn Progressに変更した

### コミット前

- [ ] 現在のブランチがmainでないことを確認した
- [ ] Lintチェックが通った
- [ ] テストがパスした

### push前

- [ ] 現在のブランチがmainでないことを確認した
- [ ] pushするブランチ名がフィーチャーブランチ名であることを確認した

### PR作成時

- [ ] PRを作成した
- [ ] IssueはIn Progressのまま維持した（Doneに変更していない）

### PRマージ後

- [ ] PRがmainにマージされたことを確認した
- [ ] IssueをDoneに変更した
- [ ] Issueに完了報告をコメントした

---

**このチェックリストを常に参照し、正しいワークフローを遵守してください。**
