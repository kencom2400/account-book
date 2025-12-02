#!/bin/bash

# プロジェクトビルドスクリプト

set -e

echo "================================"
echo "プロジェクトビルド開始"
echo "================================"

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# Volta環境設定を読み込み
source "$PROJECT_ROOT/scripts/setup/volta-env.sh"

# pnpmコマンドの存在確認
if ! check_volta_env; then
  echo "❌ エラー: 必要なツールがインストールされていません"
  echo "   詳細: README.mdを参照"
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

