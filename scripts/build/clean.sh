#!/bin/bash

# クリーンアップスクリプト

echo "================================"
echo "クリーンアップ開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# Voltaを優先的に使用
export PATH="$HOME/.volta/bin:$PATH"

echo ""
echo "🧹 ビルド成果物を削除中..."

# バックエンドのクリーンアップ
if [ -d "apps/backend/dist" ]; then
  rm -rf apps/backend/dist
  echo "✓ apps/backend/dist を削除"
fi

# フロントエンドのクリーンアップ
if [ -d "apps/frontend/.next" ]; then
  rm -rf apps/frontend/.next
  echo "✓ apps/frontend/.next を削除"
fi

# typesのクリーンアップ
if [ -d "libs/types/dist" ]; then
  rm -rf libs/types/dist
  echo "✓ libs/types/dist を削除"
fi

# utilsのクリーンアップ
if [ -d "libs/utils/dist" ]; then
  rm -rf libs/utils/dist
  echo "✓ libs/utils/dist を削除"
fi

# ログファイルのクリーンアップ
if [ -d "logs" ]; then
  rm -rf logs/*.log logs/*.pid
  echo "✓ ログファイルを削除"
fi

echo ""
echo "================================"
echo "✅ クリーンアップ完了"
echo "================================"

