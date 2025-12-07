#!/bin/bash

# ローカルCI確認スクリプト
# GitHub ActionsのCIと同じチェックをローカルで実行する

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "=================================="
echo "ローカルCI確認スクリプト"
echo "=================================="
echo ""

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーカウント
ERROR_COUNT=0

# ステップ1: Lint
echo "📋 ステップ1: Lintチェック"
echo "----------------------------------"
if ./scripts/test/lint.sh; then
  echo -e "${GREEN}✅ Lintチェック: 成功${NC}"
else
  echo -e "${RED}❌ Lintチェック: 失敗${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo ""

# ステップ2: Build
echo "📦 ステップ2: ビルドチェック"
echo "----------------------------------"
if pnpm build; then
  echo -e "${GREEN}✅ ビルドチェック: 成功${NC}"
else
  echo -e "${RED}❌ ビルドチェック: 失敗${NC}"
  ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo ""

# ステップ3: Unit Tests（オプション）
if [ "$1" = "--with-tests" ] || [ "$1" = "-t" ]; then
  echo "🧪 ステップ3: ユニットテスト"
  echo "----------------------------------"
  if ./scripts/test/test.sh all; then
    echo -e "${GREEN}✅ ユニットテスト: 成功${NC}"
  else
    echo -e "${RED}❌ ユニットテスト: 失敗${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  echo ""
fi

# 結果サマリー
echo "=================================="
echo "結果サマリー"
echo "=================================="
if [ $ERROR_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ すべてのチェックが成功しました${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERROR_COUNT 個のチェックが失敗しました${NC}"
  exit 1
fi

