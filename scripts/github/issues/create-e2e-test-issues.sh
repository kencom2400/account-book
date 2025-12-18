#!/bin/bash

# E2Eテスト不足分のIssue作成スクリプト

set -e

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

ISSUE_DATA_DIR="$PROJECT_ROOT/scripts/github/issues/issue-data/drafts/e2e-tests"
CREATE_ISSUE_SCRIPT="$PROJECT_ROOT/scripts/github/issues/create-issue.sh"

# ディレクトリ作成
mkdir -p "$ISSUE_DATA_DIR"

# Issueデータの定義（JSON形式）
declare -a ISSUES=(
'{"fr":"FR-001","title":"[testing] E2Eテスト: FR-001 銀行口座との連携","desc":"銀行口座との連携機能のE2Eテストを実装する"}'
'{"fr":"FR-002","title":"[testing] E2Eテスト: FR-002 クレジットカードとの連携","desc":"クレジットカードとの連携機能のE2Eテストを実装する"}'
'{"fr":"FR-003","title":"[testing] E2Eテスト: FR-003 証券会社との連携","desc":"証券会社との連携機能のE2Eテストを実装する"}'
'{"fr":"FR-004","title":"[testing] E2Eテスト: FR-004 アプリ起動時のバックグラウンド接続確認","desc":"アプリ起動時のバックグラウンド接続確認機能のE2Eテストを実装する"}'
'{"fr":"FR-005","title":"[testing] E2Eテスト: FR-005 接続失敗時のポップアップ通知","desc":"接続失敗時のポップアップ通知機能のE2Eテストを実装する"}'
'{"fr":"FR-006","title":"[testing] E2Eテスト: FR-006 各金融機関から利用履歴を自動取得","desc":"各金融機関から利用履歴を自動取得機能のE2Eテストを実装する"}'
'{"fr":"FR-007","title":"[testing] E2Eテスト: FR-007 取得データのローカル保存","desc":"取得データのローカル保存機能のE2Eテストを実装する"}'
'{"fr":"FR-011","title":"[testing] E2Eテスト: FR-011 費目の追加・編集・削除機能","desc":"費目の追加・編集・削除機能のE2Eテストを実装する"}'
'{"fr":"FR-012","title":"[testing] E2Eテスト: FR-012 クレジットカード利用明細の月別集計","desc":"クレジットカード利用明細の月別集計機能のE2Eテストを実装する"}'
'{"fr":"FR-013","title":"[testing] E2Eテスト: FR-013 銀行引落額との自動照合機能","desc":"銀行引落額との自動照合機能のE2Eテストを実装する"}'
'{"fr":"FR-014","title":"[testing] E2Eテスト: FR-014 支払いステータス管理","desc":"支払いステータス管理機能のE2Eテストを実装する"}'
'{"fr":"FR-015","title":"[testing] E2Eテスト: FR-015 不一致時のアラート表示","desc":"不一致時のアラート表示機能のE2Eテストを実装する"}'
'{"fr":"FR-017","title":"[testing] E2Eテスト: FR-017 金融機関別の集計","desc":"金融機関別の集計機能のE2Eテストを実装する"}'
'{"fr":"FR-018","title":"[testing] E2Eテスト: FR-018 カテゴリ別の集計","desc":"カテゴリ別の集計機能のE2Eテストを実装する"}'
'{"fr":"FR-019","title":"[testing] E2Eテスト: FR-019 費目別の集計","desc":"費目別の集計機能のE2Eテストを実装する"}'
'{"fr":"FR-021","title":"[testing] E2Eテスト: FR-021 イベントメモ機能","desc":"イベントメモ機能のE2Eテストを実装する"}'
'{"fr":"FR-022","title":"[testing] E2Eテスト: FR-022 イベントと収支の紐付け","desc":"イベントと収支の紐付け機能のE2Eテストを実装する"}'
'{"fr":"FR-023","title":"[testing] E2Eテスト: FR-023 月間収支のグラフ表示","desc":"月間収支のグラフ表示機能のE2Eテストを実装する"}'
'{"fr":"FR-025","title":"[testing] E2Eテスト: FR-025 カテゴリ別円グラフ表示","desc":"カテゴリ別円グラフ表示機能のE2Eテストを実装する"}'
'{"fr":"FR-026","title":"[testing] E2Eテスト: FR-026 金融機関別資産残高の表示","desc":"金融機関別資産残高の表示機能のE2Eテストを実装する"}'
'{"fr":"FR-027","title":"[testing] E2Eテスト: FR-027 収支推移のトレンド表示","desc":"収支推移のトレンド表示機能のE2Eテストを実装する"}'
'{"fr":"FR-028","title":"[testing] E2Eテスト: FR-028 金融機関接続設定の画面管理","desc":"金融機関接続設定の画面管理機能のE2Eテストを実装する"}'
'{"fr":"FR-029","title":"[testing] E2Eテスト: FR-029 認証情報の登録・更新・削除","desc":"認証情報の登録・更新・削除機能のE2Eテストを実装する"}'
'{"fr":"FR-030","title":"[testing] E2Eテスト: FR-030 データ同期間隔の設定","desc":"データ同期間隔の設定機能のE2Eテストを実装する"}'
)

echo "════════════════════════════════════════════════════════════════"
echo "   📋 E2Eテスト不足分のIssue作成"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "作成予定Issue数: ${#ISSUES[@]}"
echo ""

# 各IssueのJSONファイルを作成
for i in "${!ISSUES[@]}"; do
    ISSUE_DATA="${ISSUES[$i]}"
    FR=$(echo "$ISSUE_DATA" | jq -r '.fr')
    TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
    DESC=$(echo "$ISSUE_DATA" | jq -r '.desc')
    
    # JSONファイル名（小文字に変換）
    FR_LOWER=$(echo "$FR" | tr '[:upper:]' '[:lower:]')
    JSON_FILE="$ISSUE_DATA_DIR/${FR_LOWER}.json"
    
    # JSONファイルを作成 (jqを使用)
    BODY_CONTENT="**Epic**: #192 - テスト実装

---

## 📋 概要

$DESC

## 🎯 目的

機能要件 $FR に対するE2Eテストを実装し、ユーザーフローの動作を保証します。

## ✅ Acceptance Criteria（受入基準）
- [ ] E2Eテストが実装されている
- [ ] 正常系の動作が確認できている
- [ ] エラーハンドリングが適切に実装されている
- [ ] すべてのテストがパスしている

## 📋 Definition of Done（完了定義）

### コード品質
- [ ] 実装が完了している
- [ ] コードレビューが完了している
- [ ] ESLint/Prettierエラーがない
- [ ] TypeScript型定義が適切に設定されている

### テスト
- [ ] E2Eテストが書かれている
- [ ] すべてのテストがパスしている
- [ ] エッジケースのテストが含まれている

### ドキュメント
- [ ] コードにコメントが適切に記載されている

## 📁 関連ファイル
- 実装時に追記

## 📚 参考資料
- \`docs/requirements-specification.md\`
- \`docs/functional-requirements/\`
- \`apps/frontend/e2e/\`

## 💡 実装メモ
- 実装開始時に詳細を追記してください
- 技術的な課題や決定事項をここに記録します"

    jq -n \
      --arg title "$TITLE" \
      --argjson labels '["testing", "frontend", "priority: medium", "size: M"]' \
      --arg body "$BODY_CONTENT" \
      '{ "title": $title, "labels": $labels, "body": $body }' > "$JSON_FILE"
    
    echo "✅ $FR のIssueデータファイルを作成: $JSON_FILE"
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   📝 Issue作成"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 各Issueを作成
for JSON_FILE in "$ISSUE_DATA_DIR"/*.json; do
    if [ -f "$JSON_FILE" ]; then
        echo "📋 Issue作成中: $(basename "$JSON_FILE")"
        "$CREATE_ISSUE_SCRIPT" "$JSON_FILE"
        echo ""
    fi
done

echo "✅ すべてのIssue作成が完了しました"
