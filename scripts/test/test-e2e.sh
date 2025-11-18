#!/bin/bash

# E2Eテスト実行スクリプト

set -e

echo "════════════════════════════════════════════════════════════════"
echo "   🧪 E2Eテスト実行"
echo "════════════════════════════════════════════════════════════════"
echo ""

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
    echo "🧪 バックエンドのE2Eテスト実行中..."
    cd apps/backend
    pnpm test:e2e
    ;;
  frontend)
    echo "🧪 フロントエンドのE2Eテスト実行中..."

    # バックエンドを起動
    echo "📦 バックエンドを起動中..."
    cd apps/backend
    pnpm dev > /dev/null 2>&1 &
    BACKEND_PID=$!

    # バックエンドの起動を待機
    echo "⏳ バックエンドの起動を待機中..."
    sleep 5

    # フロントエンドE2Eテスト実行
    cd ../frontend
    pnpm test:e2e

    # バックエンドを停止
    kill $BACKEND_PID 2>/dev/null || true
    ;;
  all)
    echo "🧪 すべてのE2Eテスト実行中..."

    # バックエンドE2E
    echo ""
    echo "--- Backend E2E ---"
    cd apps/backend
    pnpm test:e2e

    # バックエンドを起動
    echo ""
    echo "📦 バックエンドを起動中..."
    pnpm dev > /dev/null 2>&1 &
    BACKEND_PID=$!
    sleep 5

    # フロントエンドE2E
    echo ""
    echo "--- Frontend E2E ---"
    cd ../frontend
    pnpm test:e2e

    # バックエンドを停止
    kill $BACKEND_PID 2>/dev/null || true
    ;;
  *)
    echo "使用方法: ./scripts/test/test-e2e.sh [backend|frontend|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ E2Eテスト完了"

