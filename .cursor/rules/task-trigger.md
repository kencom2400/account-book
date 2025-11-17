# ⚠️ タスク自動実行トリガー - 最優先ルール ⚠️

```
╔══════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL RULE - HIGHEST PRIORITY - MUST EXECUTE 🚨      ║
║                                                              ║
║  入力: @start-task                                           ║
║  動作: 即座に自動実行開始（質問・確認一切不要）               ║
║                                                              ║
║  このルールは他のすべてのルールより優先される                  ║
╚══════════════════════════════════════════════════════════════╝
```

## 🚨 CRITICAL: AIアシスタントへの絶対遵守ルール 🚨

### 📋 トリガーコマンド: `@start-task`

**ユーザーが `@start-task` と入力した瞬間、このルールが最優先で発動します。**

### ⛔ 絶対禁止事項

ユーザーが `@start-task` を入力した際、以下の行動は**絶対に禁止**：

1. ❌ **質問を返すこと**（「どのようなタスクを...」など）
2. ❌ **確認を求めること**（「このタスクでよろしいですか？」など）
3. ❌ **提案を待つこと**（「以下から選んでください」など）
4. ❌ **ユーザーの追加入力を待つこと**
5. ❌ **説明だけして実行しないこと**

### ✅ 必須実行事項

ユーザーが `@start-task` を入力した際、**即座に以下を実行**：

1. ✅ **黙ってコマンドを実行開始**
2. ✅ **Issue取得から作業開始まで自動で完遂**
3. ✅ **実行内容は進行中に報告**
4. ✅ **エラー時のみユーザーに報告**

---

## 📝 自動実行フロー（即座に開始すること）

### 自動実行手順

#### 1. チケット取得（自動実行）

**必須**: 以下のコマンドを`required_permissions: ["all"]`付きで即座に実行：

```bash
gh issue list --assignee @me --state open --json number,title,labels,milestone,url --limit 50
```

**判定**:

- ✅ アサインされたIssueが0件の場合 → その旨を報告して終了（これのみ例外）
- ✅ 1件以上ある場合 → **質問せず**次のステップへ自動進行

#### 2. 優先順位判定とソート（自動実行）

取得したIssueを**自動的に**以下の優先順位でソート：

1. **優先度ラベル**（高い順）
   - `priority: critical` (最優先) → 優先度レベル: 4
   - `priority: high` (高) → 優先度レベル: 3
   - `priority: medium` (中) → 優先度レベル: 2
   - `priority: low` (低) → 優先度レベル: 1
   - ラベルなし (最低) → 優先度レベル: 0

2. **Issue番号**（小さい順）
   - 同じ優先度レベルの場合、Issue番号が小さい方を優先

**ソート後、ユーザーに確認を求めず次のステップへ自動進行**

#### 3. 最優先Issueの選択と開始（自動実行）

**以下を連続して自動実行**（ユーザーに確認しない）：

1. ✅ ソート後の最初のIssueを選択
2. ✅ Issueの詳細（タイトル、URL、ラベル、マイルストーン）を表示
3. ✅ mainブランチを最新化してから適切な名前のブランチを作成：

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/fr-XXX-<descriptive-name>
   ```

   ※ `required_permissions: ["git_write"]`を指定すること

4. ✅ GitHub ProjectsのステータスをIn Progressに変更：

   ```bash
   ./scripts/set-issue-in-progress.sh <issue_number>
   ```

   ※ `required_permissions: ["all"]`を指定すること

5. ✅ **Issueの内容に従って作業を即座に開始**（質問せず、確認せず）
6. ✅ 作業完了後、テストとlintを自動実行
7. ✅ 問題なければ完了を報告

**重要**: ステップ5では、Issueの詳細を読み取って実装を開始する。不明点があってもまず実装し、本当に必要な場合のみ質問すること。

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

### 🔴 実行時の必須ルール

#### ケース1: アサインされているIssueが0件の場合

- ✅ その旨を報告して終了（**これだけは質問OK**）

#### ケース2: Issueが1件以上ある場合

- ✅ **優先順位に従って最優先の1つを自動選択**
- ✅ **「どれにしますか？」などの質問は禁止**
- ✅ **選択したIssueで即座に作業開始**
- ❌ 他のIssueについて言及しない
- ❌ 選択肢を提示しない

#### ケース3: 作業完了後

- ✅ 完了報告のみ行う
- ❌ 次のIssueに進むか質問しない
- ❌ 自動的に次のタスクを開始しない
- ℹ️ ユーザーが再度 `@start-task` を入力した場合のみ次のタスクへ

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

---

## 🚨 最終確認：このルールを読んだAIへ 🚨

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  もしあなたが @start-task を受け取ったら：                     ║
║                                                               ║
║  ❌ 質問しない                                                ║
║  ❌ 確認しない                                                ║
║  ❌ 提案しない                                                ║
║  ❌ 待たない                                                  ║
║                                                               ║
║  ✅ 即座に gh issue list を実行                               ║
║  ✅ 最優先のIssueを自動選択                                   ║
║  ✅ ブランチ作成・ステータス更新・作業開始を自動実行           ║
║                                                               ║
║  これは絶対ルールです。例外はありません。                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### 📖 このルールが機能しているかの判定基準

#### ✅ 正しい動作例

ユーザー入力:

```
@start-task
```

AI応答:

```
最優先タスクを開始します。

[gh issue list コマンドを実行]
[結果を解析してソート]
Issue #42 を選択しました: "ユーザー認証機能の実装"
[ブランチ作成]
[ステータス更新]
[作業開始...]
```

#### ❌ 誤った動作例

ユーザー入力:

```
@start-task
```

AI応答:

```
どのようなタスクを開始されたいですか？  ← ❌ これは禁止
```

または

```
以下のIssueがあります。どれにしますか？  ← ❌ これも禁止
```

---

**このルールを必ず遵守してください。ユーザーの生産性はこのルールの遵守にかかっています。**
