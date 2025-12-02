#!/bin/bash

# 並列開発サーバー起動スクリプト

set -e

echo "================================"
echo "開発サーバーを並列起動"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."


# ログディレクトリを作成
mkdir -p logs

# バックエンドを起動
echo "🚀 バックエンドを起動中..."
(cd apps/backend && pnpm dev > ../../logs/backend.log 2>&1) &
BACKEND_PID=$!
echo "✓ バックエンドPID: $BACKEND_PID"

# フロントエンドを起動
echo "🚀 フロントエンドを起動中..."
(cd apps/frontend && pnpm dev > ../../logs/frontend.log 2>&1) &
FRONTEND_PID=$!
echo "✓ フロントエンドPID: $FRONTEND_PID"

echo ""
echo "================================"
echo "✅ 開発サーバー起動完了"
echo "================================"
echo ""
echo "バックエンド: http://localhost:3001"
echo "フロントエンド: http://localhost:3000"
echo ""
echo "ログファイル:"
echo "  - logs/backend.log"
echo "  - logs/frontend.log"
echo ""
echo "停止するには: ./scripts/dev/stop-dev.sh"
echo ""

# PIDを保存
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# ログをtail
echo "ログを表示中... (Ctrl+Cで終了)"
tail -f logs/backend.log logs/frontend.log

