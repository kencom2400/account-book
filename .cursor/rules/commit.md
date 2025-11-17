# Commit Rules - コミットルール

## 基本原則

### 必須ルール

- **チャットで一つの作業を完了したら、必ずコミットを実行する**
- コミット前に変更内容を確認し、意図した変更のみが含まれていることを確認
- 作業が完了していない場合でも、区切りの良いところでコミット

## コミットメッセージテンプレート

### 基本フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）

変更の種類を表す接頭辞：

| Type       | 説明                                       | 使用例                                           |
| ---------- | ------------------------------------------ | ------------------------------------------------ |
| `feat`     | 新機能の追加                               | `feat(transaction): 取引履歴取得APIを実装`       |
| `fix`      | バグ修正                                   | `fix(balance): 残高計算のロジックを修正`         |
| `refactor` | リファクタリング                           | `refactor(repository): リポジトリパターンに変更` |
| `docs`     | ドキュメント変更                           | `docs(readme): セットアップ手順を追加`           |
| `style`    | コードスタイル修正（空白、フォーマット等） | `style(api): lintエラーを修正`                   |
| `test`     | テストの追加・修正                         | `test(usecase): ユースケースのテストを追加`      |
| `chore`    | ビルド・設定ファイルの変更                 | `chore(deps): 依存関係を更新`                    |
| `perf`     | パフォーマンス改善                         | `perf(query): クエリ処理を最適化`                |
| `ci`       | CI/CD関連の変更                            | `ci(github): GitHub Actionsを設定`               |
| `revert`   | 以前のコミットを取り消し                   | `revert: feat(transaction)の変更を取り消し`      |

### Scope（オプション）

変更の影響範囲を表す：

**アーキテクチャレイヤ：**

- `domain` - ドメイン層
- `application` - アプリケーション層
- `infrastructure` - インフラ層
- `presentation` - プレゼンテーション層

**機能モジュール：**

- `transaction` - 取引関連
- `account` - 口座関連
- `category` - カテゴリ関連
- `balance` - 残高関連
- `report` - レポート・集計関連
- `auth` - 認証関連
- `api` - API連携
- `ui` - UI関連

### Subject（必須）

- 変更内容を簡潔に説明（50文字以内推奨）
- 日本語または英語で記述
- 命令形で記述（「追加する」ではなく「追加」）
- 文末にピリオドを付けない

### Body（オプション）

- 変更の理由や背景を詳細に説明
- WHATとWHYを記述（HOWはコードを見ればわかる）
- 72文字で改行

### Footer（オプション）

- Breaking Changes（破壊的変更）を記載
- Issue番号への参照（例：`Refs: #123`, `Closes: #456`）

## コミットメッセージ例

### 良い例

```
feat(transaction): 取引履歴取得機能を実装

金融機関APIから取引履歴を取得し、
ローカルにJSON形式で保存する機能を追加。

- BankApiClientの実装
- TransactionRepositoryの実装
- 取引データのバリデーション追加
```

```
fix(balance): クレジットカード残高計算のバグを修正

振替処理が二重計上されていた問題を修正。
支出と振替の区別を明確化。

Closes: #42
```

```
refactor(domain): エンティティをOnion Architectureに準拠

ドメイン層の依存関係を整理し、
外部レイヤへの依存を削除。
```

```
docs(architecture): Onion Architectureの設計方針を追加

レイヤ構成とディレクトリ構造の
ドキュメントを更新。
```

```
chore(setup): プロジェクト初期設定

- モノレポ構成の作成
- pnpmワークスペースの設定
- ESLint/Prettierの導入
```

### 避けるべき例

❌ `update` - 何を更新したか不明
❌ `fix bug` - どのバグを修正したか不明
❌ `WIP` - 作業中のコミットは避ける（やむを得ない場合は後でrebase）
❌ `aaa` - 意味不明なメッセージ
❌ `いろいろ修正` - 具体性がない

## コミットのタイミング

### 推奨タイミング

1. ✅ 新機能の実装が完了した時
2. ✅ バグ修正が完了した時
3. ✅ リファクタリングが完了した時
4. ✅ テストが追加・修正された時
5. ✅ ドキュメントが更新された時
6. ✅ 設定ファイルが変更された時
7. ✅ チャットでの一つの作業単位が完了した時

### コミット前のチェックリスト

- [ ] コードが正しく動作するか確認
- [ ] Lintエラーがないか確認
- [ ] 不要なコメントやconsole.logを削除
- [ ] 変更内容が一貫性を持っているか確認
- [ ] コミットメッセージが適切か確認

## Gitコマンド例

### 基本的なコミットフロー

```bash
# 変更を確認
git status
git diff

# ファイルをステージング
git add <file>
# または全ての変更をステージング
git add .

# コミット
git commit -m "feat(transaction): 取引履歴取得機能を実装"

# 詳細なメッセージの場合
git commit
# エディタが開くので、テンプレートに従って記述
```

### コミット後の確認

```bash
# コミット履歴を確認
git log --oneline -10

# 最新のコミット内容を確認
git show
```

## 注意事項

1. **破壊的変更は明示する**
   - Breaking Changeがある場合は、footerに`BREAKING CHANGE:`を記載

2. **一つのコミットに一つの変更**
   - 複数の機能を同時にコミットしない
   - 関連性のない変更は分割してコミット

3. **コミットメッセージは未来の自分へのメッセージ**
   - 数ヶ月後に見返しても理解できる内容にする

4. **機密情報は絶対にコミットしない**
   - APIキー、パスワード、トークンなどは含めない
   - `.gitignore`で除外されていることを確認

5. **force pushは慎重に**
   - main/masterブランチへのforce pushは禁止
   - 他の人と共有しているブランチでは避ける

## AIアシスタントへの必須ルール

### 🚨 必ず守るべきコミットタイミング

**重要**: 以下のタイミングで**必ず即座に**commitを実行すること。最後にまとめてcommitすることは**絶対に禁止**。

#### 1. ドキュメント・設定ファイルの変更後

- `.cursor/rules/`内のファイル変更
- `README.md`、その他ドキュメント更新
- 設定ファイル（`.eslintrc`、`tsconfig.json`等）の変更
- **→ 即座にcommit**

#### 2. スクリプト・ツールの修正後

- `scripts/`内のスクリプト修正
- ビルド・デプロイスクリプトの変更
- **→ 即座にcommit**

#### 3. Domain層の実装後

- Entityの作成（1つのEntityごと）
- Value Objectの作成
- Repositoryインターフェースの定義
- **→ 各レイヤの実装完了時にcommit**

#### 4. Application層の実装後

- UseCaseの実装（1つのUseCaseごと、または関連する複数のUseCaseをまとめて）
- **→ 実装とテスト完了時にcommit**

#### 5. Infrastructure層の実装後

- Repositoryの実装
- 外部APIクライアントの実装
- **→ 実装完了時にcommit**

#### 6. Presentation層の実装後

- Controllerの実装
- DTOの作成
- **→ 実装完了時にcommit**

#### 7. Module統合時

- `app.module.ts`への登録
- Module間の連携設定
- **→ 即座にcommit**

#### 8. テスト作成後

- ユニットテスト作成
- E2Eテスト作成
- **→ テストがパスしたらcommit**

#### 9. Lint/フォーマット修正後

- Lintエラー修正
- Prettierによる自動修正
- **→ 即座にcommit**

### 大きな機能実装時の分割戦略

**例**: 証券会社連携機能（FR-003）の場合

```bash
# ❌ 悪い例: 最後にまとめて1つのcommit
# すべて実装してから
git add .
git commit -m "feat: 証券会社連携機能の実装"

# ✅ 良い例: 作業ごとに複数のcommit
git add .cursor/rules/
git commit -m "docs: Cursorルールの更新"

git add scripts/set-issue-in-progress.sh
git commit -m "fix: スクリプトのバグ修正"

git add apps/backend/src/modules/securities/domain/
git commit -m "feat(domain): Securities Domain層の実装"

git add apps/backend/src/modules/securities/application/
git commit -m "feat(application): Securities Application層の実装"

git add apps/backend/src/modules/securities/infrastructure/
git commit -m "feat(infrastructure): Securities Infrastructure層の実装"

git add apps/backend/src/modules/securities/presentation/
git commit -m "feat(presentation): Securities Presentation層の実装"

git add apps/backend/src/modules/securities/**/*.spec.ts
git commit -m "test(securities): ユニットテストの追加"

git add apps/backend/test/securities.e2e-spec.ts
git commit -m "test(securities): E2Eテストの追加"

git add apps/backend/src/app.module.ts
git commit -m "feat: SecuritiesModuleの統合"
```

### commitの実行手順

作業を完了したら、**必ず即座に**以下を実行する：

```bash
# 1. 変更内容を確認
git status
git diff

# 2. 適切なファイルをステージング
git add <files>

# 3. commitを実行（required_permissions: ["all"] または ["git_write"] を指定）
git commit -m "<type>(<scope>): <subject>"

# 4. commit完了をユーザーに報告
```

### 🔴 禁止事項

1. **最後にまとめてcommit** - 絶対に禁止
2. **「後でcommitします」** - 禁止。必ず即座に実行
3. **ユーザーへの確認待ち** - commitに関してはユーザーの許可は不要。自動的に実行
4. **複数の異なる作業を1つのcommitにまとめる** - 禁止

### 例外

以下の場合**のみ**commitをスキップ可能：

- ユーザーが明示的に「コミットしないで」「commitはスキップ」と指示した場合
- 実験的なコードで動作確認中の場合（ユーザーが指示）

### commit message作成

- 上記テンプレートに従って作成
- 日本語で簡潔に記述
- Issueがある場合は`Closes #XX`を追記
