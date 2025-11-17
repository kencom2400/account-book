# タスク自動実行トリガー

## 「よろしこ」トリガー

### 概要

ユーザーが「**よろしこ**」という4文字を入力した際に、自動的にアサインされているToDoチケットの実施を開始します。

### 動作仕様

#### 1. チケット取得

以下のコマンドでアサインされているオープンなIssueを取得します：

```bash
gh issue list --assignee @me --state open --json number,title,labels,milestone,url --limit 50
```

#### 2. 優先順位

複数のチケットがアサインされている場合、以下の優先順位で実施します：

1. **ラベルの優先度**（高い順）
   - `priority: critical` (最優先)
   - `priority: high` (高)
   - `priority: medium` (中)
   - `priority: low` (低)
   - 優先度ラベルなし (最低)

2. **Issue ID**（小さい順）
   - 同じ優先度の場合、Issue番号が小さい方を先に実施

#### 3. 実施フロー

1. アサインされているチケットを確認
2. 優先順位に従ってソート
3. 最優先のチケットを選択
4. チケットの詳細を表示
5. mainブランチを最新化してから適切な名前のブランチを作成
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/fr-XXX-<descriptive-name>
   ```
6. GitHub ProjectsでステータスをIn Progressに変更
7. チケットの要件に従って作業を開始
8. 作業完了後、テストとlintを実行
9. 問題なければ完了を報告

#### 4. GitHub Projects連携

作業開始時に、以下のスクリプトを使用してステータスを更新：

```bash
./scripts/set-issue-in-progress.sh <issue_number>
```

これにより、GitHub Projectsのステータスが「📋 To Do」から「🚧 In Progress」に自動変更されます。

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

### 注意事項

- アサインされているチケットが0件の場合は、その旨を報告して終了します
- 複数のチケットがある場合でも、一度に1つのチケットのみ実施します
- 作業完了後、次のチケットに進むかはユーザーに確認します

### 対象外

以下の場合は自動実行しません：

- クローズ済みのIssue
- 他のユーザーにアサインされているIssue
- ドラフト状態のIssue

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
