# Pull Request Rules - プルリクエストルール

## 基本原則

### 必須ルール

- **チャットでPR作成を希望された場合、必ずPRを作成する**
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

### 3. プッシュ

```bash
# リモートにプッシュ
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

```bash
# コメントを取得
gh pr view <PR番号> --comments

# インラインコメントを取得
gh api repos/<owner>/<repo>/pulls/<PR番号>/comments
```

#### 5-2. 提案への対応

- Gemini Code Assistから提案があった場合は、その内容を確認し対応する
- 提案が妥当な場合は、コードを修正してコミット・プッシュする
- 提案内容をコミットメッセージに記載する
  - 例：`refactor: Geminiの提案に従ってfind_pnpm関数を改善`
  - 例：`fix: Geminiの指摘によりエラーハンドリングを追加`

#### 5-3. 対応完了の報告

- 修正が完了したら、該当のコメントに返信する

```bash
gh pr comment <PR番号> --body "## Geminiの提案に対応しました ✅

ご提案いただいた改善点を実施しました：

### 修正内容
1. [具体的な修正内容]

提案いただいた改善により、[改善された点]になりました。ありがとうございました！

コミット: [commit hash]"
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
