#!/bin/bash

# ビルドチェックスクリプト

set -e

echo "================================"
echo "ビルドチェック開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# 環境をアクティベート
if [ -f ".nodeenv/bin/activate" ]; then
  source .nodeenv/bin/activate
else
  echo "⚠ .nodeenv が見つかりません。setup.sh を先に実行してください。"
  exit 1
fi

# 引数でビルド対象を指定
TARGET=${1:-all}

case $TARGET in
  backend)
    echo "🔨 バックエンドのビルド中..."
    cd apps/backend
    pnpm build
    ;;
  frontend)
    echo "🔨 フロントエンドのビルド中..."
    cd apps/frontend
    pnpm build
    ;;
  types)
    echo "🔨 共有型定義のビルド中..."
    cd libs/types
    pnpm build
    ;;
  utils)
    echo "🔨 共有ユーティリティのビルド中..."
    cd libs/utils
    pnpm build
    ;;
  all)
    echo "🔨 共有型定義のビルド中..."
    (cd libs/types && pnpm build)
    echo ""
    echo "🔨 共有ユーティリティのビルド中..."
    (cd libs/utils && pnpm build)
    echo ""
    echo "🔨 バックエンドのビルド中..."
    (cd apps/backend && pnpm build)
    echo ""
    echo "🔨 フロントエンドのビルド中..."
    (cd apps/frontend && pnpm build)
    ;;
  *)
    echo "使用方法: ./scripts/test/build.sh [backend|frontend|types|utils|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ ビルドチェック完了"

