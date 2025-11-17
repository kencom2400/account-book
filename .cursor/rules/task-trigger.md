# タスク自動実行トリガー

## AIアシスタントへの必須ルール

**ユーザーが `/start-task` コマンドを入力した場合、以下の手順を必ず自動実行すること。**

## `/start-task` コマンド

### 概要

ユーザーが「**/start-task**」と入力した際、アサインされている最優先のToDoチケットを自動的に開始します。

### 自動実行手順

#### 1. チケット取得

以下のコマンドを実行してアサインされているオープンなIssueを取得：

```bash
gh issue list --assignee @me --state open --json number,title,labels,milestone,url --limit 50
```

- アサインされたIssueが0件の場合 → その旨を報告して終了
- 1件以上ある場合 → 次のステップへ

#### 2. 優先順位判定とソート

取得したIssueを以下の優先順位でソート：

1. **優先度ラベル**（高い順）
   - `priority: critical` (最優先) → 優先度レベル: 4
   - `priority: high` (高) → 優先度レベル: 3
   - `priority: medium` (中) → 優先度レベル: 2
   - `priority: low` (低) → 優先度レベル: 1
   - ラベルなし (最低) → 優先度レベル: 0

2. **Issue番号**（小さい順）
   - 同じ優先度レベルの場合、Issue番号が小さい方を優先

#### 3. 最優先Issueの選択と開始

1. ソート後の最初のIssueを選択
2. Issueの詳細（タイトル、URL、ラベル、マイルストーン）を表示
3. mainブランチを最新化してから適切な名前のブランチを作成
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/fr-XXX-<descriptive-name>
   ```
4. 以下のコマンドでGitHub ProjectsのステータスをIn Progressに変更：

```bash
./scripts/set-issue-in-progress.sh <issue_number>
```

5. Issueの内容に従って作業を開始
6. 作業完了後、テストとlintを実行
7. 問題なければ完了を報告

### 実装例

```typescript
// 優先順位の判定ロジック
const getPriorityLevel = (labels: Array<{ name: string }>): number => {
  const priorityLabel = labels.find((l) => l.name.startsWith('priority:'));
  if (!priorityLabel) return 0;

  if (priorityLabel.name === 'priority: critical') return 4;
  if (priorityLabel.name === 'priority: high') return 3;
  if (priorityLabel.name === 'priority: medium') return 2;
  if (priorityLabel.name === 'priority: low') return 1;
  return 0;
};

// ソート処理
issues.sort((a, b) => {
  const priorityDiff = getPriorityLevel(b.labels) - getPriorityLevel(a.labels);
  if (priorityDiff !== 0) return priorityDiff;
  return a.number - b.number; // Issue IDで昇順
});
```

### 実行時の注意事項

- **アサインされているIssueが0件の場合**
  - その旨をユーザーに報告して終了
- **複数のIssueがある場合**
  - 優先順位に従って最優先の1つのみ実施
  - 他のIssueは次回の `/start-task` まで保留
- **作業完了後**
  - 次のIssueに進むかはユーザーに確認する
  - 自動的に次のタスクを開始しない

### 自動実行の対象外

以下のIssueは自動的に除外される：

- ✅ クローズ済みのIssue（`--state open` で除外）
- 👤 他のユーザーにアサインされているIssue（`--assignee @me` で除外）
- 📝 ドラフトPR状態のIssue

### 関連スクリプト

- `scripts/set-issue-in-progress.sh`: Issueステータスを"In Progress"に変更
- `scripts/check-closed-issues.sh`: Issueの完了状況確認
- `scripts/test.sh`: テスト実行
- `scripts/lint.sh`: Lint実行

### ベストプラクティス

1. **作業開始前の確認**
   - Issueの詳細を必ず確認
   - 関連ドキュメントや要件定義を参照
   - 実装方針を理解してから着手

2. **作業中**
   - 小さな単位でコミット
   - テストを書きながら実装
   - Lintエラーは随時修正

3. **作業完了後**
   - すべてのテストがパスすることを確認
   - Lintエラーが0件であることを確認
   - 実装内容をドキュメント化（必要に応じて）

### トラブルシューティング

#### GitHub API接続エラー

```bash
# 認証状態を確認
gh auth status

# 再認証
gh auth login
```

#### ステータス変更エラー

- プロジェクトにIssueが追加されているか確認
- プロジェクト番号が正しいか確認（通常は1）

#### 優先度ラベルが正しく認識されない

- ラベル名が正確か確認（スペースや大文字小文字に注意）
- `priority: <レベル>` の形式であることを確認

#### ghコマンドの実行について

**重要**: `gh` コマンド（GitHub CLI）を実行する際は、必ず `required_permissions: ["all"]` を指定してサンドボックス環境から抜けて実行すること。

- サンドボックス環境では証明書検証エラーが発生する可能性があるため
- 例: `gh issue list`, `gh project item-edit`, `gh auth status` などすべてのghコマンドが対象

#### pnpm/nodeコマンドの実行について

**重要**: `pnpm`、`node`、`npm`、`npx`などのコマンドを実行する際は、必ずnodeenv環境をアクティベートすること。

```bash
source scripts/activate.sh
```

- このプロジェクトは`nodeenv`を使用しており、これらのツールは`.nodeenv`ディレクトリ内にローカルインストールされている
- `command not found: pnpm`エラーはサンドボックスの問題ではなく、PATHの問題
- 詳細は`project.md`の「環境管理」セクションを参照
