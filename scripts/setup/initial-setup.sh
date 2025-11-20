#!/bin/bash

# 初回環境セットアップスクリプト
# 新しい開発者がプロジェクトに初めて参加する際に、
# ワンコマンドで必要なすべての環境構築を行う

set -e

echo "================================"
echo "初回環境セットアップ開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーメッセージ出力関数
error_msg() {
  echo -e "${RED}✗ $1${NC}"
}

# 成功メッセージ出力関数
success_msg() {
  echo -e "${GREEN}✓ $1${NC}"
}

# 警告メッセージ出力関数
warning_msg() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# OS検出
detect_os() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macOS"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Linux"
  else
    echo "Unknown"
  fi
}

OS=$(detect_os)

# 1. 前提条件チェック
echo ""
echo "=== 前提条件チェック ==="
echo ""

# Python 3.8+ チェック
if command -v python3 &> /dev/null; then
  PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
  PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
  PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
  
  if { [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -ge 8 ]; } || [ "$PYTHON_MAJOR" -gt 3 ]; then
    success_msg "Python $PYTHON_VERSION が見つかりました"
  else
    error_msg "Python 3.8以上が必要です（現在: $PYTHON_VERSION）"
    exit 1
  fi
else
  error_msg "Python 3が見つかりません"
  echo ""
  echo "Pythonをインストールしてください:"
  if [ "$OS" == "macOS" ]; then
    echo "  brew install python@3"
  elif [ "$OS" == "Linux" ]; then
    echo "  sudo apt update && sudo apt install python3 python3-pip"
  fi
  exit 1
fi

# pip3 チェック
if command -v pip3 &> /dev/null; then
  success_msg "pip3 が利用可能です"
else
  error_msg "pip3 が見つかりません"
  echo ""
  echo "pip3をインストールしてください:"
  if [ "$OS" == "macOS" ]; then
    echo "  brew install python@3"
  elif [ "$OS" == "Linux" ]; then
    echo "  sudo apt update && sudo apt install python3-pip"
  fi
  exit 1
fi

# 2. 必須ツールのインストール
echo ""
echo "=== 必須ツールのインストール ==="
echo ""

# nodeenv チェック & インストール
if command -v nodeenv &> /dev/null; then
  success_msg "nodeenv は既にインストールされています"
else
  echo "📦 nodeenv をインストール中..."
  pip3 install --user nodeenv
  
  if command -v nodeenv &> /dev/null; then
    success_msg "nodeenv をインストールしました"
  else
    error_msg "nodeenv のインストールに失敗しました"
    echo ""
    echo "手動でインストールしてください:"
    echo "  pip3 install --user nodeenv"
    echo ""
    echo "インストール後、PATHに追加してください:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    exit 1
  fi
fi

# 3. 任意ツールのチェック（情報提供のみ）
echo ""
echo "=== 任意ツールのチェック ==="
echo ""

OPTIONAL_TOOLS_NEEDED=false

# gh (GitHub CLI) チェック
if command -v gh &> /dev/null; then
  success_msg "GitHub CLI (gh) がインストールされています"
else
  warning_msg "GitHub CLI (gh) がインストールされていません（任意）"
  OPTIONAL_TOOLS_NEEDED=true
fi

# jq チェック
if command -v jq &> /dev/null; then
  success_msg "jq がインストールされています"
else
  warning_msg "jq がインストールされていません（任意）"
  OPTIONAL_TOOLS_NEEDED=true
fi

if [[ "$OPTIONAL_TOOLS_NEEDED" == "true" ]]; then
  echo ""
  echo "📝 注意: 任意ツールはGitHub連携スクリプトを使用する場合にのみ必要です"
  echo ""
  if [ "$OS" == "macOS" ]; then
    echo "  インストール方法（macOS）:"
    echo "    brew install gh jq"
  elif [ "$OS" == "Linux" ]; then
    echo "  インストール方法（Linux）:"
    echo "    GitHub CLI: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "    jq: sudo apt install jq"
  fi
fi

# 4. nodeenv 環境のセットアップ
echo ""
echo "=== Node.js 環境のセットアップ ==="
echo ""

if [ -d "$PROJECT_ROOT/.nodeenv" ]; then
  success_msg ".nodeenv 環境は既に存在します"
else
  echo "📦 Node.js 20.18.1 環境を作成中..."
  nodeenv --node=20.18.1 --prebuilt .nodeenv
  success_msg ".nodeenv 環境を作成しました"
fi

# 環境をアクティベート
if [ -f "$PROJECT_ROOT/.nodeenv/bin/activate" ]; then
  source "$PROJECT_ROOT/.nodeenv/bin/activate"
  success_msg "Node.js 環境をアクティベートしました"
else
  error_msg ".nodeenv/bin/activate が見つかりません"
  exit 1
fi

# Node.jsバージョン確認
NODE_VERSION=$(node --version)
success_msg "Node.js バージョン: $NODE_VERSION"

# corepack 有効化
echo ""
echo "📦 corepack を有効化中..."
corepack enable
success_msg "corepack を有効化しました"

# pnpm セットアップ
echo ""
echo "📦 pnpm 8.15.0 をセットアップ中..."
corepack prepare pnpm@8.15.0 --activate
PNPM_VERSION=$(pnpm --version)
success_msg "pnpm バージョン: $PNPM_VERSION"

# 5. プロジェクトのセットアップ
echo ""
echo "=== プロジェクトのセットアップ ==="
echo ""

echo "📦 プロジェクトをセットアップ中..."
./scripts/setup/full-setup.sh

# 6. 検証
echo ""
echo "=== 環境の検証 ==="
echo ""

echo "🧪 ビルドスクリプトが正常に実行できるか確認中..."
if ./scripts/build/build.sh > /dev/null 2>&1; then
  success_msg "ビルドスクリプトが正常に実行できます"
else
  warning_msg "ビルドスクリプトの実行に問題がある可能性があります"
  echo "  詳細を確認するには: ./scripts/build/build.sh"
fi

# 完了メッセージ
echo ""
echo "================================"
echo "✅ 初回環境セットアップ完了"
echo "================================"
echo ""
echo "次のステップ:"
echo ""
echo "  1. 環境をアクティベート（新しいシェルの場合）:"
echo "     source .nodeenv/bin/activate"
echo ""
echo "  2. 開発サーバーを起動:"
echo "     ./scripts/dev/dev-parallel.sh"
echo "     # または"
echo "     ./scripts/dev/dev.sh"
echo ""
echo "  3. Docker版を使用する場合:"
echo "     ./scripts/dev/dev-docker.sh start"
echo ""

if [[ "$OPTIONAL_TOOLS_NEEDED" == "true" ]]; then
  echo "任意のツール（GitHub 連携用）:"
  echo ""
  if [ "$OS" == "macOS" ]; then
    echo "  brew install gh jq"
  elif [ "$OS" == "Linux" ]; then
    echo "  GitHub CLI: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "  jq: sudo apt install jq"
  fi
  echo ""
fi

echo "詳細は README.md を参照してください。"
echo ""

