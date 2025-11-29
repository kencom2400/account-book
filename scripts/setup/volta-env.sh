#!/bin/bash

# Volta環境設定スクリプト
# すべてのスクリプトおよび手動実行時にsourceして使用

# Voltaを優先的に使用
export PATH="$HOME/.volta/bin:$HOME/Library/pnpm:/opt/homebrew/bin:$HOME/.local/share/pnpm:$HOME/.npm-global/bin:$PATH"

# Volta環境変数
export VOLTA_HOME="$HOME/.volta"

# pnpm設定
export PNPM_HOME="$HOME/Library/pnpm"

# 環境確認
check_volta_env() {
  if ! command -v volta >/dev/null 2>&1; then
    echo "⚠️  警告: Voltaがインストールされていません"
    echo "   インストール方法: https://volta.sh/"
    return 1
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    echo "⚠️  警告: pnpmがインストールされていません"
    echo "   実行: volta install pnpm"
    return 1
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "⚠️  警告: Node.jsがインストールされていません"
    echo "   実行: volta install node"
    return 1
  fi

  return 0
}

# 環境情報表示（オプション）
show_volta_info() {
  echo "📦 Volta環境:"
  echo "   Volta:  $(volta --version 2>/dev/null || echo 'not found')"
  echo "   Node:   $(node --version 2>/dev/null || echo 'not found')"
  echo "   pnpm:   $(pnpm --version 2>/dev/null || echo 'not found')"
  echo "   PATH:   $PATH"
}

# このスクリプトが直接実行された場合（sourceではなく）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "ℹ️  このスクリプトはsourceコマンドで読み込んでください:"
  echo "   source ${BASH_SOURCE[0]}"
  echo ""
  echo "または、.zshrc / .bashrc に以下を追加:"
  echo "   source $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  exit 1
fi

# sourceされた場合は環境確認を実行
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  check_volta_env
fi

