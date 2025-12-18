#!/bin/bash

# E2Eテスト実行スクリプト
# 使用方法:
#   ./test-e2e.sh [backend|frontend|all]  # デフォルトはall

set -e

echo "════════════════════════════════════════════════════════════════"
echo "   🧪 E2Eテスト実行"
echo "════════════════════════════════════════════════════════════════"
echo ""

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Voltaを優先的に使用
export PATH="$HOME/.volta/bin:$HOME/Library/pnpm:/opt/homebrew/bin:$HOME/.local/share/pnpm:$HOME/.npm-global/bin:$PATH"

# pnpmコマンドの存在確認
if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ エラー: pnpmコマンドが見つかりません"
  echo "   Voltaとpnpmをインストールしてください"
  echo "   詳細: README.mdを参照"
  exit 1
fi

# E2E環境の固定設定
COMPOSE_FILE="docker-compose.e2e.yml"
CONTAINER_NAME="account-book-mysql-e2e"
BACKEND_PORT="${BACKEND_PORT_E2E:-3021}"
FRONTEND_PORT="${FRONTEND_PORT_E2E:-3020}"

echo "ℹ️  テスト環境: e2e"
echo "   Backend Port: $BACKEND_PORT"
echo "   Frontend Port: $FRONTEND_PORT"
echo ""

# 既存のE2E関連プロセス（pnpm dev、MySQLなど）が起動している場合、停止する（ポート競合を防ぐため）
echo "🔍 既存のE2E関連プロセスの起動状態を確認中..."

# E2Eテスト用ポート（3020: frontend, 3021: backend, 3326: MySQL）を使用しているプロセスを確認
# TCPのLISTEN状態のみを正確にチェック（ポート番号の部分一致を防ぐ）
E2E_PORTS="3020 3021 3326"
PORTS_TO_KILL=""

# 停止対象となるコマンドパターン（E2E関連プロセスのみ）
# pnpm dev、next-server、nest start watch、mysql（E2E用）などを対象とする
# node経由でpnpmを実行している場合（例: node ... pnpm ... dev）も含める
TARGET_COMMAND_PATTERNS="pnpm.*dev|node.*pnpm.*dev|next-server|nest.*start.*watch|nest.*dev|mysql"

for port in $E2E_PORTS; do
  # TCPのLISTEN状態で正確にポート番号を指定
  PORT_PID=$(lsof -tiTCP:$port -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$PORT_PID" ]; then
    # プロセスのコマンド名と引数を取得
    PROCESS_COMMAND=$(ps -p "$PORT_PID" -o comm= 2>/dev/null || echo "")
    PROCESS_ARGS=$(ps -p "$PORT_PID" -o args= 2>/dev/null || echo "")
    PROCESS_INFO="$PROCESS_COMMAND $PROCESS_ARGS"
    
    # Dockerプロセスは除外
    if [ "$PROCESS_COMMAND" != "com.docker.backend" ]; then
      # 対象コマンドパターンに一致するか確認
      if echo "$PROCESS_INFO" | grep -qE "$TARGET_COMMAND_PATTERNS"; then
        PORTS_TO_KILL="$PORTS_TO_KILL $PORT_PID"
        echo "   ポート $port を使用中: PID=$PORT_PID ($PROCESS_COMMAND)"
        echo "     コマンド: $PROCESS_ARGS"
      else
        echo "   ポート $port を使用中ですが、E2E関連プロセスではないためスキップ: PID=$PORT_PID ($PROCESS_COMMAND)"
      fi
    fi
  fi
done

# pnpm devプロセスを確認（E2E関連のもののみ）
# 親プロセスを再帰的に辿る関数
find_parent_pnpm_dev() {
  local pid=$1
  local max_depth=5
  local depth=0
  
  while [ $depth -lt $max_depth ] && [ -n "$pid" ] && [ "$pid" != "1" ]; do
    PROCESS_ARGS=$(ps -p "$pid" -o args= 2>/dev/null || echo "")
    if echo "$PROCESS_ARGS" | grep -qE "pnpm.*dev|node.*pnpm.*dev"; then
      echo "$pid"
      return 0
    fi
    pid=$(ps -p "$pid" -o ppid= 2>/dev/null | tr -d ' ' || echo "")
    depth=$((depth + 1))
  done
  return 1
}

# ポート3020, 3021, 3326を使用しているプロセスを直接特定
PNPM_DEV_PIDS=""
for port in $E2E_PORTS; do
  PORT_PID=$(lsof -tiTCP:$port -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$PORT_PID" ]; then
    # プロセスツリーを辿って親プロセス（pnpm dev）を探す
    PARENT_PNPM_PID=$(find_parent_pnpm_dev "$PORT_PID" || echo "")
    if [ -n "$PARENT_PNPM_PID" ]; then
      PARENT_ARGS=$(ps -p "$PARENT_PNPM_PID" -o args= 2>/dev/null || echo "")
      if echo "$PNPM_DEV_PIDS" | grep -qvE "\\b$PARENT_PNPM_PID\\b"; then
        PNPM_DEV_PIDS="$PNPM_DEV_PIDS $PARENT_PNPM_PID"
        echo "   pnpm devプロセス（E2E関連、ポート$portの親）: PID=$PARENT_PNPM_PID"
        echo "     コマンド: $PARENT_ARGS"
      fi
    fi
    # ポートを使用しているプロセス自体も確認
    PROCESS_ARGS=$(ps -p "$PORT_PID" -o args= 2>/dev/null || echo "")
    if echo "$PROCESS_ARGS" | grep -qE "pnpm.*dev|node.*pnpm.*dev|next-server|nest.*start.*watch|nest.*dev"; then
      if echo "$PNPM_DEV_PIDS" | grep -qvE "\\b$PORT_PID\\b"; then
        PNPM_DEV_PIDS="$PNPM_DEV_PIDS $PORT_PID"
        echo "   pnpm devプロセス（E2E関連、ポート$port使用）: PID=$PORT_PID"
        echo "     コマンド: $PROCESS_ARGS"
      fi
    fi
  fi
done

if [ -n "$PORTS_TO_KILL" ] || [ -n "$PNPM_DEV_PIDS" ]; then
  echo "⚠️  E2E関連プロセスが起動しています。クリーンな状態で開始するため停止します..."
  echo ""
  
  # ポートを使用しているプロセスを停止
  for pid in $PORTS_TO_KILL; do
    PROCESS_INFO=$(ps -p "$pid" -o pid=,comm=,args= 2>/dev/null | head -1 || echo "")
    if [ -n "$PROCESS_INFO" ]; then
      echo "   プロセスを停止: PID=$pid"
      kill "$pid" 2>/dev/null || true
    fi
  done
  
  # pnpm devプロセスを停止
  for pid in $PNPM_DEV_PIDS; do
    PROCESS_INFO=$(ps -p "$pid" -o pid=,comm=,args= 2>/dev/null | head -1 || echo "")
    if [ -n "$PROCESS_INFO" ]; then
      echo "   pnpm devプロセスを停止: PID=$pid"
      kill "$pid" 2>/dev/null || true
    fi
  done
  
  # プロセスが完全に停止するまで少し待機
  sleep 3
  
  # 強制終了が必要な場合（まだポートが使用されている場合）
  for port in $E2E_PORTS; do
    PORT_PID=$(lsof -tiTCP:$port -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
      PROCESS_COMMAND=$(ps -p "$PORT_PID" -o comm= 2>/dev/null || echo "")
      PROCESS_ARGS=$(ps -p "$PORT_PID" -o args= 2>/dev/null || echo "")
      PROCESS_INFO="$PROCESS_COMMAND $PROCESS_ARGS"
      
      # Dockerプロセスは除外
      if [ "$PROCESS_COMMAND" != "com.docker.backend" ]; then
        # 対象コマンドパターンに一致する場合のみ強制終了
        if echo "$PROCESS_INFO" | grep -qE "$TARGET_COMMAND_PATTERNS"; then
          echo "   ポート $port のプロセスを強制終了: PID=$PORT_PID"
          kill -9 "$PORT_PID" 2>/dev/null || true
        fi
      fi
    fi
  done
  
  echo "✅ E2E関連プロセスを停止しました"
  echo ""
fi

# docker-compose.e2e.ymlで管理されているコンテナの確認と停止
echo "🔍 E2E用のDockerコンテナの起動状態を確認中..."
E2E_CONTAINERS=$(docker-compose -f "$COMPOSE_FILE" ps -q 2>/dev/null || true)

if [ -n "$E2E_CONTAINERS" ]; then
  RUNNING_CONTAINERS=$(docker-compose -f "$COMPOSE_FILE" ps --filter "status=running" -q 2>/dev/null || true)
  if [ -n "$RUNNING_CONTAINERS" ]; then
    echo "⚠️  E2E用のDockerコンテナが起動しています。クリーンな状態で開始するため停止します..."
    echo ""
    docker-compose -f "$COMPOSE_FILE" down
    echo "✅ E2E用のDockerコンテナを停止しました"
    echo ""
  fi
fi

# MySQLコンテナの起動確認と自動起動
echo "🔍 MySQLコンテナの起動状態を確認中..."
MYSQL_RUNNING=$(docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" --format "{{.Names}}" 2>/dev/null)
if [ -z "$MYSQL_RUNNING" ]; then
  echo "ℹ️  MySQLコンテナが起動していません。自動的に起動します..."
  echo ""
  docker-compose -f "$COMPOSE_FILE" up -d mysql
  echo ""
  
  # MySQLの準備完了を待機
  echo "⏳ MySQLの準備完了を待機中..."
  RETRY_COUNT=0
  MAX_RETRIES=30
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-root_password}" >/dev/null 2>&1; then
      echo "✅ MySQLが準備完了しました"
      break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
  done
  
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ MySQLの起動がタイムアウトしました"
    exit 1
  fi
  echo ""
fi
echo "✅ MySQLコンテナが起動しています"
echo ""

# 引数でテスト対象を指定
TARGET=${1:-all}

# 環境変数をエクスポート（テスト実行時に使用）
export BACKEND_PORT
export FRONTEND_PORT
export TEST_ENV="e2e"
export MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
export MYSQL_PORT="${MYSQL_PORT_E2E:-3326}"
export MYSQL_USER="${MYSQL_USER_E2E:-account_book_e2e_user}"
export MYSQL_PASSWORD="${MYSQL_PASSWORD_E2E:-e2e_password}"
export MYSQL_DATABASE="${MYSQL_DATABASE_E2E:-account_book_e2e}"

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
    # タイムアウトを設定（webServer起動120秒 + テスト実行60秒 × テスト数 + 余裕）
    cd apps/frontend
    timeout 600 pnpm test:e2e || {
      EXIT_CODE=$?
      if [ $EXIT_CODE -eq 124 ]; then
        echo "❌ E2Eテストがタイムアウトしました（10分）"
        echo "   webServerの起動やテスト実行に時間がかかっている可能性があります"
      fi
      exit $EXIT_CODE
    }
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
