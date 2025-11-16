# Geminiコードレビュー対応Issue作成

## Issue 1: Onion Architectureレイヤ図の修正

**タイトル:** [docs] Onion Architectureレイヤ図の修正 - 依存関係の方向を明確化

**ラベル:** documentation, priority: medium, size: S

**本文:**

```
## 概要
Geminiのコードレビューにより指摘された、`.cursor/rules/project.md`内のOnion Architectureレイヤ図の修正を行います。

## 問題点
現在のレイヤ図（22-30行目）は、依存関係の方向が誤解を招く表記になっています：
- 矢印 ↑ の表記が、Onion Architectureの原則「依存関係は内側に向かう」と矛盾
- Presentation LayerとInfrastructure Layerが階層的に配置されているが、実際は同列の外側レイヤ

## 修正内容
```

現在の図:
Domain Layer（最内層）
↑
Application Layer
↑
Infrastructure Layer
↑
Presentation Layer（最外層）

修正後:
依存関係は常に内側に向かいます。

- Presentation Layer は Application Layer に依存
- Infrastructure Layer は Application Layer に依存
- Application Layer は Domain Layer に依存

```

## 作業内容
- [ ] レイヤ図の修正（22-30行目）
- [ ] 依存関係のルールを明確化
- [ ] Presentation LayerとInfrastructure Layerが同列であることを表記

## 参考
- PR #1のGeminiコメント: https://github.com/kencom2400/account-book/pull/1#discussion_r1879319427

## 対象ファイル
- `.cursor/rules/project.md`

## 見積もり工数
0.5時間
```

---

## Issue 2: コミットメッセージガイドの命令形表記を明確化

**タイトル:** [docs] コミットメッセージガイドの命令形表記を明確化

**ラベル:** documentation, priority: low, size: XS

**本文:**

```
## 概要
Geminiのコードレビューにより指摘された、`.cursor/rules/commit.md`内のSubject記述ルールの表現を明確化します。

## 問題点
「命令形を使用」という表現が、日本語の文脈では分かりにくい可能性があります：
- 「追加」は名詞形（または動詞の連用形）であり、厳密には命令形（追加しろ・追加せよ）ではない
- 英語の "imperative mood" の直訳的な表現になっている

## 修正案
```

現在: 命令形を使用（「追加する」ではなく「追加」）

修正案1: 命令形で記述（「追加する」ではなく「追加」）
修正案2: 体言止めで記述（「追加する」ではなく「追加」）

```

## 作業内容
- [ ] Subject記述ルールの表現を修正（59行目）
- [ ] より明確で理解しやすい表現に変更

## 参考
- PR #2のGeminiコメント: https://github.com/kencom2400/account-book/pull/2#discussion_r1879319428

## 対象ファイル
- `.cursor/rules/commit.md`

## 見積もり工数
0.25時間
```

---

## 手動作成手順

GitHub CLIでエラーが発生するため、以下の手順で手動作成してください：

1. https://github.com/kencom2400/account-book/issues/new にアクセス
2. 上記の内容をコピー&ペースト
3. ラベルを設定
4. Issue作成後、Project "Account Book Development" に追加
