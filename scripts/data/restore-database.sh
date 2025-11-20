#!/bin/bash

# データベースリストアスクリプト

set -e

if [ -z "$1" ]; then
    echo "使用方法: $0 <backup_file.sql>"
    echo ""
    echo "利用可能なバックアップファイル:"
    ls -lh "$(dirname "$0")/../../backups/"*.sql 2>/dev/null || echo "  (バックアップファイルが見つかりません)"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ エラー: バックアップファイルが見つかりません: $BACKUP_FILE"
    exit 1
fi

echo "📥 データベースをリストアします..."
echo "   ファイル: $BACKUP_FILE"
echo ""
read -p "本当にリストアしますか？ 既存データは上書きされます (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ キャンセルしました"
    exit 0
fi

cd "$(dirname "$0")/../.."

# 環境変数読み込み
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# MySQLリストア実行
docker-compose exec -T mysql mysql \
    -u "${MYSQL_USER:-account_book_user}" \
    -p"${MYSQL_PASSWORD:-password}" \
    "${MYSQL_DATABASE:-account_book_dev}" \
    < "$BACKUP_FILE"

echo "✅ リストア完了"

