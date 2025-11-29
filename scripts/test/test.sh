#!/bin/bash

# テスト実行スクリプト
# デフォルトでカバレッジ付きテストを実行（CIと同じ挙動）

set -e

echo "================================"
echo "テスト実行開始（カバレッジ付き）"
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

# 引数でテスト対象を指定
TARGET=${1:-all}
TEST_TYPE=${2:-unit}  # unit, e2e, all

case $TARGET in
  backend)
    echo "🧪 バックエンドのテスト実行中..."
    cd apps/backend
    if [ "$TEST_TYPE" = "e2e" ]; then
      pnpm test:e2e
    elif [ "$TEST_TYPE" = "all" ]; then
      pnpm test:cov
      pnpm test:e2e
    else
      pnpm test:cov
    fi
    ;;
  frontend)
    echo "🧪 フロントエンドのテスト実行中..."
    cd apps/frontend
    if [ "$TEST_TYPE" = "e2e" ]; then
      pnpm test:e2e
    elif [ "$TEST_TYPE" = "all" ]; then
      pnpm test:cov
      pnpm test:e2e
    else
      pnpm test:cov
    fi
    ;;
  all)
    echo "🧪 すべてのテスト実行中..."
    if [ "$TEST_TYPE" = "e2e" ]; then
      ./scripts/test/test-e2e.sh all
    elif [ "$TEST_TYPE" = "all" ]; then
      # ユニットテスト（カバレッジ付き）
      echo "--- ユニットテスト（カバレッジ付き） ---"
      cd apps/backend
      pnpm test:cov
      cd ../frontend
      pnpm test:cov
      # E2Eテスト
      cd ../..
      ./scripts/test/test-e2e.sh all
    else
      # ユニットテストのみ（カバレッジ付き）
      cd apps/backend
      pnpm test:cov
      echo ""
      cd ../frontend
      pnpm test:cov
    fi
    ;;
  *)
    echo "使用方法: ./scripts/test/test.sh [backend|frontend|all] [unit|e2e|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ テスト完了"

