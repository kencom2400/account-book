#!/bin/bash

# カバレッジレポート生成スクリプト
# 各モジュールのテストカバレッジを収集してMarkdownレポートを生成します

set -e

echo "================================"
echo "カバレッジレポート生成開始"
echo "================================"

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"


# 出力先ディレクトリ
OUTPUT_DIR="$PROJECT_ROOT/docs/testing"
MODULE_DIR="$OUTPUT_DIR/module-coverage"
REPORT_FILE="$OUTPUT_DIR/coverage-report.md"

# ディレクトリ作成
mkdir -p "$MODULE_DIR"

# 現在の日時とコミットハッシュを取得
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BRANCH_NAME=$(git branch --show-current 2>/dev/null || echo "unknown")

# カバレッジデータを一時的に保存する関数
extract_coverage_data() {
  local coverage_dir=$1
  local module_name=$2
  
  # coverage-summary.jsonまたはcoverage-final.jsonを使用
  local summary_file="${coverage_dir}/coverage-summary.json"
  local final_file="${coverage_dir}/coverage-final.json"
  
  local lines statements functions branches
  
  # coverage-summary.jsonが存在する場合はそれを優先使用
  if [ -f "$summary_file" ]; then
    read -r lines statements functions branches <<< "$(jq -r '[.total.lines.pct // 0, .total.statements.pct // 0, .total.functions.pct // 0, .total.branches.pct // 0] | @tsv' "$summary_file" 2>/dev/null || echo $'0\t0\t0\t0')"
  elif [ -f "$final_file" ]; then
    # coverage-final.jsonから集計
    local coverage_data=$(jq '[
      .[] | 
      {
        statements: (.s | length),
        covered_statements: ([.s[]] | map(select(. > 0)) | length),
        functions: (.f | length),
        covered_functions: ([.f[]] | map(select(. > 0)) | length),
        branches: (if .b then [.b | to_entries[] | .value | length] | add else 0 end),
        covered_branches: (if .b then [.b | to_entries[] | .value[] | select(. > 0)] | length else 0 end)
      }
    ] | 
    {
      total_statements: ([.[].statements] | add),
      covered_statements: ([.[].covered_statements] | add),
      total_functions: ([.[].functions] | add),
      covered_functions: ([.[].covered_functions] | add),
      total_branches: ([.[].branches] | add),
      covered_branches: ([.[].covered_branches] | add)
    }' "$final_file" 2>/dev/null)
    
    local total_statements=$(echo "$coverage_data" | jq -r '.total_statements // 1')
    local covered_statements=$(echo "$coverage_data" | jq -r '.covered_statements // 0')
    local total_functions=$(echo "$coverage_data" | jq -r '.total_functions // 1')
    local covered_functions=$(echo "$coverage_data" | jq -r '.covered_functions // 0')
    local total_branches=$(echo "$coverage_data" | jq -r '.total_branches // 1')
    local covered_branches=$(echo "$coverage_data" | jq -r '.covered_branches // 0')
    
    # パーセンテージを計算（ゼロ除算を回避）
    statements=$(awk "BEGIN {if ($total_statements > 0) print ($covered_statements / $total_statements) * 100; else print 0}")
    lines=$statements
    functions=$(awk "BEGIN {if ($total_functions > 0) print ($covered_functions / $total_functions) * 100; else print 0}")
    branches=$(awk "BEGIN {if ($total_branches > 0) print ($covered_branches / $total_branches) * 100; else print 0}")
  else
    # どちらも存在しない場合
    echo "0|0|0|0"
    return
  fi
  
  # 小数点以下2桁に丸める
  lines=$(printf "%.2f" "$lines" 2>/dev/null || echo "0.00")
  statements=$(printf "%.2f" "$statements" 2>/dev/null || echo "0.00")
  functions=$(printf "%.2f" "$functions" 2>/dev/null || echo "0.00")
  branches=$(printf "%.2f" "$branches" 2>/dev/null || echo "0.00")
  
  echo "$lines|$statements|$functions|$branches"
}

# モジュール別カバレッジデータを抽出する関数
extract_module_coverage() {
  local coverage_file=$1
  local module_path=$2
  
  if [ ! -f "$coverage_file" ]; then
    echo "0|0|0|0"
    return
  fi
  
  # モジュールパスに一致するファイルのみをフィルタリング
  local coverage_data=$(jq --arg module_path "$module_path" '[
    to_entries[] | 
    select(.key | contains($module_path)) | 
    .value | 
    {
      statements: (.s | length),
      covered_statements: ([.s[]] | map(select(. > 0)) | length),
      functions: (.f | length),
      covered_functions: ([.f[]] | map(select(. > 0)) | length),
      branches: (if .b then [.b | to_entries[] | .value | length] | add else 0 end),
      covered_branches: (if .b then [.b | to_entries[] | .value[] | select(. > 0)] | length else 0 end)
    }
  ] | 
  {
    total_statements: ([.[].statements] | add // 0),
    covered_statements: ([.[].covered_statements] | add // 0),
    total_functions: ([.[].functions] | add // 0),
    covered_functions: ([.[].covered_functions] | add // 0),
    total_branches: ([.[].branches] | add // 0),
    covered_branches: ([.[].covered_branches] | add // 0)
  }' "$coverage_file" 2>/dev/null)
  
  local total_statements=$(echo "$coverage_data" | jq -r '.total_statements // 1')
  local covered_statements=$(echo "$coverage_data" | jq -r '.covered_statements // 0')
  local total_functions=$(echo "$coverage_data" | jq -r '.total_functions // 1')
  local covered_functions=$(echo "$coverage_data" | jq -r '.covered_functions // 0')
  local total_branches=$(echo "$coverage_data" | jq -r '.total_branches // 1')
  local covered_branches=$(echo "$coverage_data" | jq -r '.covered_branches // 0')
  
  # ファイルが存在しない場合
  if [ "$total_statements" = "0" ]; then
    echo "0|0|0|0"
    return
  fi
  
  # パーセンテージを計算
  local statements=$(awk "BEGIN {if ($total_statements > 0) print ($covered_statements / $total_statements) * 100; else print 0}")
  local lines=$statements
  local functions=$(awk "BEGIN {if ($total_functions > 0) print ($covered_functions / $total_functions) * 100; else print 0}")
  local branches=$(awk "BEGIN {if ($total_branches > 0) print ($covered_branches / $total_branches) * 100; else print 0}")
  
  # 小数点以下2桁に丸める
  lines=$(printf "%.2f" "$lines" 2>/dev/null || echo "0.00")
  statements=$(printf "%.2f" "$statements" 2>/dev/null || echo "0.00")
  functions=$(printf "%.2f" "$functions" 2>/dev/null || echo "0.00")
  branches=$(printf "%.2f" "$branches" 2>/dev/null || echo "0.00")
  
  echo "$lines|$statements|$functions|$branches"
}

# 優先度を判定する関数
determine_priority() {
  local coverage=$1
  local coverage_num=$(echo "$coverage" | sed 's/%//')
  
  if (( $(echo "$coverage_num < 30" | bc -l) )); then
    echo "🔴 High"
  elif (( $(echo "$coverage_num < 50" | bc -l) )); then
    echo "🟡 Medium"
  else
    echo "🟢 Low"
  fi
}

# Backendのユニットテストカバレッジを取得
echo "📊 Backend ユニットテストカバレッジを収集中..."
cd "$PROJECT_ROOT/apps/backend"
pnpm test:cov > /dev/null 2>&1 || echo "⚠ Backend unit test coverage failed"
BACKEND_UNIT_DATA=$(extract_coverage_data "$PROJECT_ROOT/apps/backend/coverage" "backend-unit")

# Backend E2Eテストカバレッジを取得
echo "📊 Backend E2Eテストカバレッジを収集中..."
cd "$PROJECT_ROOT/apps/backend"
pnpm test:e2e:cov > /dev/null 2>&1 || echo "⚠ Backend e2e test coverage failed"
BACKEND_E2E_DATA=$(extract_coverage_data "$PROJECT_ROOT/apps/backend/coverage-e2e" "backend-e2e")

# Backendモジュール別カバレッジを収集
echo "📊 Backend モジュール別カバレッジを収集中..."
BACKEND_MODULES=("category" "credit-card" "health" "institution" "securities" "sync" "transaction")

# 各モジュールのカバレッジデータを変数に格納
for module in "${BACKEND_MODULES[@]}"; do
  module_path="/modules/$module/"
  module_var_name=$(echo "$module" | tr '-' '_')
  eval "BACKEND_MODULE_UNIT_${module_var_name}=\$(extract_module_coverage \"$PROJECT_ROOT/apps/backend/coverage/coverage-final.json\" \"$module_path\")"
  eval "BACKEND_MODULE_E2E_${module_var_name}=\$(extract_module_coverage \"$PROJECT_ROOT/apps/backend/coverage-e2e/coverage-final.json\" \"$module_path\")"
done

# Frontendのユニットテストカバレッジを取得
echo "📊 Frontend ユニットテストカバレッジを収集中..."
cd "$PROJECT_ROOT/apps/frontend"
pnpm test -- --coverage --silent > /dev/null 2>&1 || echo "⚠ Frontend test coverage failed"
FRONTEND_UNIT_DATA=$(extract_coverage_data "$PROJECT_ROOT/apps/frontend/coverage" "frontend-unit")

# Frontendモジュール別カバレッジを収集
echo "📊 Frontend モジュール別カバレッジを収集中..."
FRONTEND_MODULES=("app" "components" "lib" "stores" "utils")

# 各モジュールのカバレッジデータを変数に格納
for module in "${FRONTEND_MODULES[@]}"; do
  module_path="/src/$module/"
  module_var_name=$(echo "$module" | tr '-' '_')
  eval "FRONTEND_MODULE_UNIT_${module_var_name}=\$(extract_module_coverage \"$PROJECT_ROOT/apps/frontend/coverage/coverage-final.json\" \"$module_path\")"
done

# Frontend E2Eテストカバレッジを取得（注: Playwrightはデフォルトでカバレッジを出力しないため、現時点では未対応）
# TODO: Playwright coverage設定が完了したら有効化
# echo "📊 Frontend E2Eテストカバレッジを収集中..."
# cd "$PROJECT_ROOT/apps/frontend"
# pnpm test:e2e --coverage > /dev/null 2>&1 || echo "⚠ Frontend e2e test coverage failed"
# FRONTEND_E2E_DATA=$(extract_coverage_data "$PROJECT_ROOT/apps/frontend/coverage-e2e" "frontend-e2e")

# データを配列に分割
IFS='|' read -r BACKEND_UNIT_LINES BACKEND_UNIT_STMTS BACKEND_UNIT_FUNCS BACKEND_UNIT_BRANCHES <<< "$BACKEND_UNIT_DATA"
IFS='|' read -r BACKEND_E2E_LINES BACKEND_E2E_STMTS BACKEND_E2E_FUNCS BACKEND_E2E_BRANCHES <<< "$BACKEND_E2E_DATA"
IFS='|' read -r FRONTEND_UNIT_LINES FRONTEND_UNIT_STMTS FRONTEND_UNIT_FUNCS FRONTEND_UNIT_BRANCHES <<< "$FRONTEND_UNIT_DATA"

# メインレポートを生成
echo "📝 カバレッジレポートを生成中..."
cat > "$REPORT_FILE" << EOF
# テストカバレッジレポート

> **最終更新**: $TIMESTAMP  
> **コミット**: \`$COMMIT_HASH\`  
> **ブランチ**: \`$BRANCH_NAME\`

## 概要

このドキュメントは、各モジュールのテストカバレッジ状況をまとめたものです。

### カバレッジ目標

- **プロジェクト全体**: 80%以上
- **各モジュール**: 80%以上
- **新規コード**: 80%以上

## サマリー

| テスト種類 | Lines | Statements | Functions | Branches |
|----------|-------|------------|-----------|----------|
| Backend (Unit) | ${BACKEND_UNIT_LINES}% | ${BACKEND_UNIT_STMTS}% | ${BACKEND_UNIT_FUNCS}% | ${BACKEND_UNIT_BRANCHES}% |
| Backend (E2E) | ${BACKEND_E2E_LINES}% | ${BACKEND_E2E_STMTS}% | ${BACKEND_E2E_FUNCS}% | ${BACKEND_E2E_BRANCHES}% |
| Frontend (Unit) | ${FRONTEND_UNIT_LINES}% | ${FRONTEND_UNIT_STMTS}% | ${FRONTEND_UNIT_FUNCS}% | ${FRONTEND_UNIT_BRANCHES}% |
| Frontend (E2E) | N/A | N/A | N/A | N/A |

## Backend モジュール別詳細

### Unit Tests

| モジュール | Lines | Statements | Functions | Branches | 優先度 |
|----------|-------|------------|-----------|----------|--------|
EOF

# Backendモジュール別データを追加
for module in "${BACKEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$BACKEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  priority=$(determine_priority "$lines")
  cat >> "$REPORT_FILE" << EOF
| $module | ${lines}% | ${stmts}% | ${funcs}% | ${branches}% | $priority |
EOF
done

cat >> "$REPORT_FILE" << EOF

### E2E Tests

| モジュール | Lines | Statements | Functions | Branches |
|----------|-------|------------|-----------|----------|
EOF

for module in "${BACKEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$BACKEND_MODULE_E2E_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  cat >> "$REPORT_FILE" << EOF
| $module | ${lines}% | ${stmts}% | ${funcs}% | ${branches}% |
EOF
done

cat >> "$REPORT_FILE" << EOF

## Frontend モジュール別詳細

### Unit Tests

| モジュール | Lines | Statements | Functions | Branches | 優先度 |
|----------|-------|------------|-----------|----------|--------|
EOF

# Frontendモジュール別データを追加
for module in "${FRONTEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$FRONTEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  priority=$(determine_priority "$lines")
  cat >> "$REPORT_FILE" << EOF
| $module | ${lines}% | ${stmts}% | ${funcs}% | ${branches}% | $priority |
EOF
done

cat >> "$REPORT_FILE" << EOF

## 改善優先度

### 🔴 High Priority (カバレッジ < 30%)

**Backend:**
EOF

# High priority Backend modules
for module in "${BACKEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$BACKEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  lines_num=$(echo "$lines" | sed 's/%.*//')
  if (( $(echo "$lines_num < 30" | bc -l) )); then
    cat >> "$REPORT_FILE" << EOF
- $module (Lines: ${lines}%, Stmts: ${stmts}%, Funcs: ${funcs}%, Branches: ${branches}%)
EOF
  fi
done

cat >> "$REPORT_FILE" << EOF

**Frontend:**
EOF

# High priority Frontend modules
for module in "${FRONTEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$FRONTEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  lines_num=$(echo "$lines" | sed 's/%.*//')
  if (( $(echo "$lines_num < 30" | bc -l) )); then
    cat >> "$REPORT_FILE" << EOF
- $module (Lines: ${lines}%, Stmts: ${stmts}%, Funcs: ${funcs}%, Branches: ${branches}%)
EOF
  fi
done

cat >> "$REPORT_FILE" << EOF

### 🟡 Medium Priority (30% ≤ カバレッジ < 50%)

**Backend:**
EOF

# Medium priority Backend modules
for module in "${BACKEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$BACKEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  lines_num=$(echo "$lines" | sed 's/%.*//')
  if (( $(echo "$lines_num >= 30" | bc -l) )) && (( $(echo "$lines_num < 50" | bc -l) )); then
    cat >> "$REPORT_FILE" << EOF
- $module (Lines: ${lines}%, Stmts: ${stmts}%, Funcs: ${funcs}%, Branches: ${branches}%)
EOF
  fi
done

cat >> "$REPORT_FILE" << EOF

**Frontend:**
EOF

# Medium priority Frontend modules
for module in "${FRONTEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$FRONTEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  lines_num=$(echo "$lines" | sed 's/%.*//')
  if (( $(echo "$lines_num >= 30" | bc -l) )) && (( $(echo "$lines_num < 50" | bc -l) )); then
    cat >> "$REPORT_FILE" << EOF
- $module (Lines: ${lines}%, Stmts: ${stmts}%, Funcs: ${funcs}%, Branches: ${branches}%)
EOF
  fi
done

cat >> "$REPORT_FILE" << EOF

### 🟢 Low Priority (カバレッジ ≥ 50%)

**Backend:**
EOF

# Low priority Backend modules
for module in "${BACKEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$BACKEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  lines_num=$(echo "$lines" | sed 's/%.*//')
  if (( $(echo "$lines_num >= 50" | bc -l) )); then
    cat >> "$REPORT_FILE" << EOF
- $module (Lines: ${lines}%, Stmts: ${stmts}%, Funcs: ${funcs}%, Branches: ${branches}%)
EOF
  fi
done

cat >> "$REPORT_FILE" << EOF

**Frontend:**
EOF

# Low priority Frontend modules
for module in "${FRONTEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$FRONTEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  lines_num=$(echo "$lines" | sed 's/%.*//')
  if (( $(echo "$lines_num >= 50" | bc -l) )); then
    cat >> "$REPORT_FILE" << EOF
- $module (Lines: ${lines}%, Stmts: ${stmts}%, Funcs: ${funcs}%, Branches: ${branches}%)
EOF
  fi
done

cat >> "$REPORT_FILE" << EOF

## 詳細レポート

各モジュールの詳細なカバレッジレポートは以下を参照してください：

- [Backend カバレッジ詳細](./module-coverage/backend.md)
- [Frontend カバレッジ詳細](./module-coverage/frontend.md)

## カバレッジ履歴

カバレッジの推移については [カバレッジ履歴](./coverage-history.md) を参照してください。

## カバレッジ改善のベストプラクティス

### 1. 未カバーコードの特定

各モジュールで生成されるHTMLレポートを確認：
- Backend: \`apps/backend/coverage/lcov-report/index.html\`
- Frontend: \`apps/frontend/coverage/lcov-report/index.html\`

### 2. テスト追加の優先順位

1. **Critical Path**: ビジネスロジックの中核部分
2. **エッジケース**: エラーハンドリング、境界値テスト
3. **Integration**: モジュール間の連携テスト

### 3. カバレッジ向上のコツ

- **小さな単位でテスト**: 1つのテストで1つの動作を検証
- **モックの活用**: 外部依存を排除して単体テストを書きやすくする
- **E2Eテストとのバランス**: ユニットテストでカバーできない統合部分をE2Eで補完

## 使用方法

### カバレッジレポートの更新

\`\`\`bash
# 最新のカバレッジレポートを生成
./scripts/test/generate-coverage-report.sh

# 履歴を更新（オプション）
./scripts/test/update-coverage-history.sh
\`\`\`

### 個別モジュールのカバレッジ確認

\`\`\`bash
# Backend ユニットテスト
cd apps/backend
pnpm test:cov

# Backend E2Eテスト
cd apps/backend
pnpm test:e2e:cov

# Frontend ユニットテスト
cd apps/frontend
pnpm test -- --coverage
\`\`\`

## 参考資料

- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Codecov Configuration](../codecov.yml)
- [テスト設計ドキュメント](./test-design.md)
EOF

# Backend詳細レポートを生成
echo "📝 Backend詳細レポートを生成中..."
cat > "$MODULE_DIR/backend.md" << EOF
# Backend カバレッジ詳細

> **最終更新**: $TIMESTAMP  
> **コミット**: \`$COMMIT_HASH\`

## ユニットテスト カバレッジ（全体）

| メトリクス | カバレッジ |
|----------|----------|
| Lines | ${BACKEND_UNIT_LINES}% |
| Statements | ${BACKEND_UNIT_STMTS}% |
| Functions | ${BACKEND_UNIT_FUNCS}% |
| Branches | ${BACKEND_UNIT_BRANCHES}% |

### モジュール別カバレッジ

| モジュール | Lines | Statements | Functions | Branches | 優先度 |
|----------|-------|------------|-----------|----------|--------|
EOF

# Backendモジュール別データを追加
for module in "${BACKEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$BACKEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  priority=$(determine_priority "$lines")
  cat >> "$MODULE_DIR/backend.md" << EOF
| $module | ${lines}% | ${stmts}% | ${funcs}% | ${branches}% | $priority |
EOF
done

cat >> "$MODULE_DIR/backend.md" << EOF

### HTMLレポート

詳細なカバレッジレポート（ファイル別・行別）:
\`apps/backend/coverage/lcov-report/index.html\`

### 実行方法

\`\`\`bash
cd apps/backend
pnpm test:cov
\`\`\`

## E2Eテスト カバレッジ（全体）

| メトリクス | カバレッジ |
|----------|----------|
| Lines | ${BACKEND_E2E_LINES}% |
| Statements | ${BACKEND_E2E_STMTS}% |
| Functions | ${BACKEND_E2E_FUNCS}% |
| Branches | ${BACKEND_E2E_BRANCHES}% |

### モジュール別カバレッジ

| モジュール | Lines | Statements | Functions | Branches |
|----------|-------|------------|-----------|----------|
EOF

for module in "${BACKEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$BACKEND_MODULE_E2E_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  cat >> "$MODULE_DIR/backend.md" << EOF
| $module | ${lines}% | ${stmts}% | ${funcs}% | ${branches}% |
EOF
done

cat >> "$MODULE_DIR/backend.md" << EOF

### HTMLレポート

詳細なカバレッジレポート（ファイル別・行別）:
\`apps/backend/coverage-e2e/lcov-report/index.html\`

### 実行方法

\`\`\`bash
cd apps/backend
pnpm test:e2e:cov
\`\`\`

## モジュール説明

Backendは以下のモジュールで構成されています：

- **category**: カテゴリ管理（大分類・中分類・小分類）
- **credit-card**: クレジットカード管理
- **health**: ヘルスチェック
- **institution**: 金融機関管理
- **securities**: 証券管理
- **sync**: データ同期
- **transaction**: 取引データ管理

## カバレッジ向上のヒント

### ユニットテストで重点的にカバーすべき部分

1. **Use Cases**: ビジネスロジックの中核
2. **Services**: ドメインロジック
3. **Validators**: バリデーションロジック
4. **Handlers**: イベントハンドラ

### E2Eテストで重点的にカバーすべき部分

1. **API Endpoints**: エンドポイント全体の動作
2. **Integration**: モジュール間連携
3. **Error Handling**: エラーケース
4. **Authentication**: 認証・認可

## 参考資料

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Configuration](../../apps/backend/package.json)
EOF

# Frontend詳細レポートを生成
echo "📝 Frontend詳細レポートを生成中..."
cat > "$MODULE_DIR/frontend.md" << EOF
# Frontend カバレッジ詳細

> **最終更新**: $TIMESTAMP  
> **コミット**: \`$COMMIT_HASH\`

## ユニットテスト カバレッジ（全体）

| メトリクス | カバレッジ |
|----------|----------|
| Lines | ${FRONTEND_UNIT_LINES}% |
| Statements | ${FRONTEND_UNIT_STMTS}% |
| Functions | ${FRONTEND_UNIT_FUNCS}% |
| Branches | ${FRONTEND_UNIT_BRANCHES}% |

### モジュール別カバレッジ

| モジュール | Lines | Statements | Functions | Branches | 優先度 |
|----------|-------|------------|-----------|----------|--------|
EOF

# Frontendモジュール別データを追加
for module in "${FRONTEND_MODULES[@]}"; do
  module_var_name=$(echo "$module" | tr '-' '_')
  module_data=$(eval "echo \$FRONTEND_MODULE_UNIT_${module_var_name}")
  IFS='|' read -r lines stmts funcs branches <<< "$module_data"
  priority=$(determine_priority "$lines")
  cat >> "$MODULE_DIR/frontend.md" << EOF
| $module | ${lines}% | ${stmts}% | ${funcs}% | ${branches}% | $priority |
EOF
done

cat >> "$MODULE_DIR/frontend.md" << EOF

### HTMLレポート

詳細なカバレッジレポート（ファイル別・行別）:
\`apps/frontend/coverage/lcov-report/index.html\`

### 実行方法

\`\`\`bash
cd apps/frontend
pnpm test -- --coverage
\`\`\`

## モジュール説明

Frontendは以下のモジュールで構成されています：

- **app**: Next.jsページコンポーネント
- **components**: 再利用可能なUIコンポーネント
- **lib**: APIクライアントとユーティリティ
- **stores**: Zustand状態管理
- **utils**: 汎用ユーティリティ関数

## E2Eテスト

E2Eテストは Playwright で実行されます。

### 実行方法

\`\`\`bash
cd apps/frontend
pnpm test:e2e
\`\`\`

### E2Eテストレポート

\`\`\`bash
# レポートを表示
pnpm test:e2e:report
\`\`\`

## カバレッジ向上のヒント

### ユニットテストで重点的にカバーすべき部分

1. **Custom Hooks**: ビジネスロジックを含むフック
2. **Utility Functions**: 共通ユーティリティ
3. **API Client**: API呼び出しロジック
4. **State Management**: Zustand store

### E2Eテストで重点的にカバーすべき部分

1. **User Flows**: ユーザージャーニー全体
2. **Form Submission**: フォーム送信とバリデーション
3. **Navigation**: ページ遷移
4. **Error Handling**: エラー表示

## 参考資料

- [Next.js Testing](https://nextjs.org/docs/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [Jest Configuration](../../apps/frontend/jest.config.js)
EOF

# カバレッジ履歴ファイルを初期化（存在しない場合）
HISTORY_FILE="$OUTPUT_DIR/coverage-history.md"
if [ ! -f "$HISTORY_FILE" ]; then
  echo "📝 カバレッジ履歴ファイルを初期化中..."
  cat > "$HISTORY_FILE" << EOF
# カバレッジ履歴

このドキュメントは、カバレッジの推移を記録します。

## 履歴

| 日時 | コミット | Backend (Unit) | Backend (E2E) | Frontend (Unit) |
|-----|---------|---------------|--------------|----------------|
| $TIMESTAMP | \`$COMMIT_HASH\` | Lines: ${BACKEND_UNIT_LINES}%, Stmts: ${BACKEND_UNIT_STMTS}%, Funcs: ${BACKEND_UNIT_FUNCS}%, Branches: ${BACKEND_UNIT_BRANCHES}% | Lines: ${BACKEND_E2E_LINES}%, Stmts: ${BACKEND_E2E_STMTS}%, Funcs: ${BACKEND_E2E_FUNCS}%, Branches: ${BACKEND_E2E_BRANCHES}% | Lines: ${FRONTEND_UNIT_LINES}%, Stmts: ${FRONTEND_UNIT_STMTS}%, Funcs: ${FRONTEND_UNIT_FUNCS}%, Branches: ${FRONTEND_UNIT_BRANCHES}% |

## 使用方法

カバレッジ履歴を更新するには：

\`\`\`bash
./scripts/test/update-coverage-history.sh
\`\`\`

## 目標

- **全モジュール**: 80%以上を維持
- **トレンド**: 継続的な改善

## 改善アクション

カバレッジが低下した場合は、以下を確認：

1. 新規追加コードにテストが含まれているか
2. リファクタリング時にテストが削除されていないか
3. カバレッジ低下の原因となるコミットを特定

EOF
fi

echo ""
echo "✅ カバレッジレポート生成完了"
echo ""
echo "📊 生成されたレポート:"
echo "  - メインレポート: $REPORT_FILE"
echo "  - Backend詳細: $MODULE_DIR/backend.md"
echo "  - Frontend詳細: $MODULE_DIR/frontend.md"
echo "  - カバレッジ履歴: $HISTORY_FILE"
echo ""
echo "📂 HTMLレポート:"
echo "  - Backend Unit: apps/backend/coverage/lcov-report/index.html"
echo "  - Backend E2E: apps/backend/coverage-e2e/lcov-report/index.html"
echo "  - Frontend Unit: apps/frontend/coverage/lcov-report/index.html"

