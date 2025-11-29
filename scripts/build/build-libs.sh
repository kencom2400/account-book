#!/bin/bash

# 共通ライブラリのビルドスクリプト

set -e

echo "================================"
echo "共通ライブラリのビルド開始"
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

