#!/bin/bash

# データベースバックアップスクリプト

set -e

BACKUP_DIR="$(dirname "$0")/../../backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/account_book_backup_$TIMESTAMP.sql"

echo "💾 データベースをバックアップします..."

# バックアップディレクトリ作成
mkdir -p "$BACKUP_DIR"

cd "$(dirname "$0")/../.."

# 環境変数読み込み
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

# MySQLダンプ実行
docker-compose exec -T mysql mysqldump \
    -u "${MYSQL_USER:-account_book_user}" \
    -p"${MYSQL_PASSWORD:-password}" \
    "${MYSQL_DATABASE:-account_book_dev}" \
    > "$BACKUP_FILE"

echo "✅ バックアップ完了: $BACKUP_FILE"
echo "   ファイルサイズ: $(du -h "$BACKUP_FILE" | cut -f1)"

