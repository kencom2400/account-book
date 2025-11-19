#!/bin/bash
# scripts/dev/dev-docker.sh

set -e

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# .envファイルのチェック
check_env() {
    if [ ! -f ".env" ]; then
        echo "⚠️  .env ファイルが見つかりません"
        echo "   .env.example をコピーして .env を作成してください"
        exit 1
    fi
}

# ポートチェック関数
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        local pid=$(lsof -ti :$port)
        local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        echo "⚠️  ポート $port ($service_name) が既に使用されています"
        echo "   プロセス: $process (PID: $pid)"
        echo ""
        echo "以下のいずれかを実行してください:"
        echo "  1. 既存のプロセスを停止: kill $pid"
        echo "  2. ローカル開発サーバーを停止: ./scripts/dev/stop-dev.sh"
        echo "  3. Dockerコンテナを停止: ./scripts/dev/dev-docker.sh stop"
        echo ""
        read -p "既存のプロセスを停止して続行しますか? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill $pid 2>/dev/null || true
            sleep 1
            if lsof -i :$port >/dev/null 2>&1; then
                echo "❌ プロセスの停止に失敗しました。手動で停止してください。"
                exit 1
            else
                echo "✅ ポート $port を解放しました"
            fi
        else
            echo "❌ ポートが使用中のため、起動を中止しました"
            exit 1
        fi
    fi
}

# 起動処理
start_containers() {
    local target=${1:-all}
    local build_flag=${2:-}
    
    check_env
    
    # ポートチェック（バックエンドとフロントエンド）
    echo "🔍 ポートの使用状況を確認中..."
    check_port 3001 "バックエンド"
    check_port 3000 "フロントエンド"
    echo ""
    
    case $target in
      backend)
        echo "🚀 バックエンドコンテナを起動中..."
        if [ -n "$build_flag" ]; then
            docker-compose up -d --build backend
        else
            docker-compose up -d backend
        fi
        echo "✅ バックエンドコンテナを起動しました"
        echo "   ログを確認: docker-compose logs -f backend"
        ;;
      frontend)
        echo "🚀 フロントエンドコンテナを起動中..."
        if [ -n "$build_flag" ]; then
            docker-compose up -d --build frontend
        else
            docker-compose up -d frontend
        fi
        echo "✅ フロントエンドコンテナを起動しました"
        echo "   ログを確認: docker-compose logs -f frontend"
        ;;
      all)
        echo "🚀 すべてのコンテナを起動中..."
        if [ -n "$build_flag" ]; then
            docker-compose up -d --build
        else
            docker-compose up -d
        fi
        echo "✅ すべてのコンテナを起動しました"
        echo "   ログを確認: docker-compose logs -f"
        echo "   状態を確認: docker-compose ps"
        ;;
      *)
        echo "❌ 無効なターゲット: $target"
        echo "   有効な値: backend, frontend, all"
        exit 1
        ;;
    esac
}

# 停止処理
stop_containers() {
    echo "🛑 Dockerコンテナを停止中..."
    docker-compose down
    echo "✅ すべてのコンテナを停止しました"
}

# ログ表示
show_logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# 状態表示
show_status() {
    echo "📊 Dockerコンテナの状態:"
    echo ""
    docker-compose ps
    echo ""
    echo "ログを確認: ./scripts/dev/dev-docker.sh logs [service]"
}

# メイン処理
COMMAND=${1:-start}
TARGET=${2:-all}

case $COMMAND in
  start)
    echo "════════════════════════════════════════════════════════════════"
    echo "   🐳 Docker開発環境を起動"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    start_containers "$TARGET"
    ;;
  stop)
    echo "════════════════════════════════════════════════════════════════"
    echo "   🐳 Docker開発環境を停止"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    stop_containers
    ;;
  restart)
    echo "════════════════════════════════════════════════════════════════"
    echo "   🐳 Docker開発環境を再起動"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    stop_containers
    echo ""
    start_containers "$TARGET"
    ;;
  logs)
    show_logs "$TARGET"
    ;;
  status|ps)
    show_status
    ;;
  build)
    echo "════════════════════════════════════════════════════════════════"
    echo "   🐳 Dockerコンテナをビルドして起動"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    start_containers "$TARGET" "--build"
    ;;
  # 後方互換性のための旧形式
  backend|frontend|all)
    echo "════════════════════════════════════════════════════════════════"
    echo "   🐳 Docker開発環境を起動（フォアグラウンド）"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    check_env
    echo "⚠️  注意: この形式はフォアグラウンドで実行されます"
    echo "   バックグラウンドで起動する場合は: ./scripts/dev/dev-docker.sh start $COMMAND"
    echo ""
    case $COMMAND in
      backend)
        docker-compose up backend
        ;;
      frontend)
        docker-compose up frontend
        ;;
      all)
        docker-compose up
        ;;
    esac
    ;;
  *)
    echo "使用方法: ./scripts/dev/dev-docker.sh <command> [target]"
    echo ""
    echo "コマンド:"
    echo "  start [backend|frontend|all]  - コンテナをバックグラウンドで起動（デフォルト: all）"
    echo "  stop                          - コンテナを停止"
    echo "  restart [backend|frontend|all] - コンテナを再起動（デフォルト: all）"
    echo "  logs [service]               - ログを表示（サービス名を指定可能）"
    echo "  status|ps                    - コンテナの状態を表示"
    echo "  build [backend|frontend|all] - コンテナをビルドして起動"
    echo ""
    echo "例:"
    echo "  ./scripts/dev/dev-docker.sh start        # すべてのコンテナを起動"
    echo "  ./scripts/dev/dev-docker.sh start backend # バックエンドのみ起動"
    echo "  ./scripts/dev/dev-docker.sh stop         # すべてのコンテナを停止"
    echo "  ./scripts/dev/dev-docker.sh logs         # すべてのログを表示"
    echo "  ./scripts/dev/dev-docker.sh logs backend  # バックエンドのログを表示"
    echo "  ./scripts/dev/dev-docker.sh status       # コンテナの状態を確認"
    exit 1
    ;;
esac

