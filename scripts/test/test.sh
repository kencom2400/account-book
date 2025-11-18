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
TEST_TYPE=${2:-unit}  # unit, e2e, all

case $TARGET in
  backend)
    echo "🧪 バックエンドのテスト実行中..."
    cd apps/backend
    if [ "$TEST_TYPE" = "e2e" ]; then
      pnpm test:e2e
    elif [ "$TEST_TYPE" = "all" ]; then
      pnpm test
      pnpm test:e2e
    else
      pnpm test
    fi
    ;;
  frontend)
    echo "🧪 フロントエンドのテスト実行中..."
    cd apps/frontend
    if [ "$TEST_TYPE" = "e2e" ]; then
      pnpm test:e2e
    elif [ "$TEST_TYPE" = "all" ]; then
      pnpm test
      pnpm test:e2e
    else
      pnpm test
    fi
    ;;
  all)
    echo "🧪 すべてのテスト実行中..."
    if [ "$TEST_TYPE" = "e2e" ]; then
      ./scripts/test/test-e2e.sh all
    elif [ "$TEST_TYPE" = "all" ]; then
      # ユニットテスト
      echo "--- ユニットテスト ---"
      cd apps/backend
      pnpm test
      cd ../frontend
      pnpm test
      # E2Eテスト
      ./scripts/test/test-e2e.sh all
    else
      # ユニットテストのみ
      cd apps/backend
      pnpm test
      echo ""
      cd ../frontend
      pnpm test
    fi
    ;;
  *)
    echo "使用方法: ./scripts/test/test.sh [backend|frontend|all] [unit|e2e|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ テスト完了"

