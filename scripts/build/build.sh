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

# nodeenv、pnpm、その他の一般的なパスをPATHに追加
export PATH="$PROJECT_ROOT/.nodeenv/bin:$HOME/Library/pnpm:/opt/homebrew/bin:$HOME/.local/share/pnpm:$HOME/.npm-global/bin:$PATH"

# pnpmコマンドの存在確認
if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ エラー: pnpmコマンドが見つかりません"
  echo "   セットアップを実行してください: ./scripts/setup/full-setup.sh"
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

