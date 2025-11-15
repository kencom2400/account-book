#!/bin/bash

# 開発サーバー停止スクリプト

echo "================================"
echo "開発サーバーを停止中..."
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# PIDファイルから停止
if [ -f "logs/backend.pid" ]; then
  BACKEND_PID=$(cat logs/backend.pid)
  if kill -0 $BACKEND_PID 2>/dev/null; then
    kill $BACKEND_PID
    echo "✓ バックエンドを停止 (PID: $BACKEND_PID)"
  fi
  rm logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
  FRONTEND_PID=$(cat logs/frontend.pid)
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    kill $FRONTEND_PID
    echo "✓ フロントエンドを停止 (PID: $FRONTEND_PID)"
  fi
  rm logs/frontend.pid
fi

echo ""
echo "✅ 開発サーバーを停止しました"

