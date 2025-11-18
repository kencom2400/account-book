#!/bin/bash

# 共通ライブラリのビルドスクリプト

set -e

echo "================================"
echo "共通ライブラリのビルド開始"
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

# typesライブラリをビルド
echo ""
echo "📦 typesライブラリをビルド中..."
cd libs/types
pnpm build
echo "✓ typesライブラリのビルド完了"

# utilsライブラリをビルド
echo ""
echo "📦 utilsライブラリをビルド中..."
cd ../utils
pnpm build
echo "✓ utilsライブラリのビルド完了"

# プロジェクトルートに戻る
cd ../..

echo ""
echo "================================"
echo "✅ 共通ライブラリのビルド完了"
echo "================================"

