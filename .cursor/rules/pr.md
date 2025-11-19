# Pull Request Rules - プルリクエストルール

```
╔════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL RULE - PUSH前の必須チェック 🚨              ║
║                                                            ║
║  pushする前に必ず以下のスクリプトを実行すること：         ║
║                                                            ║
║  1. ./scripts/test/lint.sh                                ║
║  2. ./scripts/test/test.sh all                            ║
║  3. ./scripts/test/test-e2e.sh frontend                   ║
║                                                            ║
║  【理由】                                                  ║
║  - pushするとGitHub ActionsでCIが実行される               ║
║  - CI失敗は無駄なリソース消費とフィードバック遅延        ║
║  - ローカルチェックでCI失敗を事前に防止する               ║
║                                                            ║
║  【原則】                                                  ║
║  エラーがある場合はpush禁止。修正してから再実行。         ║
║  ドキュメントのみの変更でもlintは実行推奨。               ║
╚════════════════════════════════════════════════════════════╝
```

## 🚨 AIアシスタントへの絶対遵守ルール 🚨

### push前に必ず実行すること

**重要**: pushする前に必ず以下のスクリプトを実行してエラーがないことを確認する。

**理由**:

- pushするとGitHub ActionsでCIが実行される
- CI実行には時間とリソースが必要（約3-5分）
- ローカルでエラーを事前に検出することで、無駄なCI実行を防止できる
- フィードバックループが短縮され、開発効率が向上する

**実行手順：**

```bash
# 1. Lintチェック（必須）
./scripts/test/lint.sh

# 2. ユニットテスト（必須）
./scripts/test/test.sh all

# 3. E2Eテスト（必須）
./scripts/test/test-e2e.sh frontend
```

**エラーがある場合：**

1. ❌ **絶対にpushしない**
2. ✅ エラー内容をユーザーに報告
3. ✅ 修正方法を提案または修正を実施
4. ✅ 修正後、再度全てのスクリプトを実行
5. ✅ エラーがなくなったらcommit & push

**例外: スキップ可能な場合**

以下の場合のみ、一部スクリプトをスキップ可能：

- ドキュメントファイル（`*.md`）のみの変更: test/e2eはスキップ可、lintは実行推奨
- 設定ファイル（`.cursor/**`）のみの変更: test/e2eはスキップ可、lintは実行推奨

**ただし、以下の設定ファイル変更時は全スクリプト実行必須：**

- `eslint.config.*`, `tsconfig.json`, `jest.config.*`, `package.json`, `pnpm-workspace.yaml`

**実行時間の目安：**

- lint: 約30-60秒
- test: 約1-2分
- e2e: 約30-60秒
- 合計: 約3-4分（CI実行より短い）

---

## 🤖 PR自動作成ワークフロー

### 基本フロー

AIアシスタントは以下のワークフローでPRを自動管理します：

#### 1. 最初のpush時: ドラフトPRを自動作成

**トリガー:**

- 新しいブランチで最初にpushする時
- ユーザーが「PRを作成して」と明示的に依頼した時

**実行内容:**

```bash
# ドラフトPRを作成
gh pr create --draft \
  --title "<type>: <短い説明>" \
  --body "<自動生成された説明>"
```

**ドラフトPRの本文に含めるべき内容:**

- 変更の概要
- 主な変更点のリスト
- コミット履歴
- TODO（未完了の作業があれば）

**例:**

```markdown
## 概要

[WIP] 機能Xを実装中

## 変更内容

- ✅ 基本実装完了
- ✅ ユニットテスト追加
- 🔄 統合テスト作成中

## TODO

- [ ] 統合テストの完成
- [ ] ドキュメント更新
- [ ] レビュー準備

## コミット

1. feat: 機能Xの基本実装
2. test: ユニットテスト追加
```

#### 2. 追加のpush時: PR本文を自動更新

**トリガー:**

- 既存のドラフトPRがあるブランチにpushする時

**実行内容:**

```bash
# 既存のPR番号を取得
PR_NUMBER=$(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')

# PR本文を更新
gh pr edit $PR_NUMBER --body "<更新された説明>"
```

**更新時のポイント:**

- 新しいコミットを反映
- TODOリストを更新
- 完了した作業をチェック
- 変更の概要を必要に応じて更新

#### 3. ユーザー確認後: ドラフトから通常PRに変更

**トリガー:**

- ユーザーが「PRをレビュー可能にして」「ドラフトを解除して」と依頼した時
- ユーザーが明示的に「OK」「完了」と確認した時

**実行前の確認事項:**

```bash
# 必須チェック（コードファイル変更時）
./scripts/build/build.sh
./scripts/test/lint.sh
./scripts/test/test.sh
```

**実行内容:**

```bash
# ドラフトを解除
gh pr ready $PR_NUMBER

# 必要に応じてPR本文を最終更新
gh pr edit $PR_NUMBER --body "<最終的な説明>"
```

**最終PR本文に含めるべき内容:**

- 変更の概要（完全版）
- すべての変更点
- テスト結果
- レビュー観点
- 関連Issue（Closes #XX, Related to #YY）
- スクリーンショット（UIの変更がある場合）

### 実装例

**シナリオ: 新機能の実装**

1. **ユーザー**: 「機能Xを実装して」
2. **AI**: 実装を開始、コミット
3. **AI**: 最初のpush時に自動的にドラフトPRを作成

   ```bash
   gh pr create --draft \
     --title "feat: 機能Xを実装" \
     --body "## 概要
   [WIP] 機能Xを実装中

   ## 実装状況
   - ✅ 基本実装完了
   - 🔄 テスト作成中"
   ```

4. **ユーザー**: 「テストも追加して」
5. **AI**: テストを追加、コミット、push
6. **AI**: PR本文を自動更新

   ```bash
   gh pr edit $PR_NUMBER --body "## 概要
   [WIP] 機能Xを実装中

   ## 実装状況
   - ✅ 基本実装完了
   - ✅ テスト追加完了
   - 🔄 ドキュメント更新中"
   ```

7. **ユーザー**: 「OK、レビュー依頼して」
8. **AI**: build/lint/testを実行、ドラフトを解除

   ```bash
   # チェック実行
   ./scripts/build/build.sh && ./scripts/test/lint.sh && ./scripts/test/test.sh && ./scripts/test/test-e2e.sh

   # ドラフト解除
   gh pr ready $PR_NUMBER

   # 最終更新
   gh pr edit $PR_NUMBER --body "## 概要
   機能Xを実装しました

   ## 変更内容
   - ✅ 基本実装完了
   - ✅ ユニットテスト追加
   - ✅ ドキュメント更新

   ## テスト結果
   - ✅ Build: 成功
   - ✅ Lint: エラーなし
   - ✅ Test: 全テストパス

   Closes #123"
   ```

### 注意事項

**ドラフトPR作成時:**

- まだ完成していない旨を明確に示す（[WIP]タグなど）
- TODOリストを含める
- レビュー不要であることを暗示

**ドラフト解除時:**

- すべてのチェックが完了していることを確認
- PR本文を完全版に更新
- 関連Issueを明記
- レビュー観点を記載

**自動化を避けるべき場合:**

- ユーザーが明示的に「PRは作らないで」と指示した時
- 実験的な変更やWIPブランチの場合（ユーザーが望まない限り）

---

## 基本原則

### 必須ルール

- **チャットでPR作成を希望された場合、必ずPRを作成する**
- **push前に、build/lint/testを実行する**（コードファイル変更時）
- PR作成前に、コミットが完了していることを確認
- PRテンプレートに従って説明を記載
- レビュアーが理解しやすい粒度でPRを作成

## PR作成のタイミング

### PR作成が推奨される場面

1. ✅ 新機能の実装が完了した時
2. ✅ 大きなリファクタリングが完了した時
3. ✅ バグ修正が完了した時
4. ✅ ドキュメントの大幅な更新を行った時
5. ✅ ユーザーが明示的にPR作成を依頼した時

### PR作成前のチェックリスト

- [ ] すべての変更がコミット済み
- [ ] **push前のローカルチェックを完了（必須）**

  ```bash
  ./scripts/test/lint.sh
  ./scripts/test/test.sh all
  ./scripts/test/test-e2e.sh frontend
  ```

  - 理由: pushするとGitHub ActionsでCIが実行される。ローカルで事前にエラーを検出することで、無駄なCI実行を防止できる
  - 注: ドキュメントや設定ファイルのみの変更の場合は、一部スキップ可能（上記「push前に必ず実行すること」セクション参照）

- [ ] テストが通ることを確認
- [ ] Lintエラーがないことを確認
- [ ] コンフリクトが発生していないことを確認
- [ ] 適切なブランチ名が付けられている

## ブランチ命名規則

### フォーマット

```
<type>/<issue-number>-<short-description>
```

### Type一覧

| Type       | 説明                 | 例                                |
| ---------- | -------------------- | --------------------------------- |
| `feature`  | 新機能追加           | `feature/123-transaction-api`     |
| `fix`      | バグ修正             | `fix/456-balance-calculation`     |
| `refactor` | リファクタリング     | `refactor/789-onion-architecture` |
| `docs`     | ドキュメント更新     | `docs/001-setup-guide`            |
| `test`     | テスト追加・修正     | `test/234-usecase-tests`          |
| `chore`    | 環境設定・ツール変更 | `chore/567-setup-eslint`          |
| `hotfix`   | 緊急修正             | `hotfix/999-critical-bug`         |

### ブランチ名の例

```bash
feature/1-transaction-history-api
fix/2-credit-card-duplicate-calculation
refactor/3-repository-pattern
docs/4-architecture-guide
chore/5-project-setup
```

## PR タイトル命名規則

### フォーマット

```
<type>(<scope>): <subject> (#issue-number)
```

### 良い例

```
feat(transaction): 取引履歴取得APIを実装 (#1)
fix(balance): クレジットカード残高計算のバグを修正 (#2)
refactor(domain): Onion Architectureにリファクタリング (#3)
docs(readme): セットアップ手順を追加 (#4)
chore(deps): 依存関係を更新 (#5)
```

## PR サイズガイドライン

### 推奨サイズ

- **Small**: ~100行以下 - 理想的なサイズ
- **Medium**: 100-300行 - 許容範囲
- **Large**: 300-500行 - 分割を検討
- **Extra Large**: 500行以上 - 必ず分割すべき

### 大きなPRを避ける理由

- レビューが困難になる
- バグの混入リスクが増加
- マージ時のコンフリクトが発生しやすい
- レビュー時間が長くなり、開発速度が低下

## PR作成フロー

### 1. ブランチ作成

```bash
# mainから最新を取得
git checkout main
git pull origin main

# 作業ブランチを作成
git checkout -b feature/1-transaction-api
```

### 2. 開発・コミット

```bash
# 開発作業を実施
# ...

# コミット
git add .
git commit -m "feat(transaction): 取引履歴取得機能を実装"
```

### 3. push前の確認

**重要**: push前に必ず以下を確認する

#### push前のローカルチェック（必須）

**理由**: pushするとGitHub ActionsでCIが実行される。ローカルで事前にエラーを検出することで、無駄なCI実行を防止できる。

```bash
# 1. Lintチェック（必須）
./scripts/test/lint.sh

# 2. ユニットテスト（必須）
./scripts/test/test.sh all

# 3. E2Eテスト（必須）
./scripts/test/test-e2e.sh frontend
```

**注**: ドキュメントや設定ファイルのみの変更の場合は、一部スキップ可能（上記「push前に必ず実行すること」セクション参照）

#### プッシュ

```bash
# エラーがないことを確認したら、リモートにプッシュ
git push origin feature/1-transaction-api
```

### 4. PR作成

```bash
# GitHub CLIを使用する場合
gh pr create --title "feat(transaction): 取引履歴取得APIを実装 (#1)" \
             --body "$(cat .github/PULL_REQUEST_TEMPLATE.md)"

# またはGitHub WebUIから作成
```

## PR説明の書き方

### 必須項目

1. **変更内容の概要**: 何を変更したか
2. **変更の理由**: なぜこの変更が必要か
3. **変更の種類**: 機能追加、バグ修正など
4. **テスト内容**: どのようにテストしたか
5. **スクリーンショット**: UI変更がある場合

### テンプレート構成

PRテンプレートは`.github/pull_request_template.md`に配置

## レビュー依頼

### レビュアー選定基準

- 該当機能・モジュールに詳しい人
- アーキテクチャに精通している人
- コードオーナー（CODEOWNERS設定がある場合）

### セルフレビュー

PR作成後、自分でコードを見直す：

- [ ] 不要なコメントや`console.log`が残っていないか
- [ ] 命名規則に従っているか
- [ ] テストカバレッジが十分か
- [ ] ドキュメントの更新が必要か

## マージ戦略

### 推奨マージ方法

- **Squash and Merge**: 機能追加や小規模な変更（推奨）
- **Rebase and Merge**: クリーンな履歴を保ちたい場合
- **Merge Commit**: 複数人での共同作業の場合

### マージ前の確認

- [ ] すべてのレビューコメントに対応済み
- [ ] 承認（Approve）を取得
- [ ] CIが成功している
- [ ] コンフリクトが解決済み
- [ ] ドキュメントが更新済み

## PR コメント規則

### レビュアーのコメントタイプ

| プレフィックス | 意味         | 対応               |
| -------------- | ------------ | ------------------ |
| `MUST:`        | 必須の変更   | マージ前に必ず修正 |
| `SHOULD:`      | 推奨する変更 | できる限り対応     |
| `NITS:`        | 些細な指摘   | 任意で対応         |
| `Q:`           | 質問         | 回答または説明     |
| `IMO:`         | 個人的な意見 | 参考程度           |

### 良いレビューコメントの例

```
MUST: トランザクション処理にエラーハンドリングが必要です。
APIエラー時の処理を追加してください。

SHOULD: この関数は100行を超えているので、分割を検討してください。

NITS: 変数名は`data`より`transactionData`の方が明確です。

Q: この処理で振替と支出を区別する理由を教えてください。
```

## Draft PR（下書きPR）

### 使用場面

- 実装途中でフィードバックが欲しい時
- 設計レビューをしてほしい時
- CI動作確認をしたい時

### Draft PRの作成

```bash
# GitHub CLI
gh pr create --draft --title "WIP: feat(transaction): 取引履歴取得API"

# Web UI: "Create draft pull request"ボタンを使用
```

### Ready for Reviewに移行

```bash
gh pr ready
```

## 自動化

### PR作成時に自動実行される項目

- CI/CDパイプライン
  - Lint チェック
  - ユニットテスト
  - E2Eテスト
  - ビルド確認
- コードカバレッジ計測
- 依存関係のセキュリティチェック

## 特殊なケース

### ホットフィックス（緊急修正）

```bash
# ホットフィックスブランチ作成
git checkout -b hotfix/critical-bug main

# 修正後、即座にPR作成
gh pr create --title "hotfix: 重大なバグを緊急修正" \
             --label "priority:critical"
```

### リリースPR

```bash
# リリースブランチからPR作成
git checkout -b release/v1.0.0

# Changelogを更新
# バージョンを更新

gh pr create --title "release: v1.0.0" \
             --body "リリースノート: ..."
```

## AIアシスタントへの指示

チャットでユーザーがPR作成を希望した場合、以下を実行する：

### 1. 現在の状態確認

```bash
git status
git log --oneline -5
```

### 2. ブランチ名の確認

- 適切なブランチにいるか確認
- mainにいる場合は、適切なブランチ名を提案

### 3. PR作成

- GitHubにブランチをプッシュ
- PRテンプレートに従って説明を記載
- 適切なラベルを付与

### 4. PR URLの報告

- 作成したPRのURLをユーザーに報告
- レビュー依頼の提案

### 5. Gemini Code Assistのレビュー確認と対応（自動実行）

PR作成後、以下の手順を自動的に実行する：

#### 5-1. Gemini Code Assistのレビューを確認

**重要**: PR作成後、**必ず即座に**以下のコマンドを実行してGemini Code Assistのレビューコメントを確認すること。

```bash
# 方法1: レビューコメントを取得（推奨）
gh pr view <PR番号> --json reviews --jq '.reviews[] | select(.author.login | contains("gemini") or contains("bot") or contains("ai")) | {author: .author.login, state: .state, body: .body}'

# 方法2: インラインコメント（ファイルごとのコメント）を取得
gh api repos/{owner}/{repo}/pulls/<PR番号>/comments --paginate --jq '.[] | select(.user.login | contains("gemini") or contains("bot") or contains("ai")) | {path: .path, line: .line, body: .body}'

# 方法3: PRコメントを取得（補完的に使用）
gh pr view <PR番号> --json comments --jq '.comments[] | select(.author.login | contains("gemini") or contains("bot") or contains("ai")) | {author: .author.login, body: .body}'
```

**実行タイミング**:

- PR作成直後
- PRに新しいコメントが追加された可能性がある時
- ユーザーが「Geminiのコメントを確認して」と指示した時

**必須**: レビューコメントが取得できたら、必ず内容を確認し、指摘事項があれば修正すること。

#### 5-2. 提案への対応

**重要**: **1つの指摘に対して、必ず1 commit / 1 pushで対応すること。** 複数の指摘をまとめて1つのcommitにすることは**絶対に禁止**。

- Gemini Code Assistから提案があった場合は、その内容を確認し対応する
- **1つの指摘ごとに**：
  1. 該当ファイルを修正
  2. `git add <修正したファイル>`
  3. `git commit -m "fix: レビュー指摘に対応 - <具体的な修正内容>"`
  4. エラーがある場合は修正してから再度commit
  5. **push前に必ずローカルチェックを実行（必須）**

     ```bash
     ./scripts/test/lint.sh
     ./scripts/test/test.sh all
     ./scripts/test/test-e2e.sh frontend
     ```

     - 理由: pushするとGitHub ActionsでCIが実行される。ローカルで事前にエラーを検出することで、無駄なCI実行を防止できる
     - 注: ドキュメントや設定ファイルのみの変更の場合は、一部スキップ可能

  6. `git push origin <ブランチ名>`
  7. 次の指摘に進む（CI確認は後でまとめて実施）

- **複数の指摘を対応した後、まとめてCIの状況確認**（推奨）
  - すべての指摘に対応し終わったら、CIの状況を確認する
  - CIの実行には時間がかかるため、1つずつ待つのは非効率
  - 既に完了しているCIの結果を確認し、エラーがあれば対応する

```bash
# 複数の指摘対応後、まとめてCI確認
gh pr checks <PR番号>
# または詳細な情報を取得（完了しているもののみ）
gh pr view <PR番号> --json statusCheckRollup --jq '.statusCheckRollup[] | select(.conclusion != null) | {name: .name, status: .conclusion, url: .detailsUrl}'
```

- **CIが失敗している場合**
  - エラー内容を確認して修正
  - 修正後、再度commit/pushしてCIが成功することを確認

- **全ての指摘への対応が完了したら、必ずGeminiのレビューコメントスレッドに返信する（必須）**
  1. CIの状況を確認（既に完了しているCIの結果を確認）
  2. CIが成功していることを確認
  3. Geminiのレビューコメントを取得してIDを確認
  4. コメントスレッドに返信を投稿

  ```bash
  # 1. CIの状況確認
  gh pr checks <PR番号>

  # 2. Geminiのレビューコメントを確認してIDを取得
  gh api repos/{owner}/{repo}/pulls/<PR番号>/comments --jq '.[] | select(.user.login | contains("gemini")) | {id, body: .body[0:100], path, line}'

  # 例: コメントID 2540860155 が取得できた場合

  # 3. 最新のコミットSHAを取得
  COMMIT_SHA=$(git rev-parse HEAD)

  # 4. Geminiのコメントスレッドに返信を投稿
  gh api repos/{owner}/{repo}/pulls/<PR番号>/comments \
    --method POST \
    --field body="@gemini-code-assist

  ご指摘いただいた点について対応しました。

  ## 修正内容

  1. **[指摘内容のサマリー]**
     - 修正内容: [具体的な修正内容]
     - コミット: [commit hash]

  ## テスト結果

  - ✅ Lint: 成功
  - ✅ ユニットテスト: 全テスト通過
  - ✅ E2Eテスト: 全テスト通過
  - ✅ CI: 成功

  ご確認よろしくお願いいたします。" \
    --field commit_id="$COMMIT_SHA" \
    --field in_reply_to=2540860155
  ```

  **コメントスレッド返信の仕組み**:
  - `in_reply_to`: 返信先のコメントID（Geminiのコメント）
  - `commit_id`: 現在のコミットSHA（必須）
  - これにより、Geminiのコメントスレッドに直接返信される

  **返信内容のポイント**:
  - `@gemini-code-assist`でメンションする
  - 各指摘に対する修正内容を具体的に記載
  - コミットハッシュを明記
  - テスト結果とCI結果を報告
  - 丁寧な言葉遣いで感謝の意を表す

  **注意**:
  - Geminiからの指摘に対応した場合は、**必ず返信すること**
  - **コメントスレッドに返信する**ことで、対応状況が明確になる
  - 複数の指摘がある場合は、それぞれのコメントスレッドに個別に返信する

**禁止事項**:

- ❌ 複数の指摘をまとめて1つのcommitにすること
- ❌ すべての修正をまとめてからcommitすること
- ❌ 修正途中でcommitをスキップすること

**良い例**:

```bash
# 指摘1: accountIdのパスパラメータ修正
git add apps/backend/src/modules/securities/presentation/controllers/securities.controller.ts
git commit -m "fix: Geminiの指摘に対応 - accountIdを@Paramで取得するように修正"
git push origin feature/fr-003-securities-integration

# 指摘2: DTOからaccountIdを削除
git add apps/backend/src/modules/securities/presentation/dto/
git commit -m "fix: Geminiの指摘に対応 - DTOからaccountIdを削除"
git push origin feature/fr-003-securities-integration

# 指摘3: totalProfitLossの計算修正
git add apps/backend/src/modules/securities/domain/entities/securities-account.entity.ts
git commit -m "fix: Geminiの指摘に対応 - totalProfitLossの計算を修正"
git push origin feature/fr-003-securities-integration

# すべての指摘対応後、まとめてCIの状況確認とGeminiへの返信
gh pr checks 153
# 既に完了しているCIの結果を確認
# エラーがあれば対応、成功していればGeminiのレビューコメントに返信

# Geminiのコメントを確認してIDを取得
gh api repos/kencom2400/account-book/pulls/153/comments --jq '.[] | select(.user.login | contains("gemini")) | {id, body: .body[0:100], path}'

# 例: コメントID 2540860155 が見つかった場合

# コミットSHAを取得
COMMIT_SHA=$(git rev-parse HEAD)

# Geminiのコメントスレッドに返信を投稿（必須）
gh api repos/kencom2400/account-book/pulls/153/comments \
  --method POST \
  --field body="@gemini-code-assist

ご指摘いただいた点について対応しました。

## 修正内容

1. **accountIdの取得方法**
   - 修正内容: @Paramデコレータを使用してパスパラメータから取得するように修正
   - コミット: abc1234

2. **DTOの適正化**
   - 修正内容: DTOからaccountIdを削除し、パスパラメータのみで受け取るように変更
   - コミット: def5678

3. **totalProfitLossの計算ロジック**
   - 修正内容: 評価損益の計算式を修正し、正しい損益が算出されるように改善
   - コミット: ghi9012

## テスト結果

- ✅ Lint: 成功
- ✅ ユニットテスト: 全テスト通過
- ✅ E2Eテスト: 全テスト通過
- ✅ CI: 成功

ご確認よろしくお願いいたします。" \
  --field commit_id="$COMMIT_SHA" \
  --field in_reply_to=2540860155
```

**悪い例**:

```bash
# ❌ 複数の指摘をまとめて修正
git add .
git commit -m "fix: Geminiの指摘に対応"
git push
```

- 提案内容をコミットメッセージに記載する
  - 例：`fix: Geminiの指摘に対応 - accountIdを@Paramで取得するように修正`
  - 例：`fix: Geminiの指摘に対応 - エラーハンドリングを追加`

#### 5-3. 対応完了の報告（必須）

すべての指摘に対応し終わったら、以下を実施する：

1. **CIの状況を確認する**
   - 既に完了しているCIの結果を確認
   - エラーがあれば対応する

   ```bash
   gh pr checks <PR番号>
   # または詳細な情報を取得
   gh pr view <PR番号> --json statusCheckRollup --jq '.statusCheckRollup[] | select(.conclusion != null) | {name: .name, status: .conclusion, url: .detailsUrl}'
   ```

2. **CIが成功していることを確認**

3. **Geminiのレビューコメントスレッドに返信を投稿（必須）**

   ```bash
   # Geminiのコメントを確認してIDを取得
   gh api repos/{owner}/{repo}/pulls/<PR番号>/comments --jq '.[] | select(.user.login | contains("gemini")) | {id, body: .body[0:100], path}'

   # 例: コメントID 2540860155 が取得できた場合

   # コミットSHAを取得
   COMMIT_SHA=$(git rev-parse HEAD)

   # Geminiのコメントスレッドに返信を投稿
   gh api repos/{owner}/{repo}/pulls/<PR番号>/comments \
     --method POST \
     --field body="@gemini-code-assist

   ご指摘いただいた点について対応しました。

   ## 修正内容

   1. **[指摘内容のサマリー]**
      - 修正内容: [具体的な修正内容]
      - コミット: [commit hash]

   ## テスト結果

   - ✅ Lint: 成功
   - ✅ ユニットテスト: 全テスト通過
   - ✅ E2Eテスト: 全テスト通過
   - ✅ CI: 成功

   ご確認よろしくお願いいたします。" \
     --field commit_id="$COMMIT_SHA" \
     --field in_reply_to=2540860155
   ```

   **コメントスレッド返信の重要性**:
   - `in_reply_to`フィールドを使用することで、Geminiのコメントスレッドに直接返信される
   - PRコメントとは異なり、対応状況が該当の指摘と紐付けられて明確になる
   - 複数の指摘がある場合は、それぞれのコメントスレッドに個別に返信する

**重要**:

- Geminiからの指摘に対応した場合は、**必ずコメントスレッドに返信すること**
- 通常のPRコメントではなく、**レビューコメントのスレッドに返信する**
- 返信がないと、対応が完了したかどうかが不明確になる

#### 5-4. 再発防止策の実施（重要）

Geminiからの指摘を受けた場合、**必ず以下を実施すること**：

1. **指摘内容の分析**
   - 指摘の根本原因を特定
   - 同様の問題が他の箇所にないか確認
   - なぜその問題が発生したのかを理解

2. **チェックリストの更新**
   - `.cursor/rules/code-quality-checklist.md`を確認
   - 該当する項目がない場合は追加
   - 具体的な悪い例・良い例を記載

3. **関連ルールの更新**
   - `project.md`、`test.md`等の関連ルールも必要に応じて更新
   - より明確な指示を追加
   - AIアシスタントが理解しやすい表現に改善

4. **ルール更新のコミット**

   ```bash
   git add .cursor/rules/
   git commit -m "docs: Geminiの指摘から学んだ教訓をルールに追加

   指摘内容:
   - [具体的な指摘内容]

   再発防止策:
   - [追加したルール内容]

   更新ファイル:
   - code-quality-checklist.md: [追加内容]
   - project.md: [修正内容]"
   git push origin <branch-name>
   ```

5. **Geminiへの返信コメントに再発防止策を含める**
   - 対応完了コメントに「再発防止策を実施」と記載
   - 更新したルールファイルとコミットハッシュを明記

**返信コメントの例**:

```bash
# Geminiのコメントを確認してIDを取得
gh api repos/kencom2400/account-book/pulls/<PR番号>/comments --jq '.[] | select(.user.login | contains("gemini")) | {id, body: .body[0:100], path}'

# コミットSHAを取得
COMMIT_SHA=$(git rev-parse HEAD)

# コメントスレッドに返信
gh api repos/kencom2400/account-book/pulls/<PR番号>/comments \
  --method POST \
  --field body="@gemini-code-assist

ご指摘いただいた点について対応しました。

## 修正内容

1. **Enum型の比較方法**
   - 修正内容: Object.entriesの戻り値を明示的に[BankCategory, string][]型にキャスト
   - コミット: abc1234

## テスト結果

- ✅ Lint: 成功（@typescript-eslint/no-unsafe-enum-comparison警告を解消）
- ✅ ユニットテスト: 44テスト全て通過
- ✅ E2Eテスト: 全テスト通過
- ✅ CI: 成功

## 再発防止策

今回の指摘を踏まえ、以下のルールを更新しました：

- \`.cursor/rules/code-quality-checklist.md\`: Enum型の型安全な比較手法を追加（コミット: def5678）
  - 悪い例と良い例を具体的に記載
  - 実装チェックリストに項目を追加
  - Geminiレビューから学んだ教訓セクションに追加

これにより、今後同様の問題が発生することを防ぎます。

ご確認よろしくお願いいたします。" \
  --field commit_id="$COMMIT_SHA" \
  --field in_reply_to=<GeminiのコメントID>
```

**AIアシスタントへの指示**:

- Geminiの指摘対応時は、**必ず**このステップを実行
- 指摘内容を深く理解し、根本原因を特定
- チェックリストに追加すべき項目がないか検討
- ルール更新は別コミットとして実施（対応コミットと分離）
- **CIが成功していることを確認してから、必ずGeminiのレビューコメントスレッドに返信する**
- 返信には修正内容、テスト結果、再発防止策を含める
- `in_reply_to`フィールドを使用してコメントスレッドに直接返信する
- 通常のPRコメント（`gh pr comment`）ではなく、レビューコメントAPI（`gh api repos/{owner}/{repo}/pulls/{PR番号}/comments`）を使用する

### 6. CI (lint, test, build)の確認と対応（自動実行）

PR作成後、以下の手順を自動的に実行する：

#### 6-1. CIステータスの確認

```bash
# PRのCI実行状況を確認（30〜60秒待機してから実行）
sleep 45
gh pr checks <PR番号>

# 実行結果の例:
# lint   pass  37s  https://...
# test   pass  47s  https://...
# build  pass  1m13s https://...
```

#### 6-2. エラー発生時の原因究明

CIでエラーが発生した場合、以下を実施：

**1. エラーログの取得**

```bash
# 失敗したCIのログを確認
gh run view <run-id> --log-failed

# 特定のジョブのログを確認
gh run view <run-id> --log-failed | grep -A 30 "lint.*Run pnpm lint"
```

**2. 原因の特定**

- 今回の修正で新しく発生したエラーか？
- 既存のコードベースに元々存在していたエラーか？

**判断基準**:

- 修正したファイルに関連するエラー → 自身の修正が原因
- 修正していないファイルのエラー → 既存のエラー
- エラーの内容が今回の変更内容と直接関係 → 自身の修正が原因

#### 6-3. 対応方針

**A. 自身の修正で発生したエラーの場合**

✅ **即座に解決する**

1. ローカルで同じエラーを再現

   ```bash
   # lintエラーの場合
   pnpm lint

   # testエラーの場合
   pnpm test:unit

   # buildエラーの場合
   pnpm build
   ```

2. エラーを修正

3. ローカルで確認

   ```bash
   pnpm lint
   pnpm test:unit
   pnpm build
   ```

4. コミット & プッシュ

   ```bash
   git add .
   git commit -m "fix(ci): [エラー内容の簡潔な説明]"
   git push
   ```

5. 再度CIを確認

**B. 既存のエラーである場合**

✅ **Bugのissueを作成する**

1. issueを作成

   ```bash
   gh issue create \
     --title "[BUG] [CI名]で[エラー数]個のエラー/警告が発生" \
     --label "bug,infrastructure,priority: high" \
     --body "[詳細な内容]"
   ```

2. issue内容に以下を記載：
   - エラーの概要（件数、種類）
   - 発生箇所（ファイル名、行数）
   - エラーログの例
   - 修正方針（段階的な対応計画）
   - 達成条件（「○○ CIのエラーが0件になる」）

3. issueをGitHub Projectsに追加

   ```bash
   gh project item-add 1 --owner kencom2400 --url <issue_url>
   ```

4. PRにコメントを追加して既存エラーであることを説明

   ```bash
   gh pr comment <PR番号> --body "## CI実行結果

   ✅ **test**: Pass
   ✅ **build**: Pass
   ⚠️ **lint**: Fail (既存のlintエラー約XXX個、今回の修正とは無関係)

   既存のlintエラーは Issue #XXX として別途対応します。"
   ```

#### 6-4. CI確認の完了報告

すべてのCIが成功、または既存エラーへの対応が完了したら、ユーザーに報告する：

```
## ✅ CI実行結果

すべての主要なCIが成功しました！

### 結果
✅ **test**: Pass (XX秒)
✅ **build**: Pass (XX秒)
✅ **lint**: Pass (XX秒)

または

✅ **test**: Pass (XX秒)
✅ **build**: Pass (XX秒)
⚠️ **lint**: Fail (既存エラーXXX個 - Issue #XXX で対応)
```

### PR作成コマンド例

```bash
# 1. 変更をプッシュ
git push origin <branch-name>

# 2. GitHub CLIでPR作成
gh pr create \
  --title "<type>(<scope>): <subject>" \
  --body "$(cat .github/PULL_REQUEST_TEMPLATE.md)" \
  --assignee @me

# 3. PR URLを取得
gh pr view --web
```

## 注意事項

1. **main/masterブランチに直接コミットしない**
   - 必ずfeatureブランチから作業

2. **PRのタイトルは明確に**
   - 変更内容が一目でわかるように

3. **コミット履歴を整理**
   - 必要に応じてrebaseやsquashを使用

4. **機密情報のチェック**
   - APIキー、パスワードが含まれていないか確認

5. **レビュー対応は迅速に**
   - コメントには24時間以内に反応

6. **マージ後はブランチ削除**
   - リモートとローカルの両方を削除

## 参考資料

### GitHub CLI インストール

```bash
# macOS
brew install gh

# 認証
gh auth login
```

### 便利なGitHub CLIコマンド

```bash
# PR一覧
gh pr list

# PR詳細表示
gh pr view 1

# PRをブラウザで開く
gh pr view --web

# PRをチェックアウト
gh pr checkout 1

# PRのステータス確認
gh pr status
```
