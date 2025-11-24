#!/bin/bash

# GitHub Projects設定ファイル
# このファイルはstart-task.shなどのワークフロースクリプトから参照されます

# リポジトリ情報
export REPO_OWNER="kencom2400"
export REPO_NAME="account-book"

# プロジェクト情報
export PROJECT_NUMBER=1
export PROJECT_ID="PVT_kwHOANWYrs4BIOm-"

# GitHub API設定
export GH_API_LIMIT=9999  # gh project item-list および gh issue list のlimit値
export MIN_ISSUE_COUNT_FOR_COMPLETION=90  # Issue完了確認の最小閾値

# リトライ処理の設定
export MAX_RETRIES=5  # API反映待機のリトライ最大回数
export RETRY_INTERVAL=3  # リトライ間隔（秒）

# API Rate Limit対策
export API_RATE_LIMIT_WAIT=1  # API rate limit対策の基本待機時間（秒）

# ステータスフィールドID
export STATUS_FIELD_ID="PVTSSF_lAHOANWYrs4BIOm-zg4wCDo"

# ステータスオプションID
export BACKLOG_OPTION_ID="f908f688"
export TODO_OPTION_ID="f36fcf60"
export IN_PROGRESS_OPTION_ID="16defd77"
export REVIEW_OPTION_ID="0f0f2f26"
export DONE_OPTION_ID="2f722d70"

# ステータス名とオプションIDのマッピング
# 注: 連想配列は使用しない（絵文字がキーとして使えないため）

# ステータス名の定義
export STATUS_BACKLOG="📦 Backlog"
export STATUS_TODO="📝 To Do"
export STATUS_IN_PROGRESS="🚧 In Progress"
export STATUS_REVIEW="👀 Review"
export STATUS_DONE="✅ Done"

