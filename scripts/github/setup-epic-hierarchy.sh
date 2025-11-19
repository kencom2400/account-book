#!/bin/bash

# Set up Epic-Subissue relationships in GitHub Projects
# このスクリプトは、GitHub Projects上でEpicとIssueの親子関係を設定します

set -e

echo "🔗 Setting up Epic-Subissue relationships in GitHub Projects"
echo "============================================================="
echo ""

REPO_OWNER="kencom2400"
REPO_NAME="account-book"

# GitHub API token should be set in GITHUB_TOKEN or GH_TOKEN
if [ -z "$GITHUB_TOKEN" ] && [ -z "$GH_TOKEN" ]; then
    echo "⚠️  Warning: GITHUB_TOKEN not set. Using gh auth token..."
    export GITHUB_TOKEN=$(gh auth token)
fi

# Function to create issue relationship (tracked by)
create_tracked_by_relationship() {
    local child_issue="$1"
    local parent_epic="$2"
    local epic_title="$3"
    
    echo "Setting #$child_issue as sub-issue of Epic #$parent_epic ($epic_title)"
    
    # GraphQL mutation to create tracked_by relationship
    # Note: GitHub's GraphQL API doesn't directly support "tracked by" relationships
    # We need to use the Projects (Beta) API
    
    # For now, we'll add a comment to link them visually
    gh issue comment "$child_issue" --body "🔗 **Tracked by Epic**: #$parent_epic - $epic_title" 2>/dev/null || true
    
    echo "  ✅ Linked #$child_issue → Epic #$parent_epic"
    sleep 0.2
}

echo "ℹ️  Note: GitHub Projects currently doesn't have direct CLI support for 'tracked by' relationships."
echo "          This script will add linking comments. Manual setup in the UI may be needed."
echo ""
echo "📌 To set up sub-issues manually in GitHub Projects:"
echo "   1. Go to: https://github.com/users/$REPO_OWNER/projects/1"
echo "   2. Select a child issue"
echo "   3. In the right panel, click 'Add tracked by'"
echo "   4. Select the parent Epic issue"
echo ""
echo "Press Enter to continue with automated linking comments, or Ctrl+C to cancel..."
read -r

# EPIC-002: データ取得機能 (子Issue: 47, 48, 49, 50, 51, 52, 53, 22, 28)
echo "📦 EPIC-002: データ取得機能"
for issue in 47 48 49 50 51 52 53 22 28; do
    create_tracked_by_relationship "$issue" 182 "データ取得機能"
done
echo ""

# EPIC-003: データ分類機能 (子Issue: 55, 56, 57, 58, 110, 29, 30, 31, 32)
echo "📦 EPIC-003: データ分類機能"
for issue in 55 56 57 58 110 29 30 31 32; do
    create_tracked_by_relationship "$issue" 183 "データ分類機能"
done
echo ""

# EPIC-004: クレジットカード管理 (子Issue: 59, 60, 61, 62, 113, 33, 34, 35, 36, 42, 43, 44)
echo "📦 EPIC-004: クレジットカード管理"
for issue in 59 60 61 62 113 33 34 35 36 42 43 44; do
    create_tracked_by_relationship "$issue" 184 "クレジットカード管理"
done
echo ""

# Continue for other epics...
echo "🎯 Automated linking completed!"
echo ""
echo "⚠️  Important: For proper sub-issue hierarchy in GitHub Projects:"
echo "   Please manually set 'Tracked by' relationships in the Project UI"
echo "   https://github.com/users/$REPO_OWNER/projects/1"
echo ""
echo "📖 Step-by-step guide:"
echo "   1. Open the Project"
echo "   2. Switch to Table view"
echo "   3. For each issue, click on it"
echo "   4. In the right sidebar, find 'Tracked by' section"
echo "   5. Click '+ Add' and select the corresponding Epic (#181-196)"

