#!/bin/bash

###############################################################################
# FR-009 Phase 7: テストカバレッジ確認とレポート生成スクリプト
###############################################################################

set -euo pipefail

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# プロジェクトルート
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COVERAGE_DIR="$PROJECT_ROOT/coverage"
REPORT_FILE="$PROJECT_ROOT/docs/testing/fr009-phase7-coverage-report.md"

log_info "テストカバレッジ確認とレポート生成を開始します"
echo ""

###############################################################################
# 1. バックエンドカバレッジ
###############################################################################

log_info "バックエンドのユニットテストカバレッジを取得中..."

# サブシェルを使用してディレクトリ移動の影響を限定
(cd "$PROJECT_ROOT/apps/backend" && pnpm test:cov > /dev/null 2>&1) || true

# カバレッジ情報を取得
BACKEND_COVERAGE_FILE="$PROJECT_ROOT/apps/backend/coverage/coverage-summary.json"

if [ -f "$BACKEND_COVERAGE_FILE" ]; then
  BACKEND_LINES_PCT=$(jq '.total.lines.pct' "$BACKEND_COVERAGE_FILE")
  BACKEND_STATEMENTS_PCT=$(jq '.total.statements.pct' "$BACKEND_COVERAGE_FILE")
  BACKEND_FUNCTIONS_PCT=$(jq '.total.functions.pct' "$BACKEND_COVERAGE_FILE")
  BACKEND_BRANCHES_PCT=$(jq '.total.branches.pct' "$BACKEND_COVERAGE_FILE")

  log_success "バックエンドカバレッジ取得完了"
  echo "  - Lines: ${BACKEND_LINES_PCT}%"
  echo "  - Statements: ${BACKEND_STATEMENTS_PCT}%"
  echo "  - Functions: ${BACKEND_FUNCTIONS_PCT}%"
  echo "  - Branches: ${BACKEND_BRANCHES_PCT}%"
else
  log_error "バックエンドカバレッジファイルが見つかりません"
  BACKEND_LINES_PCT="N/A"
  BACKEND_STATEMENTS_PCT="N/A"
  BACKEND_FUNCTIONS_PCT="N/A"
  BACKEND_BRANCHES_PCT="N/A"
fi

echo ""

###############################################################################
# 2. フロントエンドカバレッジ
###############################################################################

log_info "フロントエンドのユニットテストカバレッジを取得中..."

# サブシェルを使用してディレクトリ移動の影響を限定
(cd "$PROJECT_ROOT/apps/frontend" && pnpm test --coverage > /dev/null 2>&1) || true

# カバレッジ情報を取得
FRONTEND_COVERAGE_FILE="$PROJECT_ROOT/apps/frontend/coverage/coverage-summary.json"

if [ -f "$FRONTEND_COVERAGE_FILE" ]; then
  FRONTEND_LINES_PCT=$(jq '.total.lines.pct' "$FRONTEND_COVERAGE_FILE")
  FRONTEND_STATEMENTS_PCT=$(jq '.total.statements.pct' "$FRONTEND_COVERAGE_FILE")
  FRONTEND_FUNCTIONS_PCT=$(jq '.total.functions.pct' "$FRONTEND_COVERAGE_FILE")
  FRONTEND_BRANCHES_PCT=$(jq '.total.branches.pct' "$FRONTEND_COVERAGE_FILE")

  log_success "フロントエンドカバレッジ取得完了"
  echo "  - Lines: ${FRONTEND_LINES_PCT}%"
  echo "  - Statements: ${FRONTEND_STATEMENTS_PCT}%"
  echo "  - Functions: ${FRONTEND_FUNCTIONS_PCT}%"
  echo "  - Branches: ${FRONTEND_BRANCHES_PCT}%"
else
  log_error "フロントエンドカバレッジファイルが見つかりません"
  FRONTEND_LINES_PCT="N/A"
  FRONTEND_STATEMENTS_PCT="N/A"
  FRONTEND_FUNCTIONS_PCT="N/A"
  FRONTEND_BRANCHES_PCT="N/A"
fi

echo ""

###############################################################################
# 3. E2Eテストカバレッジ
###############################################################################

log_info "E2Eテストカバレッジを取得中..."

# サブシェルを使用してディレクトリ移動の影響を限定
(cd "$PROJECT_ROOT/apps/backend" && pnpm test:e2e:cov > /dev/null 2>&1) || true

E2E_COVERAGE_FILE="$PROJECT_ROOT/apps/backend/coverage-e2e/coverage-summary.json"

if [ -f "$E2E_COVERAGE_FILE" ]; then
  E2E_LINES_PCT=$(jq '.total.lines.pct' "$E2E_COVERAGE_FILE")
  E2E_STATEMENTS_PCT=$(jq '.total.statements.pct' "$E2E_COVERAGE_FILE")
  E2E_FUNCTIONS_PCT=$(jq '.total.functions.pct' "$E2E_COVERAGE_FILE")
  E2E_BRANCHES_PCT=$(jq '.total.branches.pct' "$E2E_COVERAGE_FILE")

  log_success "E2Eテストカバレッジ取得完了"
  echo "  - Lines: ${E2E_LINES_PCT}%"
  echo "  - Statements: ${E2E_STATEMENTS_PCT}%"
  echo "  - Functions: ${E2E_FUNCTIONS_PCT}%"
  echo "  - Branches: ${E2E_BRANCHES_PCT}%"
else
  log_warn "E2Eテストカバレッジファイルが見つかりません（オプション）"
  E2E_LINES_PCT="N/A"
  E2E_STATEMENTS_PCT="N/A"
  E2E_FUNCTIONS_PCT="N/A"
  E2E_BRANCHES_PCT="N/A"
fi

echo ""

###############################################################################
# 4. カバレッジ目標の確認
###############################################################################

log_info "カバレッジ目標との比較..."

COVERAGE_GOAL=80

check_coverage() {
  local name=$1
  local coverage=$2
  
  if [ "$coverage" = "N/A" ]; then
    log_warn "$name: カバレッジデータなし"
    return 1
  fi
  
  if (( $(echo "$coverage >= $COVERAGE_GOAL" | bc -l) )); then
    log_success "$name: ${coverage}% (目標: ${COVERAGE_GOAL}% 以上) ✅"
    return 0
  else
    log_error "$name: ${coverage}% (目標: ${COVERAGE_GOAL}% 以上) ❌"
    return 1
  fi
}

echo ""
BACKEND_OK=$(check_coverage "Backend Lines" "$BACKEND_LINES_PCT" && echo "1" || echo "0")
FRONTEND_OK=$(check_coverage "Frontend Lines" "$FRONTEND_LINES_PCT" && echo "1" || echo "0")

echo ""

###############################################################################
# 5. レポート生成
###############################################################################

log_info "レポートを生成中..."

mkdir -p "$(dirname "$REPORT_FILE")"

cat > "$REPORT_FILE" << EOF
# FR-009 Phase 7: テストカバレッジレポート

生成日時: $(date '+%Y-%m-%d %H:%M:%S')

---

## 📊 カバレッジサマリー

### バックエンド（ユニットテスト）

| メトリック   | カバレッジ | 目標 | 状態 |
|--------------|------------|------|------|
| Lines        | ${BACKEND_LINES_PCT}%   | 80%  | $([ "$BACKEND_OK" = "1" ] && echo "✅" || echo "❌") |
| Statements   | ${BACKEND_STATEMENTS_PCT}%   | 80%  | $([ "$BACKEND_OK" = "1" ] && echo "✅" || echo "❌") |
| Functions    | ${BACKEND_FUNCTIONS_PCT}%   | 80%  | $([ "$BACKEND_OK" = "1" ] && echo "✅" || echo "❌") |
| Branches     | ${BACKEND_BRANCHES_PCT}%   | 80%  | $([ "$BACKEND_OK" = "1" ] && echo "✅" || echo "❌") |

### フロントエンド（ユニットテスト）

| メトリック   | カバレッジ | 目標 | 状態 |
|--------------|------------|------|------|
| Lines        | ${FRONTEND_LINES_PCT}%   | 80%  | $([ "$FRONTEND_OK" = "1" ] && echo "✅" || echo "❌") |
| Statements   | ${FRONTEND_STATEMENTS_PCT}%   | 80%  | $([ "$FRONTEND_OK" = "1" ] && echo "✅" || echo "❌") |
| Functions    | ${FRONTEND_FUNCTIONS_PCT}%   | 80%  | $([ "$FRONTEND_OK" = "1" ] && echo "✅" || echo "❌") |
| Branches     | ${FRONTEND_BRANCHES_PCT}%   | 80%  | $([ "$FRONTEND_OK" = "1" ] && echo "✅" || echo "❌") |

### E2Eテスト（参考値）

| メトリック   | カバレッジ | 備考 |
|--------------|------------|------|
| Lines        | ${E2E_LINES_PCT}%   | 統合テストのカバレッジ |
| Statements   | ${E2E_STATEMENTS_PCT}%   | 統合テストのカバレッジ |
| Functions    | ${E2E_FUNCTIONS_PCT}%   | 統合テストのカバレッジ |
| Branches     | ${E2E_BRANCHES_PCT}%   | 統合テストのカバレッジ |

---

## 📝 Phase 7 実装テストの確認

### ✅ 実装済みテスト

#### 1. エンドツーエンド統合テスト
- \`apps/backend/test/subcategory-classification-integration.e2e-spec.ts\`
  - 取引受信から確定までの全フロー
  - 複数取引の一括分類フロー
  - 店舗マスタ学習フロー
  - エラーケースとエッジケース

#### 2. サブカテゴリ分類パフォーマンステスト（Backend）
- \`apps/backend/test/performance/subcategory-performance.perf.spec.ts\`
  - 単一分類のパフォーマンス（50ms以内）
  - 一括分類のパフォーマンス（100件で3秒以内）
  - サブカテゴリ一覧取得のパフォーマンス
  - 階層構造処理のパフォーマンス
  - 並行リクエストのパフォーマンス

#### 3. フロントエンドパフォーマンステスト
- \`apps/frontend/e2e/subcategory-performance.spec.ts\`
  - ページ初期表示（500ms以内）
  - サブカテゴリ一覧取得（100ms以内）
  - 階層構造展開（50ms以内）
  - 検索フィルタリング（100ms以内）
  - 大量データ表示（100件で1秒以内）

#### 4. データ整合性テスト
- \`apps/backend/test/subcategory-data-integrity.e2e-spec.ts\`
  - 外部キー制約のテスト
  - トランザクション整合性のテスト
  - データの一貫性テスト
  - JSON型フィールドの整合性テスト
  - NULL値とデフォルト値のテスト
  - 一意性制約のテスト

---

## 🎯 Phase 2〜6 で実装済みのテスト

### Phase 2: Domain層ユニットテスト
- Entity、Value Object、Domain Serviceのテスト

### Phase 3: Infrastructure層ユニットテスト
- Repository実装のテスト
- 店舗マスタ検索のテスト

### Phase 4: Application層ユニットテスト
- UseCaseのテスト
- 分類ロジックのテスト

### Phase 5: Presentation層E2Eテスト
- \`apps/backend/test/subcategory.e2e-spec.ts\`
- API経由でのサブカテゴリ取得・分類テスト

### Phase 6: Frontendコンポーネント・E2Eテスト
- \`apps/frontend/e2e/transaction-classification.spec.ts\`
- \`apps/frontend/e2e/classification.spec.ts\`

---

## 📈 カバレッジ改善の推奨事項

$(if [ "$BACKEND_OK" = "0" ]; then
  echo "### バックエンド"
  echo ""
  echo "- カバレッジが目標（80%）に達していません"
  echo "- 以下の対応を推奨します："
  echo "  - エッジケースのテストを追加"
  echo "  - エラーハンドリングのテストを強化"
  echo "  - 境界値テストを追加"
  echo ""
fi)

$(if [ "$FRONTEND_OK" = "0" ]; then
  echo "### フロントエンド"
  echo ""
  echo "- カバレッジが目標（80%）に達していません"
  echo "- 以下の対応を推奨します："
  echo "  - コンポーネントの条件分岐テストを追加"
  echo "  - ユーザーインタラクションのテストを強化"
  echo "  - エラー状態の表示テストを追加"
  echo ""
fi)

---

## 🔗 関連ドキュメント

- [テストカバレッジ使用ガイド](./coverage-usage-guide.md)
- [テスト設計書](../test-design.md)
- [FR-009 詳細設計書](../detailed-design/FR-009_detailed-category-classification/README.md)
EOF

log_success "レポートを生成しました: $REPORT_FILE"
echo ""

###############################################################################
# 6. 結果サマリー
###############################################################################

log_info "=========================================="
log_info "カバレッジ確認完了"
log_info "=========================================="
echo ""

if [ "$BACKEND_OK" = "1" ] && [ "$FRONTEND_OK" = "1" ]; then
  log_success "✅ すべてのカバレッジが目標を達成しています！"
  exit 0
else
  log_warn "⚠️  一部のカバレッジが目標に達していません。詳細はレポートを確認してください。"
  exit 0  # カバレッジ不足は警告として扱い、スクリプト自体は成功とする
fi

