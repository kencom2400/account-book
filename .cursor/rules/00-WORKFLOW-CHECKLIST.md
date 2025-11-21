# ワークフロー・チェックリスト - 最優先ガイド

```
╔═══════════════════════════════════════════════════════════════╗
║  ⭐ WORKFLOW CHECKLIST - 全体フローの羅針盤 ⭐               ║
║                                                               ║
║  このファイルは、タスク開始から完了までの全体フローを       ║
║  示します。各ステップで参照すべきルールファイルが           ║
║  明記されています。                                          ║
╚═══════════════════════════════════════════════════════════════╝
```

## 📋 ワークフロー全体像

```
@start-task
    ↓
1️⃣ タスク開始
    ↓
2️⃣ 実装・コミット
    ↓
3️⃣ push前チェック
    ↓
4️⃣ PR作成・レビュー
    ↓
5️⃣ マージ・完了報告
```

---

## 1️⃣ タスク開始フェーズ

### 🚨 トリガー: `@start-task` コマンド

**実行内容:**

- [ ] GitHub Projectsから「📝 To Do」ステータスのIssueを取得
- [ ] 優先度順にソート（priority: critical > high > medium > low）
- [ ] 最優先Issueを自動選択
- [ ] ブランチ作成（`feature/issue-XXX-description`）
- [ ] ステータスを「🚧 In Progress」に変更

**参照ルール:**

- **`.cursor/rules/04-github-integration.md`** - Issue取得・ステータス管理
- **`.cursor/rules/03-git-workflow.md`** - ブランチ作成

**重要事項:**

- ✅ 質問・確認なしで即座に実行
- ✅ GitHub ProjectsのステータスをIn Progressに変更
- ✅ 各IssueのAssignee情報を確認し、自分にアサインされているものをフィルタリング

---

## 2️⃣ 実装・コミットフェーズ

### 📝 実装中の必須確認事項

**コード品質:**

- [ ] **型安全性を絶対遵守**（any型禁止）
- [ ] **Enum型の比較は型安全に**（`Object.entries()`使用時は明示的型キャスト）
- [ ] 危険な型キャストを使用していないか
- [ ] データアクセスは配列順序依存ではなくIDベースか
- [ ] テストコードも型安全か

**参照ルール:**

- **`.cursor/rules/01-project.md`** - アーキテクチャ原則・技術スタック
- **`.cursor/rules/02-code-standards.md`** - コード品質・型安全性・テスト

### 🔄 コミットタイミング

**🚨 CRITICAL: 作業完了時は即座に自動コミット**

- ✅ 機能実装完了時
- ✅ バグ修正完了時
- ✅ テスト追加時
- ✅ ドキュメント更新時
- ✅ 各レイヤー実装完了時
- ❌ 「後でコミット」は禁止

**コミット前チェックリスト:**

- [ ] ビルドが成功するか（`./scripts/build/build.sh`）
- [ ] Lintエラーがないか（`./scripts/test/lint.sh`）
- [ ] テストがパスするか（`./scripts/test/test.sh all`）
- [ ] 不要なコメントやconsole.logを削除
- [ ] コミットメッセージが適切か

**参照ルール:**

- **`.cursor/rules/03-git-workflow.md`** - コミットルール・タイミング

---

## 3️⃣ push前チェックフェーズ

### 🚨 CRITICAL: push前の必須チェック

**理由:**

- pushするとGitHub ActionsでCIが実行される（約3-5分）
- ローカルでエラーを事前に検出することで、無駄なCI実行を防止

**必須実行スクリプト:**

```bash
# 1. Lintチェック（必須）
./scripts/test/lint.sh

# 2. ユニットテスト（必須）
./scripts/test/test.sh all

# 3. E2Eテスト（必須）
./scripts/test/test-e2e.sh frontend
```

**実行時間:** 約3-4分（CI実行より短い）

**例外（一部スキップ可能）:**

- ドキュメントファイル（`*.md`）のみの変更: test/e2eはスキップ可、lintは実行推奨
- 設定ファイル（`.cursor/**`）のみの変更: test/e2eはスキップ可、lintは実行推奨

**ただし、以下の設定ファイル変更時は全スクリプト実行必須:**

- `eslint.config.*`, `tsconfig.json`, `jest.config.*`, `package.json`, `pnpm-workspace.yaml`

**参照ルール:**

- **`.cursor/rules/03-git-workflow.md`** - push前チェック
- **`.cursor/rules/02-code-standards.md`** - コード品質チェック

---

## 4️⃣ PR作成・レビューフェーズ

### 📤 PR作成ワークフロー

**自動化されたフロー:**

1. **最初のpush時**: ドラフトPRを自動作成
2. **追加のpush時**: PR本文を自動更新
3. **ユーザー確認後**: ドラフトを解除してレビュー依頼

**PR作成前チェック:**

- [ ] すべての変更がコミット済み
- [ ] push前のローカルチェックを完了（lint/test/e2e）
- [ ] テストが通ることを確認
- [ ] コンフリクトが発生していないか確認

**参照ルール:**

- **`.cursor/rules/03-git-workflow.md`** - PR作成・レビュー対応

### 🔍 CI確認と対応

**PR作成後の自動確認:**

1. CIステータスの確認（30-60秒待機後）
2. エラー発生時の原因究明
3. 自分の修正によるエラー → 即座に修正
4. 既存のエラー → Issue作成

**参照ルール:**

- **`.cursor/rules/03-git-workflow.md`** - CI確認・エラー対応

### 🤖 Gemini Code Assistレビュー対応

**🚨 CRITICAL: レビュー対応の絶対ルール**

- [ ] すべての指摘に必ず対応する（見落とし禁止）
- [ ] 1つの指摘に対して、1 commitで対応する
- [ ] すべての指摘対応完了後、PRコメントで返信する

**参照ルール:**

- **`.cursor/rules/03-git-workflow.md`** - Geminiレビュー対応の詳細手順

---

## 5️⃣ マージ・完了報告フェーズ

### ✅ マージ時の自動処理

**PRマージ時に自動実行:**

- [ ] 関連IssueのステータスをDoneに更新
- [ ] Issueをクローズ

**参照ルール:**

- **`.cursor/rules/04-github-integration.md`** - ステータス更新

### 📊 Issue完了報告

**🚨 CRITICAL: commit完了後は必ずIssue報告**

**タイミング:**

- commit完了後（push前でも可）
- 長時間作業（4時間超）の場合は途中報告

**報告内容:**

- 実施した作業
- 成果物（ファイルリスト）
- 達成した目標（受入基準）
- 次のステップ（レビュー依頼等）
- 作業時間
- 関連リンク（PR、ブランチ、コミット）

**実行方法:**

```bash
gh issue comment <ISSUE_NUMBER> --body "<報告内容>"
```

**参照ルール:**

- **`.cursor/rules/04-github-integration.md`** - Issue報告
- **`.cursor/rules/templates/issue-report.md`** - 報告テンプレート

---

## 🔄 フェーズ間の状態遷移

### GitHub Projectsステータス

```
📝 To Do → 🚧 In Progress → 👀 Review → ✅ Done
```

**遷移タイミング:**

- **To Do → In Progress**: タスク開始時（`@start-task`実行時）
- **In Progress → Review**: PR作成時
- **Review → Done**: PRマージ時

**参照ルール:**

- **`.cursor/rules/04-github-integration.md`** - ステータス管理

---

## 📚 ルールファイル一覧

### 基本ルール

1. **`00-WORKFLOW-CHECKLIST.md`** ⭐ このファイル（全体フロー）
2. **`01-project.md`** - プロジェクト概要・技術スタック・アーキテクチャ
3. **`02-code-standards.md`** - コード品質・型安全性・テスト
4. **`03-git-workflow.md`** - ブランチ・コミット・PR
5. **`04-github-integration.md`** - Issue管理・ステータス・報告
6. **`05-ci-cd.md`** - CI/CD設定

### テンプレート

- **`templates/issue-report.md`** - Issue報告テンプレート
- **`templates/pr-description.md`** - PR説明テンプレート

---

## 🚨 最優先事項サマリー

### 絶対に守るべきルール

1. **型安全性**: any型の使用禁止
2. **自動コミット**: 作業完了時は即座にコミット（質問・確認不要）
3. **push前チェック**: lint/test/e2eを必ず実行
4. **@start-task**: 質問せず即座に最優先タスクを開始
5. **Geminiレビュー対応**: すべての指摘に個別commit/pushで対応
6. **Issue報告**: commit完了後は必ずGitHub Issueに報告

### push前の必須チェック

```bash
./scripts/test/lint.sh
./scripts/test/test.sh all
./scripts/test/test-e2e.sh frontend
```

---

## ⚡ クイックリファレンス

### よく使うコマンド

```bash
# タスク開始
@start-task

# ビルド確認
./scripts/build/build.sh

# Lintチェック
./scripts/test/lint.sh

# テスト実行
./scripts/test/test.sh all

# E2Eテスト
./scripts/test/test-e2e.sh frontend

# Issue報告
gh issue comment <ISSUE_NUMBER> --body "<報告内容>"

# ステータス更新
./scripts/github/projects/set-issue-in-progress.sh <ISSUE_NUMBER>
./scripts/github/projects/set-issue-done.sh <ISSUE_NUMBER>
```

---

**このワークフローを常に参照し、各フェーズで適切なルールファイルを確認してください。**
