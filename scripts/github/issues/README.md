# Issue作成ガイド

## 概要

汎用Issue作成スクリプト（`create-issue.sh`）を使用して、データファイル（YAML/JSON）からGitHub Issueを作成します。

## 必要なツール

### 必須

- `gh` (GitHub CLI) - Issue作成に必要

  ```bash
  # macOS
  brew install gh

  # Linux
  sudo apt install gh

  # 認証
  gh auth login
  ```

### YAMLファイルを使用する場合

- `yq` (YAMLパーサー)

  ```bash
  # macOS
  brew install yq

  # Linux
  snap install yq
  ```

### JSONファイルを使用する場合

- `jq` (JSONパーサー) - 通常プリインストール済み

  ```bash
  # macOS
  brew install jq

  # Linux
  apt-get install jq
  ```

## 使い方

### 1. テンプレートからデータファイルを作成

```bash
# テンプレートをコピー（draftsディレクトリに）
cp issue-data/templates/feature.yml.example issue-data/drafts/my-feature.yml

# または、ドラフトファイルとして保存（-draftサフィックス）
cp issue-data/templates/feature.yml.example issue-data/my-feature-draft.yml
```

### 2. データファイルを編集

お好みのエディタでファイルを編集します：

```bash
# vim
vim issue-data/drafts/my-feature.yml

# VSCode
code issue-data/drafts/my-feature.yml
```

### 3. Issueを作成

```bash
# YAMLファイルから作成
./create-issue.sh issue-data/drafts/my-feature.yml

# JSONファイルから作成
./create-issue.sh issue-data/drafts/my-feature.json
```

### 4. 完了！

Issue番号とURLが表示されます。自動的にプロジェクトボードにも追加されます。

## ファイル命名規則

### Gitに含めない（自動除外される）

以下のファイルは`.gitignore`により自動的に除外されます：

- **draftsディレクトリ内のすべてのファイル**
  - `issue-data/drafts/*`
- **ドラフトサフィックス**
  - `*-draft.yml`, `*-draft.yaml`, `*-draft.json`
- **作業中サフィックス**
  - `*-wip.yml`, `*-wip.yaml`, `*-wip.json`
- **一時ファイルサフィックス**
  - `*-temp.yml`, `*-temp.yaml`, `*-temp.json`
  - `*-tmp.yml`, `*-tmp.yaml`, `*-tmp.json`

### Gitに含める（必要に応じて）

再利用可能なIssueデータは通常のファイル名で保存すると、Git管理されます：

```bash
# 例: 再利用可能なIssueデータ
issue-data/mysql-migration.yml
issue-data/e2e-implementation.yml
issue-data/docker-dev-env.yml
```

## テンプレート一覧

### 利用可能なテンプレート

1. **feature.yml.example** - 新機能実装用
   - 機能の追加や実装に使用
2. **bug.yml.example** - バグ修正用
   - バグの報告と修正に使用
3. **refactor.yml.example** - リファクタリング用
   - コードの整理や改善に使用
4. **infrastructure.yml.example** - インフラ・環境構築用
   - Docker、CI/CD、デプロイ設定などに使用
5. **testing.yml.example** - テスト関連用
   - テストの実装や改善に使用
6. **documentation.yml.example** - ドキュメント用
   - ドキュメントの作成や更新に使用

### テンプレートの使用方法

```bash
# 1. 使用したいテンプレートをコピー
cp issue-data/templates/feature.yml.example issue-data/drafts/new-api-draft.yml

# 2. 内容を編集
vim issue-data/drafts/new-api-draft.yml

# 3. Issue作成
./create-issue.sh issue-data/drafts/new-api-draft.yml
```

## データファイルの構造

### YAML形式

```yaml
title: '[type] タイトル'
labels:
  - label1
  - label2
  - 'priority: high'
  - 'size: M'
body: |
  ## 概要
  Issue本文をマルチラインで記載

  ## 背景
  詳細な内容

  ## チェックリスト
  - [ ] タスク1
  - [ ] タスク2
```

### JSON形式

```json
{
  "title": "[type] タイトル",
  "labels": ["label1", "label2", "priority: high", "size: M"],
  "body": "## 概要\\nIssue本文\\n\\n## 背景\\n詳細な内容"
}
```

### 利用可能なラベル

プロジェクトで定義されているラベルは `.github/labels.yml` を参照してください。

主なラベル：

- **タイプ**: `feature`, `bug`, `refactor`, `infrastructure`, `testing`, `documentation`
- **領域**: `backend`, `frontend`, `library`, `database`, `api`
- **優先度**: `priority: critical`, `priority: high`, `priority: medium`, `priority: low`
- **サイズ**: `size: XS`, `size: S`, `size: M`, `size: L`, `size: XL`

## 実践例

### 例1: 新機能の実装

```bash
# 1. テンプレートをコピー
cp issue-data/templates/feature.yml.example issue-data/drafts/user-auth-draft.yml

# 2. 編集（タイトル、ラベル、本文を変更）
vim issue-data/drafts/user-auth-draft.yml

# 3. Issue作成
./create-issue.sh issue-data/drafts/user-auth-draft.yml
```

### 例2: バグ修正

```bash
# 1. テンプレートをコピー
cp issue-data/templates/bug.yml.example issue-data/drafts/login-error-draft.yml

# 2. 編集（再現手順、スクリーンショットなどを記載）
vim issue-data/drafts/login-error-draft.yml

# 3. Issue作成
./create-issue.sh issue-data/drafts/login-error-draft.yml
```

### 例3: 既存データから類似Issueを作成

```bash
# 1. 既存のYAMLをコピー
cp issue-data/mysql-migration.yml issue-data/drafts/postgresql-migration-draft.yml

# 2. 必要な箇所を編集
vim issue-data/drafts/postgresql-migration-draft.yml

# 3. Issue作成
./create-issue.sh issue-data/drafts/postgresql-migration-draft.yml
```

## トラブルシューティング

### yqコマンドが見つからない

```bash
# macOS
brew install yq

# Linux
snap install yq
```

または、JSONファイルを使用してください（yqなしで動作）。

### jqコマンドが見つからない

```bash
# macOS
brew install jq

# Linux
apt-get install jq
```

### ラベルが存在しないエラー

指定したラベルが GitHub リポジトリに存在しない場合、このエラーが発生します。

```bash
# ラベル一覧を確認
gh label list

# または
cat .github/labels.yml
```

利用可能なラベルのみを使用してください。

### プロジェクトボードに追加できない

プロジェクト番号やオーナー名が異なる場合は、環境変数で設定できます：

```bash
# 環境変数で設定
export GH_PROJECT_OWNER=your-username
export GH_PROJECT_NUMBER=2

# Issue作成
./create-issue.sh issue-data/drafts/my-feature-draft.yml
```

デフォルト値：

- `GH_PROJECT_OWNER`: `kencom2400`
- `GH_PROJECT_NUMBER`: `1`

環境変数が設定されていない場合は、デフォルト値が使用されます。

### データファイルがGitに追跡されてしまう

以下のいずれかを確認してください：

1. **draftsディレクトリに配置する**

   ```bash
   issue-data/drafts/my-issue.yml  # Git管理外
   ```

2. **ドラフトサフィックスを使用する**

   ```bash
   issue-data/my-issue-draft.yml   # Git管理外
   issue-data/my-issue-wip.yml     # Git管理外
   ```

3. **.gitignoreの設定を確認する**
   ```bash
   cat .gitignore | grep issue-data
   ```

## ディレクトリ構造

```
scripts/github/issues/
├── create-issue.sh              # 汎用Issue作成スクリプト
├── issue-data/                  # Issueデータディレクトリ
│   ├── .gitignore               # Git除外設定
│   ├── .gitkeep                 # ディレクトリ保持用
│   ├── templates/               # テンプレート（Git管理）
│   │   ├── .gitkeep
│   │   ├── feature.yml.example
│   │   ├── bug.yml.example
│   │   ├── refactor.yml.example
│   │   ├── infrastructure.yml.example
│   │   ├── testing.yml.example
│   │   └── documentation.yml.example
│   └── drafts/                  # ドラフト（Git管理外）
│       └── .gitkeep
├── README.md                    # このファイル
└── （その他のIssue管理スクリプト）
```

## ベストプラクティス

### 1. テンプレートを活用する

適切なテンプレートを選択することで、必要な情報を漏れなく記載できます。

### 2. draftsディレクトリを使用する

作成途中のIssueデータは `drafts/` ディレクトリに配置しましょう。

### 3. 再利用可能なデータは保存する

類似のIssueを頻繁に作成する場合、データファイルを保存しておくと便利です。

```bash
# 例: DB移行系のIssueテンプレート
issue-data/db-migration-template.yml
```

### 4. チェックリストを活用する

Issue本文内のチェックリストを活用して、進捗を管理しましょう。

### 5. 見積もり工数を記載する

見積もり工数を記載することで、プロジェクト計画が立てやすくなります。

## よくある質問（FAQ）

### Q: YAMLとJSON、どちらを使うべきですか？

A: **YAMLをおすすめします**。理由：

- 可読性が高い
- コメントが書ける
- マルチラインが書きやすい

ただし、`yq`コマンドのインストールが必要です。

### Q: 既存の個別スクリプトはどうなりますか？

A: このリファクタリングにより、`create-*-issue.sh` 形式の個別スクリプトは削除されます。すべて `create-issue.sh` に統合されます。

### Q: ドラフトファイルを誤ってコミットしてしまいました

A: 以下のコマンドで削除できます：

```bash
# ステージングから削除
git reset HEAD issue-data/drafts/my-file.yml

# またはコミット前なら
git rm --cached issue-data/drafts/my-file.yml
```

### Q: 複数のIssueを一括作成できますか？

A: 現時点では個別に作成する必要がありますが、シェルループで実現できます：

```bash
for file in issue-data/batch/*.yml; do
  ./create-issue.sh "$file"
done
```

## 参考資料

- [GitHub CLI Documentation](https://cli.github.com/)
- [yq Documentation](https://mikefarah.gitbook.io/yq/)
- [Markdown Guide](https://www.markdownguide.org/)
- [YAML Specification](https://yaml.org/spec/)

## フィードバック

このスクリプトやテンプレートに改善提案がある場合は、Issueを作成してください！
