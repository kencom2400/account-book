#!/bin/bash

# 全Issue一括詳細化マスタースクリプト
# FR-008〜031とカテゴリA, C〜Hを詳細化

set -e

REPO="kencom2400/account-book"

echo "════════════════════════════════════════════════════════════════"
echo "   📝 全Issue一括詳細化スクリプト"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "対象: 約83個のIssue"
echo "  - FR-008〜031（24個）"
echo "  - カテゴリA（10個）"
echo "  - カテゴリC〜H（49個）"
echo ""
echo "推定所要時間: 15〜20分"
echo ""

read -p "続行しますか？ (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "キャンセルしました"
    exit 0
fi

echo ""
echo "詳細化を開始します..."
echo ""

# 標準テンプレート関数
add_standard_details() {
    local issue_num=$1
    local category=$2
    
    local body="## ✅ Acceptance Criteria（受入基準）
- [ ] 実装が要件定義に沿って完了している
- [ ] 正常系の動作が確認できている
- [ ] エラーハンドリングが適切に実装されている
- [ ] パフォーマンスが許容範囲内（必要に応じて）
- [ ] セキュリティ要件を満たしている（必要に応じて）
- [ ] UI/UXが使いやすい（Frontend の場合）
- [ ] API仕様に準拠している（Backend の場合）

## 📋 Definition of Done（完了定義）

### コード品質
- [ ] 実装が完了している
- [ ] コードレビューが完了している
- [ ] ESLint/Prettierエラーがない
- [ ] TypeScript型定義が適切に設定されている
- [ ] 適切なエラーハンドリングが実装されている
- [ ] コードがDRY原則に従っている
- [ ] 関数・変数名が適切で理解しやすい

### テスト
- [ ] ユニットテストが書かれている（カバレッジ80%以上）
- [ ] 統合テストが書かれている（必要に応じて）
- [ ] E2Eテストが書かれている（UI機能の場合）
- [ ] すべてのテストがパスしている
- [ ] エッジケースのテストが含まれている

### ドキュメント
- [ ] コードにコメントが適切に記載されている
- [ ] API仕様書が更新されている（Backend の場合）
- [ ] コンポーネント仕様が更新されている（Frontend の場合）
- [ ] README.mdが更新されている（必要に応じて）

### デプロイ・統合
- [ ] developブランチにマージ済み
- [ ] CI/CDが成功している
- [ ] 手動動作確認が完了している
- [ ] 関連Issueとの整合性が確認されている

## 📁 関連ファイル
- 実装時に追記

## 📚 参考資料
- \`docs/requirements-specification.md\`
- \`docs/system-architecture.md\`
- \`docs/functional-requirements/\`（機能要件の場合）

## 💡 実装メモ
- 実装開始時に詳細を追記してください
- 技術的な課題や決定事項をここに記録します
"
    
    gh issue edit "$issue_num" --repo "$REPO" --body "$body" 2>&1 | head -1
}

# カウンター
UPDATED=0
FAILED=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 FR-008〜011（データ分類機能）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in 55 56 57 58; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "FR"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 FR-012〜015（クレジットカード管理）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in 59 60 61 62; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "FR"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 FR-016〜022（集計・分析機能）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in 63 64 65 66 67 68 69; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "FR"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 FR-023〜027（可視化機能）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in 70 71 72 73 74; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "FR"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 FR-028〜031（設定機能）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in 75 76 77 78; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "FR"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリA（環境構築）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in 5 6 7 8 9 10 11 12 13 14; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "A"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリC（非機能要件）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in {79..92}; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "C"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリD（テスト実装）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in {93..106}; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "D"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリE（UI/UX実装）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in {107..121}; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "E"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリF（DB移行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in {122..126}; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "F"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリG（ドキュメント・保守）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in {127..133}; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "G"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 カテゴリH（拡張機能）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for issue in {134..137}; do
    echo "  Issue #$issue を更新中..."
    if add_standard_details "$issue" "H"; then
        UPDATED=$((UPDATED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   🎉 全Issue詳細化完了！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ 更新成功: ${UPDATED}個"
echo "❌ 更新失敗: ${FAILED}個"
echo ""
echo "🔗 確認:"
echo "   Issue一覧: https://github.com/${REPO}/issues"
echo "   プロジェクトボード: https://github.com/users/kencom2400/projects/1"
echo ""
echo "════════════════════════════════════════════════════════════════"

