#!/bin/bash

# フルセットアップスクリプト
# プロジェクトのゼロからのセットアップを実行

set -e

echo "================================"
echo "フルセットアップ開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 1. 環境セットアップ
if [ ! -d ".nodeenv" ]; then
  echo ""
  echo "📦 Node.js環境をセットアップ中..."
  ./scripts/setup.sh
else
  echo "✓ Node.js環境は既にセットアップ済み"
fi

# 2. 依存パッケージのインストール
echo ""
echo "📦 依存パッケージをインストール中..."
./scripts/install.sh

# 3. 共通ライブラリのビルド
echo ""
echo "📦 共通ライブラリをビルド中..."
./scripts/build-libs.sh

# 4. 環境変数ファイルの作成
echo ""
echo "📝 環境変数ファイルを確認中..."

# バックエンドの.env
if [ ! -f "apps/backend/.env" ]; then
  echo "📝 apps/backend/.env を作成中..."
  cat > apps/backend/.env << 'EOF'
NODE_ENV=development
PORT=3001

# 暗号化キー（32文字以上のランダムな文字列に変更してください）
CRYPTO_KEY=change-this-to-a-random-32-char-string-for-production
CRYPTO_ALGORITHM=aes-256-gcm

# ログ設定
LOG_LEVEL=info
EOF
  echo "✓ apps/backend/.env を作成しました"
  echo "  ⚠ CRYPTO_KEYを本番用のランダムな文字列に変更してください"
else
  echo "✓ apps/backend/.env は既に存在します"
fi

# フロントエンドの.env.local
if [ ! -f "apps/frontend/.env.local" ]; then
  echo "📝 apps/frontend/.env.local を作成中..."
  cat > apps/frontend/.env.local << 'EOF'
# バックエンドAPIのURL
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
  echo "✓ apps/frontend/.env.local を作成しました"
else
  echo "✓ apps/frontend/.env.local は既に存在します"
fi

echo ""
echo "================================"
echo "✅ フルセットアップ完了"
echo "================================"
echo ""
echo "次のステップ:"
echo "  1. バックエンドを起動:"
echo "     ./scripts/dev.sh backend"
echo ""
echo "  2. カテゴリを初期化（別のターミナルで）:"
echo "     ./scripts/init-categories.sh"
echo ""
echo "  3. フロントエンドを起動（別のターミナルで）:"
echo "     ./scripts/dev.sh frontend"
echo ""
echo "  または、並列起動:"
echo "     ./scripts/dev-parallel.sh"
echo ""

