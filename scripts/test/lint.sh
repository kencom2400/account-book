#!/bin/bash

# リントチェックスクリプト

set -e

echo "================================"
echo "リントチェック開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# 引数でチェック対象を指定
TARGET=${1:-all}

case $TARGET in
  backend)
    echo "🔍 バックエンドのリントチェック中..."
    cd apps/backend
    pnpm lint
    ;;
  frontend)
    echo "🔍 フロントエンドのリントチェック中..."
    cd apps/frontend
    pnpm lint
    ;;
  all)
    echo "🔍 バックエンドのリントチェック中..."
    cd apps/backend
    pnpm lint
    echo ""
    echo "🔍 フロントエンドのリントチェック中..."
    cd ../frontend
    pnpm lint
    ;;
  *)
    echo "使用方法: ./scripts/test/lint.sh [backend|frontend|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ リントチェック完了"

