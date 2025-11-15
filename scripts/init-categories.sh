#!/bin/bash

# カテゴリ初期化スクリプト

set -e

echo "================================"
echo "カテゴリ初期化"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 環境をアクティベート
if [ -f ".nodeenv/bin/activate" ]; then
  source .nodeenv/bin/activate
else
  echo "⚠ .nodeenv が見つかりません。setup.sh を先に実行してください。"
  exit 1
fi

# バックエンドのURLを設定
BACKEND_URL=${BACKEND_URL:-http://localhost:3001}

echo "バックエンドURL: $BACKEND_URL"
echo ""
echo "📦 デフォルトカテゴリを初期化中..."

# curlでカテゴリ初期化APIを呼び出し
if command -v curl &> /dev/null; then
  RESPONSE=$(curl -s -X POST "$BACKEND_URL/categories/initialize" -H "Content-Type: application/json")
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ カテゴリの初期化が完了しました"
    echo ""
    echo "作成されたカテゴリ:"
    echo "$RESPONSE" | grep -o '"count":[0-9]*' | head -1
  else
    echo "⚠ カテゴリの初期化に失敗しました"
    echo "$RESPONSE"
    exit 1
  fi
else
  echo "⚠ curlコマンドが見つかりません"
  exit 1
fi

echo ""
echo "================================"
echo "✅ 初期化完了"
echo "================================"

