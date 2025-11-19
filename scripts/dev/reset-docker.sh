#!/bin/bash
# scripts/dev/reset-docker.sh

echo "════════════════════════════════════════════════════════════════"
echo "   🐳 Docker環境をリセット"
echo "════════════════════════════════════════════════════════════════"
echo ""

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

echo "⚠️  以下を実行します:"
echo "   - すべてのコンテナを停止"
echo "   - すべてのコンテナを削除"
echo "   - すべてのイメージを削除"
echo "   - すべてのボリュームを削除"
echo ""
read -p "続行しますか? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "キャンセルしました"
    exit 1
fi

# コンテナとボリュームを削除
docker-compose down -v --rmi all

# 孤立したボリュームを削除
docker volume prune -f

echo ""
echo "✅ Docker環境をリセットしました"

