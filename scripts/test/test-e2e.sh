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

# MySQLコンテナの起動確認と自動起動
echo "🔍 MySQLコンテナの起動状態を確認中..."
if [ -z "$(docker ps -q --filter "name=^account-book-mysql$")" ]; then
  echo "ℹ️  MySQLコンテナが起動していません。自動的に起動します..."
  echo ""
  ./scripts/dev/start-database.sh
  echo ""
fi
echo "✅ MySQLコンテナが起動しています"
echo ""

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
    echo "ℹ️  PlaywrightのwebServer設定により、バックエンドは自動的に起動されます"
    
    # フロントエンドE2Eテスト実行（Playwrightがバックエンドを自動起動）
    cd apps/frontend
    pnpm test:e2e
    ;;
  all)
    echo "🧪 すべてのE2Eテスト実行中..."

    # バックエンドE2E
    echo ""
    echo "--- Backend E2E ---"
    cd apps/backend
    pnpm test:e2e

    # フロントエンドE2E
    echo ""
    echo "--- Frontend E2E ---"
    echo "ℹ️  PlaywrightのwebServer設定により、バックエンドは自動的に起動されます"
    cd ../frontend
    pnpm test:e2e
    ;;
  *)
    echo "使用方法: ./scripts/test/test-e2e.sh [backend|frontend|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ E2Eテスト完了"

