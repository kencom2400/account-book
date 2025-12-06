## 4. PR作成・レビュー

### 🤖 PR自動作成ワークフロー

AIアシスタントは以下のワークフローでPRを自動管理します：

#### 🚨 重要: PRは常に通常PRとして作成

**禁止事項:**

- ❌ ドラフトPR（`--draft`フラグ）の作成は禁止
- ❌ 一時的なPRや下書きPRの作成は禁止

**理由:**

- レビューを迅速に開始できる
- PRのステータスが明確になる
- 不要な手順（ドラフト解除）を省略できる

#### 1. 最初のpush時: 通常PRを自動作成

**トリガー:**

- 新しいブランチで最初にpushする時
- ユーザーが「PRを作成して」と明示的に依頼した時

**実行内容:**

```bash
# 通常PRを作成（--draftフラグは使用しない）
gh pr create \
  --title "<type>: <短い説明>" \
  --body "<自動生成された説明>"
```

**PRの本文に含めるべき内容:**

- 変更の概要
- 主な変更点のリスト
- コミット履歴
- 関連するIssue番号（`Closes #XXX`など）

#### 2. 追加のpush時: PR本文を自動更新

**トリガー:**

- 既存のPRがあるブランチにpushする時

**実行内容:**

```bash
# 既存のPR番号を取得
PR_NUMBER=$(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')

# PR本文を更新
gh pr edit $PR_NUMBER --body "<更新された説明>"
```

### PRサイズガイドライン

**推奨サイズ:**

- **Small**: ~100行以下 - 理想的なサイズ
- **Medium**: 100-300行 - 許容範囲
- **Large**: 300-500行 - 分割を検討
- **Extra Large**: 500行以上 - 必ず分割すべき

### PR作成前のチェックリスト

- [ ] すべての変更がコミット済み
- [ ] **push前のローカルチェックを完了（必須）**
- [ ] テストが通ることを確認
- [ ] Lintエラーがないことを確認
- [ ] コンフリクトが発生していないことを確認
- [ ] 適切なブランチ名が付けられている

### CI確認と対応

#### PR作成後の自動確認

```bash
# PRのCI実行状況を確認（30〜60秒待機してから実行）
sleep 45
gh pr checks <PR番号>
```

#### エラー発生時の原因究明

**1. エラーログの取得**

```bash
# 失敗したCIのログを確認
gh run view <run-id> --log-failed
```

**2. 原因の特定**

- 今回の修正で新しく発生したエラーか？
- 既存のコードベースに元々存在していたエラーか？

#### 対応方針

**A. 自身の修正で発生したエラーの場合**

✅ **即座に解決する**

1. ローカルで同じエラーを再現
2. エラーを修正
3. ローカルで確認
4. コミット & プッシュ
5. 再度CIを確認

**B. 既存のエラーである場合**

✅ **Bugのissueを作成する**

**必ず`create-issue.sh`スクリプトを使用してください:**

```bash
# 1. Issue用のJSONファイルを作成
cat > scripts/github/issues/issue-data/drafts/ci-error-bug.json << EOF
{
  "title": "[BUG] [CI名]で[エラー数]個のエラー/警告が発生",
  "labels": ["bug", "infrastructure", "priority: high"],
  "body": "[詳細な内容]"
}
EOF

# 2. スクリプトでIssue作成（自動的にBacklogに設定される）
./scripts/github/issues/create-issue.sh scripts/github/issues/issue-data/drafts/ci-error-bug.json
```

❌ **禁止**: `gh issue create`を直接使用しないでください。プロジェクトに自動追加されません。

### 🤖 Gemini Code Assistレビュー対応

```
╔══════════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL: Geminiレビュー対応の絶対ルール 🚨                   ║
║                                                                  ║
║  1. すべての指摘に必ず対応する（見落とし禁止）                    ║
║  2. 1つの指摘に対して、必ず1 commitで対応                        ║
║  3. 複数の指摘をまとめて1つのcommitにすることは絶対に禁止         ║
║  4. すべてのcommit完了後、まとめてpushする                        ║
║  5. すべての指摘対応完了後、必ずPRコメントで返信                  ║
╚══════════════════════════════════════════════════════════════════╝
```

#### Step 1: すべての指摘を確認・リスト化（必須）

**重要**: Geminiのインラインコメントを取得する際は、必ずGraphQL APIを使用してください。`gh pr view --comments`やREST APIではインラインコメントの詳細が取得できません。

```bash
# ✅ 正しい方法: GraphQL APIで全コメントを取得
gh api graphql -f query='
query {
  repository(owner: "kencom2400", name: "account-book") {
    pullRequest(number: <PR番号>) {
      reviews(first: 10) {
        nodes {
          author { login }
          body
          comments(first: 20) {
            nodes {
              id
              path
              body
              line
            }
          }
        }
      }
    }
  }
}'
```

**必須**: 指摘の総数を確認し、**すべてに対応する**

#### Step 2: 指摘ごとに個別対応（必須）

**1つの指摘ごとにcommit（pushはまだしない）**：

1. 該当ファイルを修正
2. `git add <修正したファイル>`
3. `git commit -m "docs: Gemini指摘対応 - <具体的な修正内容>"`
4. 次の指摘に進む

**重要**: この段階ではまだpushしない。すべての指摘への対応commitを完了してから、次のステップでまとめてpushする。

#### Step 3: すべての修正をまとめてpush（必須）

すべての指摘に対するcommitが完了したら、まとめてpushする：

```bash
# push前に必ずローカルチェックを実行（必須）
./scripts/test/lint.sh
./scripts/test/test.sh all
./scripts/test/test-e2e.sh frontend

# すべてのcommitをまとめてpush
git push origin <ブランチ名>
```

**理由**:

- コミットの粒度を保ちつつ、CIの無駄な実行を防ぐ
- 1回のpushで複数のcommitが含まれるため、CI実行は1回のみ
- push前にローカルチェックを実行することで、CIエラーを事前に防止

#### Step 4: CI確認（推奨）

push後、CIの状況を確認：

```bash
gh pr checks <PR番号>
```

#### Step 5: PRコメントで対応完了を報告（必須）

**🚨 重要: バッククォートなどの特殊文字を含むコメントは、必ず`comment-pr.sh`スクリプトを使用してください。**

```bash
# ✅ 推奨: comment-pr.shスクリプトを使用（特殊文字を安全に処理）
./scripts/github/pr/comment-pr.sh <PR番号> << 'EOF'
```
