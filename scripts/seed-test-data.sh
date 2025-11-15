#!/bin/bash

# テストデータ投入スクリプト

set -e

echo "================================"
echo "テストデータ投入開始"
echo "================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# バックエンドのURLを設定
BACKEND_URL=${BACKEND_URL:-http://localhost:3001/api}

echo "バックエンドURL: $BACKEND_URL"
echo ""

# 今月の日付を取得
CURRENT_YEAR=$(date +%Y)
CURRENT_MONTH=$(date +%m)

# 収入データ
echo "📝 収入データを投入中..."
curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-25T00:00:00.000Z\",
    \"amount\": 350000,
    \"category\": {
      \"id\": \"income-salary\",
      \"name\": \"給与所得\",
      \"type\": \"income\"
    },
    \"description\": \"11月分給与\",
    \"institutionId\": \"bank-001\",
    \"accountId\": \"account-001\"
  }" > /dev/null
echo "✓ 給与データを投入"

# 支出データ（食費）
echo "📝 支出データ（食費）を投入中..."
curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-01T00:00:00.000Z\",
    \"amount\": -3500,
    \"category\": {
      \"id\": \"expense-food-groceries\",
      \"name\": \"食料品\",
      \"type\": \"expense\"
    },
    \"description\": \"スーパーマーケット\",
    \"institutionId\": \"card-001\",
    \"accountId\": \"account-002\"
  }" > /dev/null
echo "✓ 食料品データを投入"

curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-05T00:00:00.000Z\",
    \"amount\": -2800,
    \"category\": {
      \"id\": \"expense-food-dining\",
      \"name\": \"外食\",
      \"type\": \"expense\"
    },
    \"description\": \"レストラン\",
    \"institutionId\": \"card-001\",
    \"accountId\": \"account-002\"
  }" > /dev/null
echo "✓ 外食データを投入"

curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-08T00:00:00.000Z\",
    \"amount\": -450,
    \"category\": {
      \"id\": \"expense-food-cafe\",
      \"name\": \"カフェ\",
      \"type\": \"expense\"
    },
    \"description\": \"スターバックス\",
    \"institutionId\": \"card-001\",
    \"accountId\": \"account-002\"
  }" > /dev/null
echo "✓ カフェデータを投入"

# 支出データ（交通費）
echo "📝 支出データ（交通費）を投入中..."
curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-03T00:00:00.000Z\",
    \"amount\": -5000,
    \"category\": {
      \"id\": \"expense-transport-train\",
      \"name\": \"電車\",
      \"type\": \"expense\"
    },
    \"description\": \"定期券\",
    \"institutionId\": \"card-001\",
    \"accountId\": \"account-002\"
  }" > /dev/null
echo "✓ 電車データを投入"

curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-10T00:00:00.000Z\",
    \"amount\": -1200,
    \"category\": {
      \"id\": \"expense-transport-taxi\",
      \"name\": \"タクシー\",
      \"type\": \"expense\"
    },
    \"description\": \"タクシー利用\",
    \"institutionId\": \"card-001\",
    \"accountId\": \"account-002\"
  }" > /dev/null
echo "✓ タクシーデータを投入"

# 支出データ（娯楽費）
echo "📝 支出データ（娯楽費）を投入中..."
curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-12T00:00:00.000Z\",
    \"amount\": -4500,
    \"category\": {
      \"id\": \"expense-entertainment\",
      \"name\": \"娯楽費\",
      \"type\": \"expense\"
    },
    \"description\": \"映画館\",
    \"institutionId\": \"card-001\",
    \"accountId\": \"account-002\"
  }" > /dev/null
echo "✓ 娯楽費データを投入"

# 支出データ（住居費）
echo "📝 支出データ（住居費）を投入中..."
curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-01T00:00:00.000Z\",
    \"amount\": -80000,
    \"category\": {
      \"id\": \"expense-housing-rent\",
      \"name\": \"家賃\",
      \"type\": \"expense\"
    },
    \"description\": \"11月分家賃\",
    \"institutionId\": \"bank-001\",
    \"accountId\": \"account-001\"
  }" > /dev/null
echo "✓ 家賃データを投入"

# 支出データ（水道光熱費）
echo "📝 支出データ（水道光熱費）を投入中..."
curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-15T00:00:00.000Z\",
    \"amount\": -8500,
    \"category\": {
      \"id\": \"expense-utility\",
      \"name\": \"水道光熱費\",
      \"type\": \"expense\"
    },
    \"description\": \"電気代\",
    \"institutionId\": \"bank-001\",
    \"accountId\": \"account-001\"
  }" > /dev/null
echo "✓ 電気代データを投入"

# 支出データ（通信費）
echo "📝 支出データ（通信費）を投入中..."
curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"${CURRENT_YEAR}-${CURRENT_MONTH}-05T00:00:00.000Z\",
    \"amount\": -4980,
    \"category\": {
      \"id\": \"expense-communication\",
      \"name\": \"通信費\",
      \"type\": \"expense\"
    },
    \"description\": \"携帯電話料金\",
    \"institutionId\": \"card-001\",
    \"accountId\": \"account-002\"
  }" > /dev/null
echo "✓ 通信費データを投入"

echo ""
echo "================================"
echo "✅ テストデータ投入完了"
echo "================================"
echo ""
echo "投入したデータ:"
echo "  - 収入: 1件（¥350,000）"
echo "  - 支出: 10件（合計約¥111,000）"
echo ""
echo "確認方法:"
echo "  curl $BACKEND_URL/transactions?year=$CURRENT_YEAR&month=$CURRENT_MONTH"
echo ""

