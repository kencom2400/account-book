#!/bin/bash

# GitHub Setup Workflow
# このスクリプトは、GitHubのセットアップを順次実行します

set -e

echo "======================================================"
echo "  GitHub環境セットアップ - 統合スクリプト"
echo "======================================================"
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 現在のディレクトリを確認
if [ ! -f ".github/labels.yml" ]; then
    echo -e "${RED}❌ エラー: プロジェクトルートで実行してください${NC}"
    exit 1
fi

echo -e "${BLUE}📍 現在のディレクトリ: $(pwd)${NC}"
echo ""

# GitHub CLIの確認
echo -e "${YELLOW}🔍 Step 0: 事前確認${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLIがインストールされていません${NC}"
    echo "インストール方法: brew install gh"
    exit 1
fi
echo -e "${GREEN}✅ GitHub CLI インストール済み${NC}"

# 認証確認
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLIの認証が必要です${NC}"
    echo "以下のコマンドを実行して認証してください:"
    echo "  gh auth login"
    exit 1
fi
echo -e "${GREEN}✅ GitHub CLI 認証済み${NC}"

# リポジトリ確認
REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO_NAME" ]; then
    echo -e "${RED}❌ GitHubリポジトリが見つかりません${NC}"
    echo "このディレクトリがGitHubリポジトリに接続されているか確認してください"
    exit 1
fi
echo -e "${GREEN}✅ リポジトリ: $REPO_NAME${NC}"
echo ""

# ====================================================
# Step 1: ラベル作成
# ====================================================
echo -e "${YELLOW}📋 Step 1: GitHubラベルの作成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "58個のラベルを作成しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🏷️  ラベルを作成中...${NC}"
    
    if ./scripts/setup-github-labels.sh; then
        echo -e "${GREEN}✅ ラベルの作成が完了しました${NC}"
    else
        echo -e "${RED}❌ ラベルの作成に失敗しました${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  ラベルの作成をスキップしました${NC}"
fi
echo ""

# ====================================================
# Step 2: マイルストーン作成
# ====================================================
echo -e "${YELLOW}🎯 Step 2: マイルストーンの作成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "7個のマイルストーンを作成しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📅 マイルストーンを作成中...${NC}"
    echo ""
    
    # Phase 0: 基盤構築（完了済み）
    echo "  [1/7] Phase 0: 基盤構築"
    gh milestone create "Phase 0: 基盤構築" \
        --description "プロジェクト初期化、開発環境構築（完了済み）" \
        --due-date 2025-11-30 2>/dev/null || echo "    ⚠️  既に存在するか作成失敗"
    
    # Phase 1: データ取得
    echo "  [2/7] Phase 1: データ取得"
    gh milestone create "Phase 1: データ取得" \
        --description "FR-001〜007: 外部API連携、データ取得機能の実装" \
        --due-date 2025-12-31 2>/dev/null || echo "    ⚠️  既に存在するか作成失敗"
    
    # Phase 2: 分類機能
    echo "  [3/7] Phase 2: 分類機能"
    gh milestone create "Phase 2: 分類機能" \
        --description "FR-008〜011: 自動分類、カテゴリ管理の実装" \
        --due-date 2026-01-31 2>/dev/null || echo "    ⚠️  既に存在するか作成失敗"
    
    # Phase 3: クレジットカード
    echo "  [4/7] Phase 3: クレジットカード"
    gh milestone create "Phase 3: クレジットカード" \
        --description "FR-012〜015: カード管理、照合機能の実装" \
        --due-date 2026-02-28 2>/dev/null || echo "    ⚠️  既に存在するか作成失敗"
    
    # Phase 4: 集計・分析
    echo "  [5/7] Phase 4: 集計・分析"
    gh milestone create "Phase 4: 集計・分析" \
        --description "FR-016〜022: 月次・年次集計、イベント機能の実装" \
        --due-date 2026-03-31 2>/dev/null || echo "    ⚠️  既に存在するか作成失敗"
    
    # Phase 5: 可視化
    echo "  [6/7] Phase 5: 可視化"
    gh milestone create "Phase 5: 可視化" \
        --description "FR-023〜027: グラフ・チャート表示の実装" \
        --due-date 2026-04-30 2>/dev/null || echo "    ⚠️  既に存在するか作成失敗"
    
    # Phase 6: 設定機能
    echo "  [7/7] Phase 6: 設定機能"
    gh milestone create "Phase 6: 設定機能" \
        --description "FR-028〜031: 各種設定画面の実装" \
        --due-date 2026-05-31 2>/dev/null || echo "    ⚠️  既に存在するか作成失敗"
    
    echo ""
    echo -e "${GREEN}✅ マイルストーンの作成が完了しました${NC}"
    
    # 作成されたマイルストーンを表示
    echo ""
    echo -e "${BLUE}📊 作成されたマイルストーン:${NC}"
    gh milestone list
else
    echo -e "${YELLOW}⏭️  マイルストーンの作成をスキップしました${NC}"
fi
echo ""

# ====================================================
# Step 3: プロジェクトボード作成の案内
# ====================================================
echo -e "${YELLOW}📊 Step 3: プロジェクトボードの作成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}ℹ️  プロジェクトボードはGitHub Web UIから作成することを推奨します${NC}"
echo ""
echo "以下の手順で作成してください："
echo ""
echo "1. GitHub Projectsページを開く:"
echo "   https://github.com/$REPO_NAME/projects"
echo ""
echo "2. 「New project」をクリック"
echo ""
echo "3. テンプレートから「Board」を選択"
echo ""
echo "4. プロジェクト名: 「Account Book Development」"
echo ""
echo "5. 以下のカラムを設定:"
echo "   - 📋 Backlog (未着手)"
echo "   - 📝 To Do (着手予定)"
echo "   - 🚧 In Progress (作業中)"
echo "   - 👀 Review (レビュー待ち)"
echo "   - ✅ Done (完了)"
echo ""
echo "6. 既存のIssueを追加する場合は「Add items」から選択"
echo ""

read -p "ブラウザでProjectsページを開きますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🌐 ブラウザを開いています...${NC}"
    gh browse --projects
    echo -e "${GREEN}✅ ブラウザでProjectsページを開きました${NC}"
else
    echo -e "${YELLOW}⏭️  手動で以下のURLにアクセスしてください:${NC}"
    echo "   https://github.com/$REPO_NAME/projects"
fi
echo ""

# ====================================================
# 完了
# ====================================================
echo "======================================================"
echo -e "${GREEN}🎉 セットアップが完了しました！${NC}"
echo "======================================================"
echo ""
echo -e "${BLUE}📋 次のステップ:${NC}"
echo ""
echo "1. プロジェクトボードを作成（まだの場合）"
echo "   https://github.com/$REPO_NAME/projects"
echo ""
echo "2. Issueの作成を開始"
echo "   ./scripts/create-issues-batch.sh"
echo ""
echo "3. 作成されたラベルとマイルストーンを確認"
echo "   gh label list"
echo "   gh milestone list"
echo ""
echo "4. Issue作成時は適切なテンプレートを使用"
echo "   - 機能要件: Feature Request"
echo "   - バグ報告: Bug Report"
echo "   - タスク: Task"
echo ""
echo -e "${YELLOW}💡 詳細は .github/ISSUE_MANAGEMENT.md を参照してください${NC}"
echo ""

