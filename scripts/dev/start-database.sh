#!/bin/bash

# ================================================================
# データベース起動スクリプト（環境別対応）
# ================================================================
#
# 概要:
#   Docker Composeを使用してMySQL環境を起動します。
#   環境（dev/test/e2e）ごとに異なる動作をします。
#
# 使用方法:
#   ./start-database.sh           # 開発環境（デフォルト）
#   ./start-database.sh dev       # 開発環境（明示的）
#   ./start-database.sh test      # テスト環境
#   ./start-database.sh e2e       # E2E環境
#
# 環境別の動作:
#   dev環境  : 既存コンテナを再利用（開発効率優先）
#   test環境 : 常にクリーンな状態から開始（冪等性確保）
#   e2e環境  : 常にクリーンな状態から開始（冪等性確保）
#
# 環境別のポート設定:
#   dev環境  : MySQL=3306, Backend=3001, Frontend=3000
#   test環境 : MySQL=3316, Backend=3011, Frontend=3010
#   e2e環境  : MySQL=3326, Backend=3021, Frontend=3020
#
# 処理フロー:
#   1. 環境引数の検証
#   2. 既存コンテナの存在確認
#   3. 環境別の処理（再利用 or 再作成）
#   4. コンテナの起動
#   5. ヘルスチェック待機
#   6. 接続情報の表示
#
# 終了コード:
#   0  : 正常終了
#   1  : エラー（環境不明、起動失敗等）
#
# 依存:
#   - Docker
#   - Docker Compose
#   - docker-compose.{dev,test,e2e}.yml
#
# 関連ファイル:
#   - stop-database.sh  : データベース停止
#   - reset-database.sh : データベースリセット
#
# 例:
#   # 開発環境を起動（既存コンテナがあれば再利用）
#   ./start-database.sh dev
#
#   # E2E環境を起動（既存コンテナは削除して再作成）
#   ./start-database.sh e2e
#
# ================================================================

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
    FORCE_RECREATE=false
    ;;
  test)
    COMPOSE_FILE="docker-compose.test.yml"
    CONTAINER_NAME="account-book-mysql-test"
    PORT="${MYSQL_PORT_TEST:-3316}"
    DATABASE="${MYSQL_DATABASE_TEST:-account_book_test}"
    USER="${MYSQL_USER_TEST:-account_book_test_user}"
    FORCE_RECREATE=true
    ;;
  e2e)
    COMPOSE_FILE="docker-compose.e2e.yml"
    CONTAINER_NAME="account-book-mysql-e2e"
    PORT="${MYSQL_PORT_E2E:-3326}"
    DATABASE="${MYSQL_DATABASE_E2E:-account_book_e2e}"
    USER="${MYSQL_USER_E2E:-account_book_e2e_user}"
    FORCE_RECREATE=true
    ;;
  *)
    echo "❌ エラー: 不明な環境 '$ENV'"
    echo "使用可能な環境: dev, test, e2e"
    exit 1
    ;;
esac

cd "$(dirname "$0")/../.."

echo "🚀 MySQLデータベースを起動します（環境: $ENV）..."
echo ""

# コンテナの存在確認
CONTAINER_EXISTS=$(docker ps -a --filter "name=^${CONTAINER_NAME}$" --format "{{.Names}}" 2>/dev/null)

if [ -n "$CONTAINER_EXISTS" ]; then
  CONTAINER_STATUS=$(docker ps --filter "name=^${CONTAINER_NAME}$" --format "{{.Status}}" 2>/dev/null)
  
  if [ -n "$CONTAINER_STATUS" ]; then
    # コンテナが起動中
    if [ "$FORCE_RECREATE" = true ]; then
      echo "📦 既存のコンテナを検出: $CONTAINER_NAME"
      echo "   ステータス: 起動中"
      echo ""
      echo "⚠️  テスト環境は冪等性確保のため、常にクリーンな状態から開始します"
      echo "   既存のコンテナを停止・削除して再作成します..."
      echo ""
      
      docker-compose -f "$COMPOSE_FILE" down -v
      echo ""
      echo "✅ 既存のコンテナを削除しました"
      echo ""
    else
      echo "✅ 既存のコンテナが起動中です: $CONTAINER_NAME"
      echo "   環境: $ENV"
      echo "   ポート: $PORT"
      echo "   データベース: $DATABASE"
      echo ""
      echo "💡 開発環境では既存のコンテナを再利用します"
      return 0 2>/dev/null || exit 0
    fi
  else
    # コンテナは存在するが停止中
    if [ "$FORCE_RECREATE" = true ]; then
      echo "📦 停止中のコンテナを検出: $CONTAINER_NAME"
      echo ""
      echo "⚠️  テスト環境は常にクリーンな状態から開始します"
      echo "   停止中のコンテナを削除して再作成します..."
      echo ""
      
      docker-compose -f "$COMPOSE_FILE" down -v
      echo ""
      echo "✅ 停止中のコンテナを削除しました"
      echo ""
    else
      echo "📦 停止中のコンテナを検出: $CONTAINER_NAME"
      echo "   再起動します..."
      echo ""
    fi
  fi
fi

# コンテナを起動
echo "🔧 MySQLコンテナを起動中..."
docker-compose -f "$COMPOSE_FILE" up -d mysql

echo ""
echo "⏳ MySQLの準備完了を待機中..."
RETRY_COUNT=0
MAX_RETRIES=30
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
    echo "  待機中... (${RETRY_COUNT}/${MAX_RETRIES})"
  fi
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo ""
  echo "❌ MySQLの起動に失敗しました（タイムアウト）"
  echo ""
  echo "ログを確認:"
  docker logs "$CONTAINER_NAME" --tail 20
  exit 1
fi

echo ""
echo "✅ MySQLデータベースが起動しました！"
echo ""
echo "═════════════════════════════════════════"
echo "📊 接続情報"
echo "═════════════════════════════════════════"
echo "  環境: $ENV"
echo "  コンテナ名: $CONTAINER_NAME"
echo "  Host: localhost"
echo "  Port: $PORT"
echo "  Database: $DATABASE"
echo "  User: $USER"
if [ "$FORCE_RECREATE" = true ]; then
  echo ""
  echo "  ⚠️  クリーンな状態で起動しました"
  echo "      マイグレーションが必要な場合があります"
fi
echo "═════════════════════════════════════════"
echo ""

