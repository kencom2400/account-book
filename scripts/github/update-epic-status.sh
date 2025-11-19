#!/bin/bash

# Update all Epic issues to have "Epic" status in GitHub Project
# このスクリプトは、全EpicのステータスをEpicに変更します

set -e

echo "🎯 Updating all Epic issues to 'Epic' status"
echo "============================================="
echo ""

REPO_OWNER="kencom2400"
REPO_NAME="account-book"
PROJECT_ID="PVT_kwHOANWYrs4BIOm-"
STATUS_FIELD_ID="PVTSSF_lAHOANWYrs4BIOm-zg4wCDo"
EPIC_STATUS_ID="9aa232cf"

# Function to update issue status in project
update_issue_status() {
    local issue_num="$1"
    
    # Get the ProjectV2Item ID for this issue
    item_data=$(gh project item-list 1 --owner @me --format json --limit 200 | \
                jq ".items[] | select(.content.number == $issue_num)")
    
    if [ -z "$item_data" ]; then
        echo "  ⚠️  Issue #$issue_num not found in project"
        return 1
    fi
    
    item_id=$(echo "$item_data" | jq -r '.id')
    
    # Update the status field
    result=$(gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(input: {
        projectId: \"$PROJECT_ID\"
        itemId: \"$item_id\"
        fieldId: \"$STATUS_FIELD_ID\"
        value: {
          singleSelectOptionId: \"$EPIC_STATUS_ID\"
        }
      }) {
        projectV2Item {
          id
        }
      }
    }" 2>&1)
    
    if echo "$result" | jq -e '.data.updateProjectV2ItemFieldValue' > /dev/null 2>&1; then
        echo "  ✅ Epic #$issue_num → Status: 🎯 Epic"
    else
        echo "  ❌ Failed to update #$issue_num: $(echo $result | jq -r '.errors[0].message' 2>/dev/null || echo 'Unknown error')"
    fi
    
    sleep 0.2
}

echo "Updating Epic issues..."
echo ""

# Update all 16 Epic issues
for epic_num in 181 182 183 184 185 186 187 188 189 190 191 192 193 194 195 196; do
    update_issue_status $epic_num
done

echo ""
echo "✨ All Epic issues updated!"
echo ""
echo "🔍 Verify by viewing the project:"
echo "  https://github.com/users/$REPO_OWNER/projects/1"

