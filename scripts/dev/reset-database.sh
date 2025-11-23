#!/bin/bash

# データベースリセットスクリプト（環境別対応）
# 使用方法:
#   ./reset-database.sh           # 開発環境（デフォルト）
#   ./reset-database.sh test      # テスト環境
#   ./reset-database.sh e2e       # E2E環境

set -e

# 環境を指定（デフォルト: dev）
ENV="${1:-dev}"

# 環境に応じた設定
case "$ENV" in
  dev)
    COMPOSE_FILE="docker-compose.dev.yml"
    DATABASE="${MYSQL_DATABASE_DEV:-account_book_dev}"
    USER="${MYSQL_USER_DEV:-account_book_user}"
    ;;
  test)
    COMPOSE_FILE="docker-compose.test.yml"
    DATABASE="${MYSQL_DATABASE_TEST:-account_book_test}"
    USER="${MYSQL_USER_TEST:-account_book_test_user}"
    ;;
  e2e)
    COMPOSE_FILE="docker-compose.e2e.yml"
    DATABASE="${MYSQL_DATABASE_E2E:-account_book_e2e}"
    USER="${MYSQL_USER_E2E:-account_book_e2e_user}"
    ;;
  *)
    echo "❌ エラー: 不明な環境 '$ENV'"
    echo "使用可能な環境: dev, test, e2e"
    exit 1
    ;;
esac

echo "⚠️  データベースを完全にリセットします（環境: $ENV）"
echo "   すべてのデータが削除されます"
echo ""
read -p "本当にリセットしますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ キャンセルしました"
    exit 0
fi

cd "$(dirname "$0")/../.."

# 環境変数読み込み
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

echo "🗑️  データベースを削除中..."
# MYSQL_PWD環境変数を使用してパスワードをプロセスリストから隠蔽
docker-compose -f "$COMPOSE_FILE" exec -T \
    -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-root_password}" \
    mysql mysql \
    -u root \
    -e "DROP DATABASE IF EXISTS $DATABASE;"

echo "🔨 データベースを再作成中..."
docker-compose -f "$COMPOSE_FILE" exec -T \
    -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-root_password}" \
    mysql mysql \
    -u root \
    -e "CREATE DATABASE $DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "🔧 権限を付与中..."
docker-compose -f "$COMPOSE_FILE" exec -T \
    -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-root_password}" \
    mysql mysql \
    -u root \
    -e "GRANT ALL PRIVILEGES ON $DATABASE.* TO '$USER'@'%';"

echo "📝 マイグレーションを実行中..."
source scripts/setup/activate.sh
cd apps/backend
pnpm run migration:run

echo "✅ データベースのリセットが完了しました（環境: $ENV）"

