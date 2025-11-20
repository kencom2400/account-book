#!/bin/bash

# データベース起動スクリプト

set -e

echo "🚀 MySQLデータベースを起動します..."

cd "$(dirname "$0")/../.."

docker-compose up -d mysql

echo "⏳ MySQLの準備完了を待機中..."
until docker-compose exec -T mysql mysqladmin ping -h localhost --silent; do
    echo "   待機中..."
    sleep 2
done

echo "✅ MySQLデータベースが起動しました！"
echo ""
echo "接続情報:"
echo "  Host: localhost"
echo "  Port: 3306"
echo "  Database: account_book_dev"
echo "  User: account_book_user"

