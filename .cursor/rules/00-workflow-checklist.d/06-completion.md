# マージ・完了報告フェーズ

## 5️⃣ マージ・完了報告フェーズ

### ✅ マージ時の自動処理

**🚨 CRITICAL: Issueを Doneに変更するタイミング**

- ✅ **PRがmainにマージされた後のみ** Issueを Doneに変更
- ❌ **PR作成時やマージ前にDoneに変更することは絶対禁止**
- ✅ PRマージまではIn Progressのまま維持

**PRマージ時に実行:**

- [ ] PRをmainにマージ
- [ ] マージ確認後、IssueのステータスをDoneに更新
- [ ] Issueをクローズ

**参照ルール:**

- **`.cursor/rules/04-github-integration.d/02-status-management.md`** - ステータス更新

### 📊 Issue完了報告

**🚨 CRITICAL: commit完了後は必ずIssue報告**

**タイミング:**

- commit完了後（push前でも可）
- 長時間作業（4時間超）の場合は途中報告

**報告内容:**

- 実施した作業
- 成果物（ファイルリスト）
- 達成した目標（受入基準）
- 次のステップ（レビュー依頼等）
- 作業時間
- 関連リンク（PR、ブランチ、コミット）

**実行方法:**

```bash
gh issue comment <ISSUE_NUMBER> --body "<報告内容>"
```

**参照ルール:**

- **`.cursor/rules/04-github-integration.d/03-issue-reporting.md`** - Issue報告
- **`.cursor/rules/templates/issue-report.md`** - 報告テンプレート

---

## 🔄 フェーズ間の状態遷移

### GitHub Projectsステータス

```
📝 To Do → 🚧 In Progress → ✅ Done
```

**遷移タイミング:**

- **To Do → In Progress**: タスク開始時（`@start-task`実行時、フィーチャーブランチ作成後）
- **In Progress → Done**: **PRがmainにマージされた後のみ**

**🚨 CRITICAL: 絶対禁止事項**

- ❌ **PR作成時にDoneに変更することは絶対禁止**
- ❌ **PRマージ前にDoneに変更することは絶対禁止**
- ✅ **PRマージ後のみDoneに変更可能**

**参照ルール:**

- **`.cursor/rules/04-github-integration.d/02-status-management.md`** - ステータス管理
