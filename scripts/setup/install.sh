#!/bin/bash

# 依存パッケージのインストールスクリプト

set -e

echo "================================"
echo "依存パッケージのインストール開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# 環境をアクティベート
if [ -f ".nodeenv/bin/activate" ]; then
  source .nodeenv/bin/activate
  echo "✓ Node.js環境をアクティベート"
else
  echo "⚠ .nodeenv が見つかりません。setup.sh を先に実行してください。"
  exit 1
fi

# pnpmのバージョン確認
echo ""
echo "pnpm version: $(pnpm --version)"
echo "node version: $(node --version)"
echo ""

# 依存パッケージのインストール
echo "📦 依存パッケージをインストール中..."
pnpm install

echo ""
echo "================================"
echo "✅ インストール完了"
echo "================================"

