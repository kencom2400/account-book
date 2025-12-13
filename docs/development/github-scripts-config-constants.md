# GitHub操作スクリプト設定ファイル定数一覧

## 概要

`scripts/github/workflow/config.sh`に設定すべき定数の完全な一覧です。

## 設定定数一覧

### 1. リポジトリ情報

```bash
# リポジトリオーナー（GitHubユーザー名または組織名）
export REPO_OWNER="kencom2400"

# リポジトリ名
export REPO_NAME="account-book"

# リポジトリ情報のエイリアス（後方互換性のため）
# 注: 一部のスクリプトでOWNER/REPOを使用しているため、エイリアスとして定義
export OWNER="${REPO_OWNER}"
export REPO="${REPO_NAME}"

# プロジェクトオーナー（通常はREPO_OWNERと同じ）
# 注: 一部のスクリプトでPROJECT_OWNERを使用しているため
export PROJECT_OWNER="${REPO_OWNER}"

# リポジトリの完全な形式（owner/repo）
# 注: 一部のスクリプトで"kencom2400/account-book"形式を使用
export REPO_FULL="${REPO_OWNER}/${REPO_NAME}"
```

### 2. プロジェクト情報

```bash
# プロジェクト番号（GitHub Projects V2の番号）
export PROJECT_NUMBER=1

# プロジェクトID（GitHub Projects V2のGraphQL ID）
export PROJECT_ID="PVT_kwHOANWYrs4BIOm-"
```

### 3. ステータスフィールド情報

```bash
# ステータスフィールドID（GitHub Projects V2のStatusフィールドのID）
export STATUS_FIELD_ID="PVTSSF_lAHOANWYrs4BIOm-zg4wCDo"
```

### 4. ステータスオプションID

```bash
# 各ステータスのオプションID（GitHub Projects V2のステータスオプションID）
export BACKLOG_OPTION_ID="f908f688"
export TODO_OPTION_ID="f36fcf60"
export IN_PROGRESS_OPTION_ID="16defd77"
export REVIEW_OPTION_ID="0f0f2f26"
export DONE_OPTION_ID="2f722d70"
```

**注意**: `move-issues-to-backlog-graphql.sh`では`BACKLOG_OPTION_ID="f75ad846"`が使用されていますが、
`config.sh`では`f908f688`が定義されています。どちらが正しいか確認が必要です。

### 5. ステータス名

```bash
# ステータス名の定義（絵文字を含む）
export STATUS_BACKLOG="📦 Backlog"
export STATUS_TODO="📝 To Do"
export STATUS_IN_PROGRESS="🚧 In Progress"
export STATUS_REVIEW="👀 Review"
export STATUS_DONE="✅ Done"
```

### 6. GitHub API設定

```bash
# GitHub APIのリミット値
# gh project item-list および gh issue list のlimit値
export GH_API_LIMIT=9999

# Issue完了確認の最小閾値
export MIN_ISSUE_COUNT_FOR_COMPLETION=90
```

### 7. リトライ処理設定

```bash
# API反映待機のリトライ最大回数
export MAX_RETRIES=5

# リトライ間隔（秒）
export RETRY_INTERVAL=3
```

### 8. API Rate Limit対策

```bash
# API rate limit対策の基本待機時間（秒）
export API_RATE_LIMIT_WAIT=1
```

## 設定ファイルの完全版

以下が`config.sh`の完全版です：

```bash
#!/bin/bash

# GitHub Projects設定ファイル
# このファイルはすべてのGitHub操作スクリプトから参照されます
# 他のリポジトリで使用する場合は、このファイルの値を変更してください

# ============================================================
# リポジトリ情報
# ============================================================

# リポジトリオーナー（GitHubユーザー名または組織名）
export REPO_OWNER="kencom2400"

# リポジトリ名
export REPO_NAME="account-book"

# リポジトリ情報のエイリアス（後方互換性のため）
# 注: 一部のスクリプトでOWNER/REPOを使用しているため、エイリアスとして定義
export OWNER="${REPO_OWNER}"
export REPO="${REPO_NAME}"

# プロジェクトオーナー（通常はREPO_OWNERと同じ）
# 注: 一部のスクリプトでPROJECT_OWNERを使用しているため
export PROJECT_OWNER="${REPO_OWNER}"

# リポジトリの完全な形式（owner/repo）
# 注: 一部のスクリプトで"kencom2400/account-book"形式を使用
export REPO_FULL="${REPO_OWNER}/${REPO_NAME}"

# ============================================================
# プロジェクト情報
# ============================================================

# プロジェクト番号（GitHub Projects V2の番号）
export PROJECT_NUMBER=1

# プロジェクトID（GitHub Projects V2のGraphQL ID）
export PROJECT_ID="PVT_kwHOANWYrs4BIOm-"

# ============================================================
# ステータスフィールド情報
# ============================================================

# ステータスフィールドID（GitHub Projects V2のStatusフィールドのID）
export STATUS_FIELD_ID="PVTSSF_lAHOANWYrs4BIOm-zg4wCDo"

# ============================================================
# ステータスオプションID
# ============================================================

# 各ステータスのオプションID（GitHub Projects V2のステータスオプションID）
export BACKLOG_OPTION_ID="f908f688"
export TODO_OPTION_ID="f36fcf60"
export IN_PROGRESS_OPTION_ID="16defd77"
export REVIEW_OPTION_ID="0f0f2f26"
export DONE_OPTION_ID="2f722d70"

# ============================================================
# ステータス名
# ============================================================

# ステータス名の定義（絵文字を含む）
# 注: 連想配列は使用しない（絵文字がキーとして使えないため）
export STATUS_BACKLOG="📦 Backlog"
export STATUS_TODO="📝 To Do"
export STATUS_IN_PROGRESS="🚧 In Progress"
export STATUS_REVIEW="👀 Review"
export STATUS_DONE="✅ Done"

# ============================================================
# GitHub API設定
# ============================================================

# GitHub APIのリミット値
# gh project item-list および gh issue list のlimit値
export GH_API_LIMIT=9999

# Issue完了確認の最小閾値
export MIN_ISSUE_COUNT_FOR_COMPLETION=90

# ============================================================
# リトライ処理設定
# ============================================================

# API反映待機のリトライ最大回数
export MAX_RETRIES=5

# リトライ間隔（秒）
export RETRY_INTERVAL=3

# ============================================================
# API Rate Limit対策
# ============================================================

# API rate limit対策の基本待機時間（秒）
export API_RATE_LIMIT_WAIT=1
```

## 変数名の統一

現在、スクリプト間で異なる変数名が使用されています。以下の統一を推奨します：

| 現在の変数名                | 推奨変数名   | 説明                                                          |
| --------------------------- | ------------ | ------------------------------------------------------------- |
| `OWNER`                     | `REPO_OWNER` | リポジトリオーナー（エイリアスとして`OWNER`も定義）           |
| `REPO`                      | `REPO_NAME`  | リポジトリ名（エイリアスとして`REPO`も定義）                  |
| `PROJECT_OWNER`             | `REPO_OWNER` | プロジェクトオーナー（エイリアスとして`PROJECT_OWNER`も定義） |
| `"kencom2400/account-book"` | `REPO_FULL`  | リポジトリの完全な形式                                        |

## 注意事項

### 1. BACKLOG_OPTION_IDの不一致

以下の2つの値が使用されています：

- `config.sh`: `f908f688`
- `move-issues-to-backlog-graphql.sh`: `f75ad846`

どちらが正しいか確認が必要です。

### 2. 後方互換性

既存のスクリプトが動作するよう、エイリアス変数を定義しています：

- `OWNER` → `REPO_OWNER`
- `REPO` → `REPO_NAME`
- `PROJECT_OWNER` → `REPO_OWNER`

### 3. 環境変数による上書き

すべての変数は環境変数で上書き可能です。例：

```bash
# 環境変数で上書き
export REPO_OWNER="my-org"
export REPO_NAME="my-repo"
source scripts/github/workflow/config.sh
```

## 使用方法

各スクリプトの先頭で設定ファイルを読み込みます：

```bash
#!/bin/bash

# 設定ファイルの読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../workflow/config.sh" ]; then
  source "${SCRIPT_DIR}/../workflow/config.sh"
fi

# デフォルト値の設定（設定ファイルが読み込まれなかった場合のフォールバック）
REPO_OWNER="${REPO_OWNER:-kencom2400}"
REPO_NAME="${REPO_NAME:-account-book}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"
# ... 他の変数も同様
```

## 他のリポジトリでの使用

他のリポジトリで使用する場合は、`config.sh`の値を変更するだけです：

```bash
# リポジトリ情報を変更
export REPO_OWNER="my-org"
export REPO_NAME="my-repo"

# プロジェクト情報を変更
export PROJECT_NUMBER=2
export PROJECT_ID="PVT_xxxxxxxxxxxxx"

# ステータスフィールドIDを変更
export STATUS_FIELD_ID="PVTSSF_xxxxxxxxxxxxx"

# ステータスオプションIDを変更
export BACKLOG_OPTION_ID="xxxxxxxx"
export TODO_OPTION_ID="xxxxxxxx"
# ... 他のオプションIDも同様
```

## 関連Issue

- Issue #394: GitHub操作スクリプトの設定ファイル化
