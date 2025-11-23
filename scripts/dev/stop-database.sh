#!/bin/bash

# データベース停止スクリプト（環境別対応）
# 使用方法:
#   ./stop-database.sh           # 開発環境（デフォルト）
#   ./stop-database.sh test      # テスト環境
#   ./stop-database.sh e2e       # E2E環境
#   ./stop-database.sh all       # すべての環境

set -e

# 環境を指定（デフォルト: dev）
ENV="${1:-dev}"

cd "$(dirname "$0")/../.."

if [ "$ENV" = "all" ]; then
    echo "🛑 すべての環境のMySQLデータベースを停止します..."
    docker-compose -f docker-compose.dev.yml stop mysql 2>/dev/null || true
    docker-compose -f docker-compose.test.yml stop mysql 2>/dev/null || true
    docker-compose -f docker-compose.e2e.yml stop mysql 2>/dev/null || true
    echo "✅ すべての環境のMySQLデータベースを停止しました"
    exit 0
fi

# 環境に応じた設定
case "$ENV" in
  dev)
    COMPOSE_FILE="docker-compose.dev.yml"
    ;;
  test)
    COMPOSE_FILE="docker-compose.test.yml"
    ;;
  e2e)
    COMPOSE_FILE="docker-compose.e2e.yml"
    ;;
  *)
    echo "❌ エラー: 不明な環境 '$ENV'"
    echo "使用可能な環境: dev, test, e2e, all"
    exit 1
    ;;
esac

echo "🛑 MySQLデータベースを停止します（環境: $ENV）..."

docker-compose -f "$COMPOSE_FILE" stop mysql

echo "✅ MySQLデータベースを停止しました"

