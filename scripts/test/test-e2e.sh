#!/bin/bash

# E2Eテスト実行スクリプト（環境別対応）
# 使用方法:
#   ./test-e2e.sh [backend|frontend|all]  # デフォルトはall
#   環境変数で環境指定: TEST_ENV=e2e ./test-e2e.sh

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

# テスト環境を指定（デフォルト: e2e）
TEST_ENV="${TEST_ENV:-e2e}"

# 環境に応じた設定
case "$TEST_ENV" in
  dev)
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_NAME="account-book-mysql-dev"
    BACKEND_PORT="${BACKEND_PORT_DEV:-3001}"
    FRONTEND_PORT="${FRONTEND_PORT_DEV:-3000}"
    ;;
  test)
    COMPOSE_FILE="docker-compose.test.yml"
    CONTAINER_NAME="account-book-mysql-test"
    BACKEND_PORT="${BACKEND_PORT_TEST:-3011}"
    FRONTEND_PORT="${FRONTEND_PORT_TEST:-3010}"
    ;;
  e2e)
    COMPOSE_FILE="docker-compose.e2e.yml"
    CONTAINER_NAME="account-book-mysql-e2e"
    BACKEND_PORT="${BACKEND_PORT_E2E:-3021}"
    FRONTEND_PORT="${FRONTEND_PORT_E2E:-3020}"
    ;;
  *)
    echo "❌ エラー: 不明な環境 '$TEST_ENV'"
    echo "使用可能な環境: dev, test, e2e"
    exit 1
    ;;
esac

echo "ℹ️  テスト環境: $TEST_ENV"
echo "   Backend Port: $BACKEND_PORT"
echo "   Frontend Port: $FRONTEND_PORT"
echo ""

# MySQLコンテナの起動確認と自動起動
echo "🔍 MySQLコンテナの起動状態を確認中..."
MYSQL_RUNNING=$(docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" --format "{{.Names}}" 2>/dev/null)
if [ -z "$MYSQL_RUNNING" ]; then
  echo "ℹ️  MySQLコンテナが起動していません。自動的に起動します..."
  echo ""
  ./scripts/dev/start-database.sh "$TEST_ENV"
  echo ""
fi
echo "✅ MySQLコンテナが起動しています"
echo ""

# 引数でテスト対象を指定
TARGET=${1:-all}

# 環境変数をエクスポート（テスト実行時に使用）
export BACKEND_PORT
export FRONTEND_PORT
export TEST_ENV

# MySQL環境変数を環境別に設定してエクスポート
case "$TEST_ENV" in
  dev)
    export MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    export MYSQL_PORT="${MYSQL_PORT_DEV:-3306}"
    export MYSQL_USER="${MYSQL_USER_DEV:-account_book_dev_user}"
    export MYSQL_PASSWORD="${MYSQL_PASSWORD_DEV:-dev_password}"
    export MYSQL_DATABASE="${MYSQL_DATABASE_DEV:-account_book_dev}"
    ;;
  test)
    export MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    export MYSQL_PORT="${MYSQL_PORT_TEST:-3316}"
    export MYSQL_USER="${MYSQL_USER_TEST:-account_book_test_user}"
    export MYSQL_PASSWORD="${MYSQL_PASSWORD_TEST:-test_password}"
    export MYSQL_DATABASE="${MYSQL_DATABASE_TEST:-account_book_test}"
    ;;
  e2e)
    export TEST_ENV="e2e"
    export MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    export MYSQL_PORT="${MYSQL_PORT_E2E:-3326}"
    export MYSQL_USER="${MYSQL_USER_E2E:-account_book_e2e_user}"
    export MYSQL_PASSWORD="${MYSQL_PASSWORD_E2E:-e2e_password}"
    export MYSQL_DATABASE="${MYSQL_DATABASE_E2E:-account_book_e2e}"
    ;;
esac

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
echo "✅ E2Eテスト完了（環境: $TEST_ENV）"

