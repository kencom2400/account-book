# Cursor Rules - Issue完了報告の自動化

このファイルは、Issue作業完了時の報告ルールです。

## 🚨 CRITICAL: 作業完了時の必須ルール 🚨

```
╔══════════════════════════════════════════════════════════════╗
║  🚨 Issue作業完了時は必ずGitHub Issueに報告コメント 🚨      ║
║                                                              ║
║  タイミング:                                                 ║
║  1. commit完了後（push前でも可）                             ║
║  2. 長時間作業（4時間超）の場合は途中報告                    ║
║                                                              ║
║  方法: gh issue comment コマンドで自動投稿                   ║
╚══════════════════════════════════════════════════════════════╝
```

## ルールの適用

### トリガー条件

以下のいずれかが満たされた時、自動的に報告コメントを作成：

1. **commit完了時**: 最終コミット完了後（push前でも可）
2. **作業完了を明示的に宣言した時**: 「作業完了」「完了しました」等のキーワード
3. **長時間作業の途中**: 4時間経過時

**推奨フロー**:

```
1. 作業完了
   ↓
2. git commit（すべての変更をコミット）
   ↓
3. Issue報告コメント投稿 ⭐ ここで報告
   ↓
4. git push
   ↓
5. PR作成
```

**メリット**:

- 作業内容が確定した時点で報告できる
- push前にIssue報告があるため、レビュアーが事前に内容を確認できる
- PRリンクは「作成予定」として報告し、後から更新も可能

### 報告対象のIssueタイプ

すべてのIssueタイプで報告を行う：

- `feature`: 新機能実装
- `task`: タスク実行
- `bug`: バグ修正
- `enhancement`: 機能改善
- `process`: プロセス改善
- `documentation`: ドキュメント更新
- その他すべてのIssueタイプ

### 除外対象

**Issueが存在しない場合のみ除外**：

- Issueが作成されていない作業
- Issue番号が紐付いていない作業

**注意**: 軽微な修正（typo、コメント修正等）であっても、Issueが存在する場合は報告を行ってください。

## 報告コマンドの実行

### 基本フォーマット

```bash
# コメント本文をヒアドキュメントで変数に格納
BODY=$(cat <<'EOF'
## 🎉 作業完了報告

Issue #<ISSUE_NUMBER>「<Issueタイトル>」の作業が完了しました。

---

## 📊 実施した作業

### <作業項目1>

**内容**:
- <詳細内容>

**成果物**:
- <ファイル1>
- <ファイル2>

**コミット**: `<コミットメッセージ>`

---

## 📂 成果物

### 新規作成ファイル（合計Xファイル）

1. **<カテゴリ1>** (Xファイル)
   - `path/to/file1`
   - `path/to/file2`

### 更新ファイル（合計Xファイル）

1. **<ファイル名>**
   - `path/to/file`
   - <変更内容の概要>

---

## ✅ 達成した目標

### Issueの受入基準

- [x] <受入基準1>
- [x] <受入基準2>

### 期待される効果

✅ **<効果1>**
- <詳細>

---

## 🚀 次のステップ

### 1. レビュー依頼
- [ ] <レビュー項目1>
- [ ] <レビュー項目2>

### 2. マージ後
- [ ] <実施事項1>

---

## 📊 作業時間

- <作業項目1>: 約X時間
- **合計**: 約X時間

---

## 🔗 関連リンク

- **PR**: <PR URL または「作成予定」>
- **ブランチ**: `feature/issue-XXX-description`
- **コミット数**: X

---

以上で、Issue #<ISSUE_NUMBER>の作業が完了しました。

**次のアクション**:
- [ ] git push
- [ ] PR作成
- [ ] レビュー依頼
EOF
)

# GitHub CLIでコメント投稿
gh issue comment <ISSUE_NUMBER> --body "$BODY"
```

### 実装例（AIアシスタント用）

```typescript
// AIアシスタントが作業完了を検知した際の処理フロー
async function reportIssueCompletion(issueNumber: number, context: WorkContext) {
  // 1. Issue情報の取得
  const issue = await getIssueDetails(issueNumber);

  // 2. 作業内容のまとめ
  const workSummary = summarizeWork(context);

  // 3. 成果物の収集
  const artifacts = collectArtifacts(context);

  // 4. コミット情報の取得
  const commits = getCommitHistory(context.branch);

  // 5. 報告コメントの生成
  const reportComment = generateReportComment({
    issue,
    workSummary,
    artifacts,
    commits,
    workTime: context.workTime,
  });

  // 6. GitHub Issueへの投稿
  await postIssueComment(issueNumber, reportComment);

  // 7. 完了ログの記録
  logCompletion(issueNumber, reportComment);
}
```

## 必須項目の説明

### 1. 実施した作業

- **作業項目ごとに記載**: Phase分けされている場合は各Phase
- **内容**: 何を行ったか簡潔に
- **成果物**: 作成・更新したファイル
- **コミット**: 関連するコミットメッセージ

### 2. 成果物サマリ

- **新規作成ファイル**: カテゴリ別に整理
- **更新ファイル**: 変更内容の概要付き
- **ファイル数**: 合計を明記

### 3. 達成した目標

- **受入基準**: Issueの受入基準チェック
- **期待される効果**: 実装による効果

### 4. 次のステップ

- **レビュー依頼**: 具体的なレビュー項目
- **マージ後のタスク**: 必要な作業

### 5. メタ情報

- **作業時間**: おおよその所要時間
- **関連リンク**: PR、ブランチ、コミット

## チェックリスト

報告前に以下を確認：

- [ ] Issue番号が正しい
- [ ] 実施した作業が具体的に記載されている
- [ ] 成果物（ファイル）が列挙されている
- [ ] 受入基準の達成状況が明記されている
- [ ] 次のステップ（レビュー依頼等）が明記されている
- [ ] PRへのリンクが含まれている
- [ ] コミット情報が含まれている

## 関連ドキュメント

- [詳細ルール](./issue-completion-report.md)
- [Issue管理ガイドライン](../.github/ISSUE_MANAGEMENT.md)
- [コミットルール](./commit.md)
