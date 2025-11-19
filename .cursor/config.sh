#!/bin/bash
# Cursor AI タスク自動実行の設定ファイル

# GitHub Projects設定
# プロジェクト番号（デフォルト: 1）
export PROJECT_NUMBER="${PROJECT_NUMBER:-1}"

# To Doステータス名（デフォルト: "📋 To Do"）
export TODO_STATUS_NAME="${TODO_STATUS_NAME:-📋 To Do}"

# 注意: OWNER（リポジトリオーナー）は gh repo view コマンドで動的に取得されます

