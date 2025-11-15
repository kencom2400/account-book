#!/bin/bash

# 開発サーバー起動スクリプト

set -e

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 環境をアクティベート
if [ -f ".nodeenv/bin/activate" ]; then
  source .nodeenv/bin/activate
else
  echo "⚠ .nodeenv が見つかりません。setup.sh を先に実行してください。"
  exit 1
fi

# 引数で起動対象を指定
TARGET=${1:-all}

case $TARGET in
  backend)
    echo "🚀 バックエンド開発サーバーを起動..."
    cd apps/backend
    pnpm dev
    ;;
  frontend)
    echo "🚀 フロントエンド開発サーバーを起動..."
    cd apps/frontend
    pnpm dev
    ;;
  all)
    echo "🚀 バックエンドとフロントエンドの開発サーバーを起動..."
    echo ""
    echo "注意: 別々のターミナルで起動してください"
    echo "  ターミナル1: ./scripts/dev.sh backend"
    echo "  ターミナル2: ./scripts/dev.sh frontend"
    echo ""
    echo "または、以下のコマンドでバックグラウンド起動:"
    echo "  ./scripts/dev-parallel.sh"
    ;;
  *)
    echo "使用方法: ./scripts/dev.sh [backend|frontend|all]"
    exit 1
    ;;
esac

