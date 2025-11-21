# Issue #199が@start-taskで認識されなかった問題の原因と対策

## 発生日時

2025-11-21

## 問題の概要

`@start-task` コマンド実行時に、Issue #199が認識されず、作業可能なタスクとして表示されなかった。

## 調査結果

### 原因1: GitHub Issueの状態がCLOSED

- **Issue #199の状態**: CLOSED
- **プロジェクトボードのステータス**: 📝 To Do
- **問題**: GitHub IssueとProjectsボードの状態が不整合だった

### 原因2: `gh project item-list`の--limit値不足

- **プロジェクトの総アイテム数**: 178件
- **当初の--limit値**: 100
- **問題**: Issue #199が100番目以降に存在し、取得対象外だった可能性

### 原因3: IssueのState確認が不足

- **既存のコード**: AssigneeのみをチェックしていたIssue のState（OPEN/CLOSED）を確認していなかった
- **問題**: CLOSEDのIssueも作業対象として扱われる可能性があった

## 実行されたコマンドの問題点

```bash
# 問題のあるコマンド
TODO_ISSUES=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 100 | \
  jq -r '.items[] | select(.status == "📝 To Do") | .content.number')
```

### 問題点

1. `--limit 100` が不十分（プロジェクトに178アイテム存在）
2. Issue StateのチェックがAssigneeチェックの後にも実施されていない

## 対策

### 1. `--limit` 値の増加

```bash
# 改善後
TODO_ISSUES=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 9999 | \
  jq -r '.items[] | select(.status == "📝 To Do") | .content.number')
```

**理由**:

- `--limit`のデフォルト値は30件で非常に少ない
- `--limit 9999`を設定することで実質的にすべてのアイテムを取得
- 一般的なプロジェクトで9999アイテムを超えることはまずない
- 将来的にこの値を超える場合は、ページネーション対応を検討

### 2. Issue State確認の追加

```bash
# 改善後
for issue_num in $TODO_ISSUES; do
  # Assignee情報とState情報を同時に取得
  issue_info=$(gh issue view "$issue_num" --json assignees,state --jq '{assignees: [.assignees[].login], state: .state}' 2>/dev/null)
  assignees=$(echo "$issue_info" | jq -r '.assignees[]' 2>/dev/null)
  issue_state=$(echo "$issue_info" | jq -r '.state' 2>/dev/null)

  # OPENなIssueで、かつ自分にアサインされているものをフィルタリング
  if [ "$issue_state" = "OPEN" ] && echo "$assignees" | grep -q "$current_user"; then
    ASSIGNED_ISSUES+=("$issue_num")
  fi
done
```

**理由**:

- CLOSEDなIssueは作業対象外として除外
- プロジェクトボードの状態とGitHub Issueの状態が不整合の場合に対応

### 3. ユーザーへの明示的な通知

Issue取得後、以下の情報をユーザーに報告：

- 取得したTo DoステータスのIssue数
- フィルタリング後のアサイン済みIssue数
- 除外されたIssue（CLOSEDなど）の情報

## 実施した暫定対応

1. Issue #199を再オープン
2. 再度`@start-task`を実行可能な状態に復旧

## task-trigger.mdへの反映事項

以下のセクションを更新：

### 1. チケット取得コマンドの修正

```bash
# ⚠️ IMPORTANT: --limit は十分に大きな値を指定すること
# プロジェクトに多数のアイテムがある場合、デフォルト値や100では不足する
# 推奨値: --limit 9999 （実質無制限）
TODO_ISSUES=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 9999 | \
  jq -r '.items[] | select(.status == "📝 To Do") | .content.number')
```

**limit値の選択理由**:

- `9999`は実質的に無制限として機能
- プロジェクトの成長に応じて調整不要
- 根本的な解決策として推奨

### 2. Issue State確認の追加

OPENなIssueのみをフィルタリングするロジックを追加

### 3. トラブルシューティングセクションの追加

- **Issue取得漏れが発生する**
  - `--limit` 値を十分に大きく設定（9999（実質無制限）を推奨）
  - プロジェクトアイテム数を確認：`gh project item-list <PROJECT_NUMBER> --owner <OWNER> --format json --limit 9999 | jq '.items | length'`
  - `task-trigger.md`の実装例と統一した値を使用

- **CLOSEDなIssueがTo Doに表示される**
  - プロジェクトボードのステータスとGitHub Issue状態が不整合の場合
  - IssueのStateを必ず確認し、OPENなもののみを対象とする
  - 必要に応じてIssueを再オープンするか、プロジェクトから削除する

## 検証方法

### 1. プロジェクトアイテム数の確認

```bash
gh project item-list 1 --owner kencom2400 --format json --limit 9999 | jq '.items | length'
```

### 2. To Doステータスのアイテム確認

```bash
gh project item-list 1 --owner kencom2400 --format json --limit 500 | \
  jq -r '.items[] | select(.status == "📝 To Do") | {number: .content.number, title: .content.title, assignees: .assignees}'
```

### 3. 特定IssueのState確認

```bash
gh issue view 199 --json number,title,state,assignees
```

## 今後の改善案

1. **定期的なプロジェクトボード整合性チェック**
   - CLOSEDなIssueがTo Doステータスになっていないか確認
   - スクリプト化して定期実行

2. **--limit値の動的調整**
   - プロジェクトアイテム数を先に取得
   - その値に基づいて--limit値を設定

3. **エラーハンドリングの強化**
   - Issue取得漏れが発生した場合の警告
   - フィルタリングで除外されたIssueの情報をログ出力

## まとめ

**根本原因**:

1. `--limit 100` が不十分だった
2. IssueのState（OPEN/CLOSED）確認が不足していた
3. Issue #199がCLOSED状態だったにもかかわらず、プロジェクトボードでTo Doステータスだった

**対策**:

1. `--limit 500` に増加
2. Issue Stateの確認を追加（OPENのみを対象）
3. トラブルシューティング情報をドキュメントに追加

**効果**:

- 同様の問題の再発を防止
- Issue取得漏れを確実に防ぐ
- プロジェクトボードとGitHub Issueの不整合にも対応
