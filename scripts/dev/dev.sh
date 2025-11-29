#!/bin/bash

# 開発サーバー起動スクリプト

set -e

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# Voltaを優先的に使用
export PATH="$HOME/.volta/bin:$HOME/Library/pnpm:/opt/homebrew/bin:$PATH"

# 開発環境の起動方法を選択
echo "開発環境の起動方法を選択してください:"
echo "  1) ローカル環境 (Volta)"
echo "  2) Docker環境 (推奨)"
read -p "選択 (1/2): " -n 1 -r
echo

if [[ $REPLY == "2" ]]; then
    ./scripts/dev/dev-docker.sh "$@"
    exit 0
fi

# ローカル環境の場合の処理

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
    echo "  ターミナル1: ./scripts/dev/dev.sh backend"
    echo "  ターミナル2: ./scripts/dev/dev.sh frontend"
    echo ""
    echo "または、以下のコマンドでバックグラウンド起動:"
    echo "  ./scripts/dev/dev-parallel.sh"
    ;;
  *)
    echo "使用方法: ./scripts/dev/dev.sh [backend|frontend|all]"
    exit 1
    ;;
esac

