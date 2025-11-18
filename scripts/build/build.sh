#!/bin/bash

# プロジェクトビルドスクリプト

set -e

echo "================================"
echo "プロジェクトビルド開始"
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

# 共通ライブラリをビルド
echo ""
echo "📦 共通ライブラリをビルド中..."
./scripts/build/build-libs.sh

# バックエンドをビルド
echo ""
echo "📦 バックエンドをビルド中..."
cd apps/backend
pnpm build
echo "✓ バックエンドのビルド完了"

# フロントエンドをビルド
echo ""
echo "📦 フロントエンドをビルド中..."
cd ../frontend
pnpm build
echo "✓ フロントエンドのビルド完了"

# プロジェクトルートに戻る
cd ../..

echo ""
echo "================================"
echo "✅ プロジェクトビルド完了"
echo "================================"

