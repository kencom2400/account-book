#!/bin/bash

# Restore status for non-Epic issues
# このスクリプトは、No Statusになってしまった通常のIssueのステータスを復元します

set -e

echo "🔄 Restoring status for non-Epic issues"
echo "========================================"
echo ""

REPO_OWNER="kencom2400"
REPO_NAME="account-book"
PROJECT_ID="PVT_kwHOANWYrs4BIOm-"
STATUS_FIELD_ID="PVTSSF_lAHOANWYrs4BIOm-zg4wCDo"

# New status IDs (after update)
BACKLOG_ID="f908f688"
TODO_ID="f36fcf60"
IN_PROGRESS_ID="16defd77"
REVIEW_ID="0f0f2f26"
DONE_ID="2f722d70"

# Function to update issue status
update_issue_status() {
    local item_id="$1"
    local issue_num="$2"
    local issue_state="$3"
    local status_id="$4"
    local status_name="$5"
    
    result=$(gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: \"$PROJECT_ID\"
        itemId: \"$item_id\"
        fieldId: \"$STATUS_FIELD_ID\"
        value: {
          singleSelectOptionId: \"$status_id\"
        }
      }) {
        projectV2Item {
          id
        }
      }
    }" 2>&1)
    
    if echo "$result" | jq -e '.data.updateProjectV2ItemFieldValue' > /dev/null 2>&1; then
        echo "  ✅ #$issue_num → $status_name"
    else
        echo "  ❌ Failed #$issue_num"
    fi
    
    sleep 0.15
}

echo "Fetching all items from project..."
all_items=$(gh project item-list 1 --owner @me --format json --limit 200)

echo ""
echo "Processing non-Epic issues..."
echo ""

# Process each item
echo "$all_items" | jq -c '.items[] | select(.content.type == "Issue" or .content.type == "PullRequest") | {id: .id, number: .content.number, labels: .labels, status: .status}' | while read -r item; do
    item_id=$(echo "$item" | jq -r '.id')
    issue_num=$(echo "$item" | jq -r '.number')
    labels=$(echo "$item" | jq -r '.labels[]?' | tr '\n' ',' | sed 's/,$//')
    current_status=$(echo "$item" | jq -r '.status')
    
    # Skip if status is already set (not null)
    if [ "$current_status" != "null" ] && [ -n "$current_status" ]; then
        continue
    fi
    
    # Skip Epic issues (181-196)
    if [ $issue_num -ge 181 ] && [ $issue_num -le 196 ]; then
        continue
    fi
    
    # Get issue state from GitHub API
    issue_data=$(gh api graphql -f query="
    query {
      repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") {
        issue(number: $issue_num) {
          state
        }
      }
    }" 2>/dev/null || echo '{"data":{"repository":{"issue":{"state":"OPEN"}}}}')
    
    issue_state=$(echo "$issue_data" | jq -r '.data.repository.issue.state // "OPEN"')
    
    # Determine appropriate status
    if [ "$issue_state" = "CLOSED" ]; then
        # Closed issues → Done
        update_issue_status "$item_id" "$issue_num" "$issue_state" "$DONE_ID" "✅ Done"
    else
        # Open issues → Backlog (default for open issues)
        update_issue_status "$item_id" "$issue_num" "$issue_state" "$BACKLOG_ID" "📋 Backlog"
    fi
done

echo ""
echo "✨ Status restoration completed!"
echo ""
echo "📊 Summary:"
echo "  - Closed issues → ✅ Done"
echo "  - Open issues → 📋 Backlog"
echo ""
echo "💡 Note: If some issues should be in other statuses (To Do, In Progress, Review),"
echo "   please update them manually in the Project UI."
echo ""
echo "🔗 View project: https://github.com/users/$REPO_OWNER/projects/1"

