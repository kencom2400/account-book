#!/bin/bash

# テスト実行スクリプト

set -e

echo "================================"
echo "テスト実行開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# 環境をアクティベート
if [ -f ".nodeenv/bin/activate" ]; then
  source .nodeenv/bin/activate
else
  echo "⚠ .nodeenv が見つかりません。setup.sh を先に実行してください。"
  exit 1
fi

# 引数でテスト対象を指定
TARGET=${1:-all}

case $TARGET in
  backend)
    echo "🧪 バックエンドのテスト実行中..."
    cd apps/backend
    pnpm test
    ;;
  frontend)
    echo "🧪 フロントエンドのテスト実行中..."
    cd apps/frontend
    pnpm test
    ;;
  all)
    echo "🧪 バックエンドのテスト実行中..."
    cd apps/backend
    pnpm test
    echo ""
    echo "🧪 フロントエンドのテスト実行中..."
    cd ../frontend
    pnpm test
    ;;
  *)
    echo "使用方法: ./scripts/test/test.sh [backend|frontend|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ テスト完了"

