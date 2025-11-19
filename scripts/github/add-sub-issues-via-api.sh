#!/bin/bash

# Add sub-issues to Epic issues via GraphQL API
# このスクリプトは、GraphQL APIを使ってEpicにsub-issueを追加します

set -e

echo "🔗 Adding sub-issues to Epics via GraphQL API"
echo "=============================================="
echo ""

# Function to add sub-issue
add_sub_issue() {
    local parent_issue_num="$1"
    local child_issue_num="$2"
    
    echo "Adding #$child_issue_num as sub-issue of #$parent_issue_num"
    
    # Get parent Issue ID
    parent_id=$(gh api graphql -f query="
    query {
      repository(owner: \"kencom2400\", name: \"account-book\") {
        issue(number: $parent_issue_num) {
          id
        }
      }
    }" --jq '.data.repository.issue.id')
    
    # Get child Issue ID
    child_id=$(gh api graphql -f query="
    query {
      repository(owner: \"kencom2400\", name: \"account-book\") {
        issue(number: $child_issue_num) {
          id
        }
      }
    }" --jq '.data.repository.issue.id')
    
    if [ -z "$parent_id" ] || [ -z "$child_id" ]; then
        echo "  ❌ Failed to get Issue IDs"
        return 1
    fi
    
    # Add sub-issue using mutation
    result=$(gh api graphql -f query="
    mutation {
      addSubIssue(input: {
        issueId: \"$parent_id\"
        subIssueId: \"$child_id\"
        replaceParent: false
      }) {
        issue {
          number
          subIssuesSummary {
            total
            completed
          }
        }
      }
    }" 2>&1)
    
    if echo "$result" | jq -e '.data.addSubIssue.issue' > /dev/null 2>&1; then
        total=$(echo "$result" | jq -r '.data.addSubIssue.issue.subIssuesSummary.total')
        echo "  ✅ Added! Total sub-issues: $total"
    else
        echo "  ⚠️  Response: $result"
    fi
    
    sleep 0.3
}

echo "Starting sub-issue setup..."
echo ""

# EPIC-002: データ取得機能 (#182)
echo "📦 EPIC-002: データ取得機能 (#182)"
for issue in 47 48 49 50 51 52 53 22 28; do
    add_sub_issue 182 $issue
done
echo ""

echo "✨ Script completed!"
echo ""
echo "🔍 Verify by running:"
echo "  gh api graphql -f query='query { repository(owner: \"kencom2400\", name: \"account-book\") { issue(number: 182) { subIssuesSummary { total completed percentCompleted } } } }'"

