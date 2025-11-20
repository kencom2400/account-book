#!/bin/bash

# データベース停止スクリプト

set -e

echo "🛑 MySQLデータベースを停止します..."

cd "$(dirname "$0")/../.."

docker-compose stop mysql

echo "✅ MySQLデータベースを停止しました"

