#!/bin/bash

# データベースリセットスクリプト（開発用）

set -e

echo "⚠️  データベースを完全にリセットします（開発用）"
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
docker-compose exec -T \
    -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-root_password}" \
    mysql mysql \
    -u root \
    -e "DROP DATABASE IF EXISTS ${MYSQL_DATABASE:-account_book_dev};"

echo "🔨 データベースを再作成中..."
docker-compose exec -T \
    -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-root_password}" \
    mysql mysql \
    -u root \
    -e "CREATE DATABASE ${MYSQL_DATABASE:-account_book_dev} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "🔧 権限を付与中..."
docker-compose exec -T \
    -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-root_password}" \
    mysql mysql \
    -u root \
    -e "GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE:-account_book_dev}.* TO '${MYSQL_USER:-account_book_user}'@'%';"

echo "📝 マイグレーションを実行中..."
source scripts/setup/activate.sh
cd apps/backend
pnpm run migration:run

echo "✅ データベースのリセットが完了しました"

