#!/bin/bash

# GitHub ProjectsでIssueのステータスを"In Progress"に変更するスクリプト
# 注: このスクリプトは update-issue-status.sh のラッパーです

set -e

# 使い方
if [ $# -ne 1 ]; then
  echo "使い方: $0 <issue番号>"
  echo "例: $0 24"
  exit 1
fi

ISSUE_NUMBER=$1

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# update-issue-status.sh を呼び出す
"${SCRIPT_DIR}/update-issue-status.sh" "$ISSUE_NUMBER" "🚧 In Progress"

