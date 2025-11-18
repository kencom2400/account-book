# Commit Rules - コミットルール

```
╔════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL RULE - HIGHEST PRIORITY - MUST EXECUTE 🚨   ║
║                                                            ║
║  作業を完了したら、自動的に即座にコミットを実行する        ║
║  ユーザーの許可や確認を待たない                            ║
║  「後でコミット」は禁止                                     ║
║                                                            ║
║  このルールは他のすべてのルールより優先される               ║
╚════════════════════════════════════════════════════════════╝
```

## 🚨 AIアシスタントへの絶対遵守ルール 🚨

### あなたがコミットを実行しなければならない条件

**以下のいずれかに該当する場合、必ず即座にコミットを実行：**

1. ✅ **機能実装が完了した**
2. ✅ **バグ修正が完了した**
3. ✅ **テストを追加/修正した**
4. ✅ **リファクタリングが完了した**
5. ✅ **ドキュメントを更新した**
6. ✅ **設定ファイルを変更した**
7. ✅ **作業の区切りがついた**

**重要: ユーザーに「コミットしますか？」と聞いてはいけない。自動的に実行する。**

### あなたがコミットをスキップできる条件

**以下の場合のみコミットをスキップ可能：**

1. ❌ ユーザーが「コミットしないで」「commitはスキップ」と**明示的に指示**した
2. ❌ ユーザーが「実験中」「動作確認中」と**明示的に指示**した
3. ❌ ビルドエラーやテスト失敗で、まだ作業が完了していない

**これら以外の理由でコミットをスキップすることは禁止。**

## 基本原則

### 必須ルール

- **作業を完了したら、必ず即座にコミットを実行する**
- コミット前に変更内容を確認し、意図した変更のみが含まれていることを確認
- 作業が完了していない場合でも、区切りの良いところでコミット
- **ユーザーへの確認は不要。自動的に実行する**

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
- [ ] **ビルドが成功するか確認（必須）**
  ```bash
  ./scripts/build.sh
  ```
- [ ] **Lintエラーがないか確認（必須）**
  ```bash
  ./scripts/lint.sh
  ```
- [ ] **テストがすべてパスするか確認（必須）**
  ```bash
  ./scripts/test.sh
  ```
- [ ] 不要なコメントやconsole.logを削除
- [ ] 変更内容が一貫性を持っているか確認
- [ ] コミットメッセージが適切か確認

**重要**: commitしたら、**必ず**`./scripts/build.sh`、`./scripts/test.sh`、`./scripts/lint.sh`、`./scripts/test/test-e2e.sh`を実行してエラーが無いことを確認すること。エラーがある場合は、修正してから再度commitすること。

### push前のチェックリスト

**重要**: 以下のチェックは、**CIが実行されるファイル（コードファイル）を変更した場合のみ必須**です。CIが実行されないファイル（ドキュメント、設定ファイルなど）のみの変更の場合は不要です。

**CIが実行されるファイルの例：**

- `apps/**/*.{ts,tsx,js,jsx}` - アプリケーションコード
- `libs/**/*.{ts,tsx,js,jsx}` - ライブラリコード
- `*.{ts,tsx,js,jsx}` - ルートのコードファイル
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` - 依存関係とパッケージ管理設定
- `tsconfig.json`, `tsconfig.*.json` - TypeScript設定ファイル
- `eslint.config.*`, `.eslintrc.*` - ESLint設定ファイル
- `turbo.json` - Turbo（モノレポ）設定ファイル
- `.github/workflows/**` - GitHub Actionsワークフローファイル
- `jest.config.*`, `jest.setup.*` - Jest設定ファイル
- `next.config.*`, `nest-cli.json` - フレームワーク設定ファイル
- `.prettierrc*`, `.prettierignore` - Prettier設定ファイル
- `.gitignore` - Git設定ファイル
- `scripts/**/*.sh` - ビルド/テスト/デプロイスクリプト
- その他のビルド/設定ファイル（`.nvmrc`, `.node-version`, `postcss.config.*`, `tailwind.config.*` など）

**CIが実行されないファイルの例：**

- `*.md` - ドキュメントファイル
- `.cursor/**` - Cursor設定ファイル
- `docs/**` - ドキュメントディレクトリ

**コードファイルを変更した場合、pushする前に以下を実行してエラーがないことを確認すること：**

1. **ビルドが成功するか確認（必須）**

   ```bash
   ./scripts/build.sh
   ```

   - フロントエンドとバックエンドの両方が正常にビルドできることを確認

2. **ユニットテストがすべてパスするか確認（必須）**

   ```bash
   ./scripts/test.sh
   ```

   - すべてのユニットテストが成功することを確認

3. **E2Eテストがすべてパスするか確認（必須）**

   ```bash
   ./scripts/test/test-e2e.sh
   ```

   - すべてのE2Eテストが成功することを確認

4. **Lintエラーがないか確認（必須）**

   ```bash
   ./scripts/lint.sh
   ```

   - フロントエンドとバックエンドの両方でlintエラーがないことを確認

**重要**: コードファイルを変更した場合、pushする前に**必ず**`./scripts/build.sh`、`./scripts/test.sh`、`./scripts/test/test-e2e.sh`、`./scripts/lint.sh`を実行してエラーが無いことを確認すること。エラーがある場合は、修正してからpushすること。

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

### 🔴 絶対禁止事項

**以下の行動は絶対に禁止：**

1. ❌ **「コミットしますか？」とユーザーに確認する**
   - 理由: 自動実行が原則。確認は不要
2. ❌ **「後でコミットします」と言って先送りする**
   - 理由: 必ず即座に実行する
3. ❌ **複数の異なる作業を1つのcommitにまとめる**
   - 理由: 各作業は個別にコミット
4. ❌ **作業完了後、最後にまとめてcommitする**
   - 理由: 作業ごとに小さくコミット

### ✅ 正しい動作例

```
例1: 機能実装完了時
AIアシスタント:
「FR-004の実装が完了しました。
[自動的にgit add & git commitを実行]
✅ コミット完了: feat(backend): FR-004実装」

❌ 間違った例:
「FR-004の実装が完了しました。コミットしますか？」← これは禁止
```

```
例2: ユーザーからコミット要求があった時
ユーザー: 「コミットしてください」
AIアシスタント:
「承知しました。
[即座にgit add & git commitを実行]
✅ コミット完了」

❌ 間違った例:
「承知しました。では、コミットメッセージは...」← 黙って実行する
```

### ⚠️ 例外: コミットをスキップできる場合

**ユーザーが以下のように明示的に指示した場合のみスキップ可能：**

- 「コミットしないで」
- 「commitはスキップ」
- 「まだコミット不要」
- 「実験中なのでコミットしない」

**それ以外の場合は、必ず自動的にコミットを実行する。**

### commit message作成

- 上記テンプレートに従って作成
- 日本語で簡潔に記述
- Issueがある場合は`Closes #XX`を追記

## コミットパフォーマンス監視

### 基本ルール

**コミット実行時間が30秒を超える場合は、必ず原因調査を実施する**

### 監視手順

1. **タイムアウト付きでコミット実行**

   ```bash
   timeout 30 git commit -m "commit message"
   ```

2. **30秒でタイムアウトした場合**
   - コミットを一旦中断
   - 以下の調査を実施

### 調査項目

#### 1. pre-commitフックの確認

```bash
# フック実行内容を確認
cat .husky/pre-commit

# lint-staged設定を確認
cat package.json | grep -A 20 "lint-staged"
```

**よくある原因：**

- lint-stagedで大量のファイルをlint処理
- bash -c によるシェル起動オーバーヘッド
- 不適切なESLint設定ファイルの参照
- typeチェック付きルールでparserOptions不足

#### 2. ステージングファイル数の確認

```bash
# ステージング済みファイルを確認
git diff --cached --stat

# ファイル数が多すぎる場合は分割を検討
```

**目安：**

- 20ファイル未満: 通常は問題なし
- 20-50ファイル: 注意が必要
- 50ファイル以上: コミット分割を推奨

#### 3. lint-staged実行の最適化

**問題のある設定例：**

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "bash -c 'cd apps/backend && eslint --fix'", // ❌ 遅い
      "prettier --write"
    ]
  }
}
```

**最適化された設定例：**

```json
{
  "lint-staged": {
    "apps/backend/**/*.{ts,tsx}": [
      "eslint --config apps/backend/eslint.config.mjs --fix", // ✅ 速い
      "prettier --write"
    ],
    "apps/frontend/**/*.{ts,tsx,js,jsx}": [
      "eslint --config apps/frontend/eslint.config.js --fix",
      "prettier --write"
    ]
  }
}
```

**最適化のポイント：**

- **❌ 絶対に`bash -c`を使わない**（シェル起動のオーバーヘッドでコミットが30秒以上かかる）
- `--config`で明示的に設定ファイルを指定
- ディレクトリごとにパターンを分割
- 各ディレクトリの適切な設定ファイルを使用

#### 4. ESLint設定の確認

**typeチェックルールを使う場合の必須設定：**

```javascript
{
  languageOptions: {
    parserOptions: {
      projectService: true,  // これがないとtypeチェックルールでエラー
      tsconfigRootDir: import.meta.dirname,
    },
  },
}
```

**テストファイルの設定：**

```javascript
{
  files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    // テストではany型を許可してパフォーマンス向上
  },
}
```

### 対処手順

#### ケース1: lint-stagedが原因

1. lint-staged設定を最適化（上記参照）
2. 設定変更をコミット
3. 再度元のコミットを試行

#### ケース2: 大量ファイルが原因

1. コミットを論理的な単位で分割
2. 各単位ごとに個別にコミット
3. 必要に応じてlint-stagedを一時的に無効化
   ```bash
   SKIP=lint-staged git commit -m "message"
   ```

#### ケース3: ESLint設定が原因

1. エラーメッセージを確認
2. 適切なparserOptionsを追加
3. テストファイルのルールを緩和
4. 設定変更をコミット

### 予防策

1. **定期的な小さいコミット**
   - 大量の変更を蓄積しない
   - 機能単位で細かくコミット

2. **lint-staged設定のレビュー**
   - 新規ディレクトリ追加時に設定を確認
   - パフォーマンステストを実施

3. **pre-commitフックの軽量化**
   - 必要最小限のチェックのみ実行
   - 重い処理はCIに移行

### 🚫 絶対禁止事項

#### lint-stagedでの`bash -c`使用禁止

**禁止:**

```json
"lint-staged": {
  "apps/frontend/**/*.{ts,tsx}": [
    "bash -c 'cd apps/frontend && eslint --fix'",  // ❌ 絶対に使用禁止
    "prettier --write"
  ]
}
```

**理由:**

- シェル起動のオーバーヘッドでコミットが30秒以上かかる
- 複数ファイルで各ファイルごとにシェルが起動される
- パフォーマンスが劇的に悪化する

**正しい方法:**

```json
"lint-staged": {
  "apps/frontend/src/**/*.{ts,tsx}": [
    "eslint --fix",  // ✅ 直接実行
    "prettier --write"
  ]
}
```

**代替手段:**

- 対象ディレクトリをglobで制限 (`src/**`)
- `.eslintignore`でビルド成果物を除外
- `--config`オプションで設定ファイルを明示
- ディレクトリ移動が必要な場合はスクリプト全体を見直す

### 報告フォーマット

コミットが遅い場合、以下の情報をユーザーに報告：

```
⚠️ コミット実行に30秒以上かかっています。調査を実施します。

【調査結果】
- ステージングファイル数: XX件
- 検出された問題: [lint-staged設定/ESLint設定/ファイル数]
- 推奨対策: [具体的な対策]

【実施する対応】
1. [対応内容1]
2. [対応内容2]
```
