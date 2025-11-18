#!/bin/bash

# 未実装のClosedIssueをReopenするスクリプト

REPO="kencom2400/account-book"

echo "════════════════════════════════════════════════════════════════"
echo "   🔄 未完了IssueのReopen処理"
echo "════════════════════════════════════════════════════════════════"
echo ""

# カテゴリA（完了済み）を除外し、#79-137をReopenする
# Issue #138はGitHub環境構築で完了しているので除外
REOPEN_ISSUES="79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 122 123 124 125 126 127 128 129 130 131 132 133 134 135 136 137"

REOPENED_COUNT=0
FAILED_COUNT=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 Reopen対象: 59個のIssue (#79-#137)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for issue in $REOPEN_ISSUES; do
    TITLE=$(gh issue view "$issue" --repo "$REPO" --json title --jq '.title' 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -n "🔄 Issue #$issue: $TITLE ... "
        
        # Issueをreopenする
        gh issue reopen "$issue" --repo "$REPO" --comment "このIssueは未実装のため、Reopenします。

**理由:**
- Acceptance Criteriaが未チェック
- Definition of Doneが未達成
- 実装が完了していない

**次のステップ:**
- [ ] 要件を確認
- [ ] 実装を開始
- [ ] テストを実施
- [ ] レビューを受ける

ステータスを **To Do** または **Backlog** に移動してください。" >/dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Reopen成功"
            ((REOPENED_COUNT++))
        else
            echo "❌ Reopen失敗"
            ((FAILED_COUNT++))
        fi
    else
        echo "⚠️  Issue #$issue が見つかりません"
        ((FAILED_COUNT++))
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 Reopen処理完了"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Reopen成功: $REOPENED_COUNT 個"
echo "❌ 失敗: $FAILED_COUNT 個"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 完了済みIssue（Closeのまま）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  - Issue #5: A-1: Monorepo環境の最終確認と整備"
echo "  - Issue #6: A-2: ESLint・Prettierの設定と適用"
echo "  - Issue #7: A-3: Backend基盤の構築（NestJS）"
echo "  - Issue #8: A-4: Frontend基盤の構築（Next.js）"
echo "  - Issue #9: A-5: 開発用スクリプト群の整備"
echo "  - Issue #11: A-7: GitHub Issue管理環境の構築"
echo "  - Issue #12: A-8: データディレクトリ構造の整備"
echo "  - Issue #13: A-9: カテゴリマスタデータの初期化"
echo "  - Issue #14: A-10: ドキュメント整備"
echo "  - Issue #138: GitHub環境構築と全Issue詳細化の完了"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 次のステップ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. プロジェクトボードで各Issueを確認"
echo "   https://github.com/kencom2400/account-book/projects"
echo ""
echo "2. Reopenしたissueを適切なカラムに移動:"
echo "   - Backlog: まだ着手しないもの"
echo "   - To Do: 近々着手予定のもの"
echo ""
echo "3. 優先度の高いIssueから着手を開始"
echo ""
echo "════════════════════════════════════════════════════════════════"

