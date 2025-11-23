#!/bin/bash

# データベース起動スクリプト（環境別対応）
# 使用方法:
#   ./start-database.sh           # 開発環境（デフォルト）
#   ./start-database.sh test      # テスト環境
#   ./start-database.sh e2e       # E2E環境

set -e

# 環境を指定（デフォルト: dev）
ENV="${1:-dev}"

# 環境に応じた設定
case "$ENV" in
  dev)
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_NAME="account-book-mysql-dev"
    PORT="${MYSQL_PORT_DEV:-3306}"
    DATABASE="${MYSQL_DATABASE_DEV:-account_book_dev}"
    USER="${MYSQL_USER_DEV:-account_book_user}"
    ;;
  test)
    COMPOSE_FILE="docker-compose.test.yml"
    CONTAINER_NAME="account-book-mysql-test"
    PORT="${MYSQL_PORT_TEST:-3316}"
    DATABASE="${MYSQL_DATABASE_TEST:-account_book_test}"
    USER="${MYSQL_USER_TEST:-account_book_test_user}"
    ;;
  e2e)
    COMPOSE_FILE="docker-compose.e2e.yml"
    CONTAINER_NAME="account-book-mysql-e2e"
    PORT="${MYSQL_PORT_E2E:-3326}"
    DATABASE="${MYSQL_DATABASE_E2E:-account_book_e2e}"
    USER="${MYSQL_USER_E2E:-account_book_e2e_user}"
    ;;
  *)
    echo "❌ エラー: 不明な環境 '$ENV'"
    echo "使用可能な環境: dev, test, e2e"
    exit 1
    ;;
esac

echo "🚀 MySQLデータベースを起動します（環境: $ENV）..."

cd "$(dirname "$0")/../.."

docker-compose -f "$COMPOSE_FILE" up -d mysql

echo "⏳ MySQLの準備完了を待機中..."
until docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqladmin ping -h localhost --silent; do
    echo "   待機中..."
    sleep 2
done

echo "✅ MySQLデータベースが起動しました！"
echo ""
echo "接続情報:"
echo "  環境: $ENV"
echo "  コンテナ名: $CONTAINER_NAME"
echo "  Host: localhost"
echo "  Port: $PORT"
echo "  Database: $DATABASE"
echo "  User: $USER"

