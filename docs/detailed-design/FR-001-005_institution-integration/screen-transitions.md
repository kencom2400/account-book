# 画面遷移図

このドキュメントでは、金融機関連携機能の画面遷移フローを記載しています。

## 目次

1. [全体画面遷移図](#全体画面遷移図)
2. [金融機関連携フロー (FR-001, FR-002, FR-003)](#金融機関連携フロー)
3. [接続状態確認フロー (FR-004)](#接続状態確認フロー)
4. [エラー通知フロー (FR-005)](#エラー通知フロー)

---

## 全体画面遷移図

```mermaid
flowchart TD
    Start[アプリ起動] --> Dashboard[ダッシュボード]
    Dashboard --> Settings[設定画面]
    Dashboard --> ConnCheck[接続状態確認]

    Settings --> SelectInst[金融機関選択]
    SelectInst --> AddBank[銀行追加]
    SelectInst --> AddCard[カード追加]
    SelectInst --> AddSec[証券追加]

    AddBank --> InputBankAuth[銀行認証情報入力]
    AddCard --> InputCardAuth[カード認証情報入力]
    AddSec --> InputSecAuth[証券認証情報入力]

    InputBankAuth --> TestBank[接続テスト中]
    InputCardAuth --> TestCard[接続テスト中]
    InputSecAuth --> TestSec[接続テスト中]

    TestBank --> Success[接続成功]
    TestCard --> Success
    TestSec --> Success

    TestBank --> Failure[接続失敗]
    TestCard --> Failure
    TestSec --> Failure

    Success --> Dashboard
    Failure --> ErrorNotif[エラー通知]
    ErrorNotif --> Retry{再試行?}
    Retry -->|はい| InputBankAuth
    Retry -->|いいえ| Dashboard

    ConnCheck --> ConnResult[接続結果表示]
    ConnResult --> Dashboard
```

---

## 金融機関連携フロー

### FR-001: 銀行口座との連携

```mermaid
flowchart TD
    Start[ダッシュボード] --> SettingsBtn[設定ボタン押下]
    SettingsBtn --> SettingsPage[設定画面]
    SettingsPage --> AddBankBtn[銀行追加ボタン]
    AddBankBtn --> BankList[対応銀行一覧]

    BankList --> Search{検索機能}
    Search --> SelectBank[銀行選択]

    SelectBank --> AuthForm[認証情報入力]
    AuthForm --> InputBankCode[銀行コード入力]
    InputBankCode --> InputBranchCode[支店コード入力]
    InputBranchCode --> InputAccountNum[口座番号入力]
    InputAccountNum --> InputAPIKey[APIキー入力]

    InputAPIKey --> Validate{バリデーション}
    Validate -->|エラー| ValidationErr[バリデーションエラー表示]
    ValidationErr --> AuthForm

    Validate -->|OK| TestConn[接続テスト実行]
    TestConn --> Loading[ローディング表示]
    Loading --> ConnTest{API接続}

    ConnTest -->|成功| SaveCreds[認証情報保存]
    SaveCreds --> FetchAccount[口座情報取得]
    FetchAccount --> SuccessMsg[成功メッセージ]
    SuccessMsg --> Dashboard[ダッシュボードへ]

    ConnTest -->|失敗| ErrorType{エラー種別判定}
    ErrorType -->|認証エラー| AuthError[認証エラー表示]
    ErrorType -->|タイムアウト| TimeoutError[タイムアウトエラー表示]
    ErrorType -->|APIエラー| APIError[APIエラー表示]

    AuthError --> RetryPrompt{再試行?}
    TimeoutError --> RetryPrompt
    APIError --> RetryPrompt

    RetryPrompt -->|はい| AuthForm
    RetryPrompt -->|いいえ| Dashboard
```

### FR-002: クレジットカードとの連携

```mermaid
flowchart TD
    Start[ダッシュボード] --> SettingsBtn[設定ボタン押下]
    SettingsBtn --> SettingsPage[設定画面]
    SettingsPage --> AddCardBtn[カード追加ボタン]
    AddCardBtn --> CardList[対応カード会社一覧]

    CardList --> SelectCard[カード会社選択]
    SelectCard --> AuthForm[認証情報入力]

    AuthForm --> InputCardNum[カード番号入力]
    InputCardNum --> InputExpiry[有効期限入力]
    InputExpiry --> InputHolder[カード名義入力]
    InputHolder --> InputLoginInfo[ログイン情報入力]

    InputLoginInfo --> Validate{バリデーション}
    Validate -->|エラー| ValidationErr[バリデーションエラー表示]
    ValidationErr --> AuthForm

    Validate -->|OK| TestConn[接続テスト実行]
    TestConn --> Loading[ローディング表示]
    Loading --> ConnTest{API接続}

    ConnTest -->|成功| SaveCreds[認証情報保存<br/>※下4桁のみ]
    SaveCreds --> FetchCardInfo[カード情報取得]
    FetchCardInfo --> FetchTransactions[利用明細取得<br/>過去3ヶ月]
    FetchTransactions --> SuccessMsg[成功メッセージ]
    SuccessMsg --> Dashboard[ダッシュボードへ]

    ConnTest -->|失敗| ErrorType{エラー種別判定}
    ErrorType -->|認証エラー| AuthError[認証エラー表示]
    ErrorType -->|有効期限切れ| ExpiryError[有効期限切れエラー]
    ErrorType -->|APIエラー| APIError[APIエラー表示]

    AuthError --> RetryPrompt{再試行?}
    ExpiryError --> RetryPrompt
    APIError --> RetryPrompt

    RetryPrompt -->|はい| AuthForm
    RetryPrompt -->|いいえ| Dashboard
```

### FR-003: 証券会社との連携

```mermaid
flowchart TD
    Start[ダッシュボード] --> SettingsBtn[設定ボタン押下]
    SettingsBtn --> SettingsPage[設定画面]
    SettingsPage --> AddSecBtn[証券追加ボタン]
    AddSecBtn --> SecList[対応証券会社一覧]

    SecList --> SelectSec[証券会社選択]
    SelectSec --> AuthForm[認証情報入力]

    AuthForm --> InputLoginID[ログインID入力]
    InputLoginID --> InputPassword[パスワード入力]
    InputPassword --> InputTradePW[取引暗証番号入力]
    InputTradePW --> SelectAccountType[口座種別選択]

    SelectAccountType --> Validate{バリデーション}
    Validate -->|エラー| ValidationErr[バリデーションエラー表示]
    ValidationErr --> AuthForm

    Validate -->|OK| TestConn[接続テスト実行]
    TestConn --> Loading[ローディング表示]
    Loading --> ConnTest{API接続}

    ConnTest -->|成功| SaveCreds[認証情報保存]
    SaveCreds --> FetchAccount[口座情報取得]
    FetchAccount --> FetchPortfolio[保有銘柄取得]
    FetchPortfolio --> SuccessMsg[成功メッセージ]
    SuccessMsg --> Dashboard[ダッシュボードへ]

    ConnTest -->|失敗| ErrorType{エラー種別判定}
    ErrorType -->|認証エラー| AuthError[認証エラー表示]
    ErrorType -->|時間外エラー| TimeError[取引時間外エラー]
    ErrorType -->|権限エラー| PermError[API権限エラー]

    AuthError --> RetryPrompt{再試行?}
    TimeError --> RetryPrompt
    PermError --> RetryPrompt

    RetryPrompt -->|はい| AuthForm
    RetryPrompt -->|いいえ| Dashboard
```

---

## 接続状態確認フロー

### FR-004: バックグラウンド接続確認

```mermaid
flowchart TD
    Start[アプリ起動] --> InitLoad[初期化処理]
    InitLoad --> BgCheck[バックグラウンド<br/>接続確認開始]

    BgCheck --> GetInstitutions[登録済み金融機関<br/>リスト取得]
    GetInstitutions --> ParallelCheck[並列接続テスト]

    ParallelCheck --> CheckBank[銀行接続確認]
    ParallelCheck --> CheckCard[カード接続確認]
    ParallelCheck --> CheckSec[証券接続確認]

    CheckBank --> BankResult{接続結果}
    CheckCard --> CardResult{接続結果}
    CheckSec --> SecResult{接続結果}

    BankResult -->|成功| UpdateBankStatus[ステータス更新:<br/>CONNECTED]
    BankResult -->|失敗| BankError[ステータス更新:<br/>DISCONNECTED]

    CardResult -->|成功| UpdateCardStatus[ステータス更新:<br/>CONNECTED]
    CardResult -->|失敗| CardError[ステータス更新:<br/>DISCONNECTED]

    SecResult -->|成功| UpdateSecStatus[ステータス更新:<br/>CONNECTED]
    SecResult -->|失敗| SecError[ステータス更新:<br/>DISCONNECTED]

    UpdateBankStatus --> SaveHistory[接続履歴保存]
    BankError --> SaveHistory
    UpdateCardStatus --> SaveHistory
    CardError --> SaveHistory
    UpdateSecStatus --> SaveHistory
    SecError --> SaveHistory

    SaveHistory --> CheckBatch{次のバッチあり?}
    CheckBatch -->|はい| ParallelCheck
    CheckBatch -->|いいえ| CheckErrors{エラーあり?}

    CheckErrors -->|はい| TriggerNotif[FR-005通知トリガー]
    CheckErrors -->|いいえ| UpdateUI[UI更新]

    TriggerNotif --> UpdateUI
    UpdateUI --> Dashboard[ダッシュボード表示]

    Dashboard --> ManualSync[手動同期ボタン]
    ManualSync --> BgCheck
```

### ダッシュボード接続状態表示

```mermaid
flowchart LR
    Dashboard[ダッシュボード] --> StatusArea[接続状態エリア]

    StatusArea --> GreenStatus[🟢 正常接続]
    StatusArea --> YellowStatus[🟡 24時間以上経過]
    StatusArea --> RedStatus[🔴 接続失敗]

    GreenStatus --> InstList[金融機関一覧]
    YellowStatus --> InstList
    RedStatus --> InstList

    InstList --> ClickInst[金融機関クリック]
    ClickInst --> DetailModal[詳細モーダル]

    DetailModal --> ShowLastSync[最終同期時刻]
    DetailModal --> ShowStatus[接続ステータス]
    DetailModal --> ManualSyncBtn[手動同期ボタン]

    ManualSyncBtn --> SyncStart[同期開始]
    SyncStart --> Progress[進捗表示]
    Progress --> Result[結果表示]
    Result --> Dashboard
```

---

## エラー通知フロー

### FR-005: 接続失敗通知

```mermaid
flowchart TD
    Trigger[接続失敗検出] --> ErrorAnalysis[エラー内容分析]

    ErrorAnalysis --> TypeCheck{エラー種別}
    TypeCheck -->|認証エラー| HighPriority[優先度: 高]
    TypeCheck -->|タイムアウト| MedPriority[優先度: 中]
    TypeCheck -->|APIエラー| MedPriority
    TypeCheck -->|その他| LowPriority[優先度: 低]

    HighPriority --> DupCheck{重複確認}
    MedPriority --> DupCheck
    LowPriority --> DupCheck

    DupCheck -->|24時間以内に<br/>通知済み| Skip[通知スキップ]
    DupCheck -->|未通知| CreateNotif[通知生成]

    CreateNotif --> CheckPriority{優先度}
    CheckPriority -->|高| ModalNotif[モーダル通知表示]
    CheckPriority -->|中| ToastNotif[トースト通知表示]
    CheckPriority -->|低| BannerNotif[バナー通知表示]

    ModalNotif --> ShowError[エラー内容表示]
    ToastNotif --> ShowError
    BannerNotif --> ShowError

    ShowError --> ShowAction[推奨アクション表示]
    ShowAction --> UserAction{ユーザーアクション}

    UserAction -->|設定を開く| SettingsPage[設定画面へ遷移]
    UserAction -->|再試行| RetryConn[再接続試行]
    UserAction -->|後で| DismissNotif[通知を閉じる]
    UserAction -->|閉じる| DismissNotif

    SettingsPage --> EditInst[金融機関編集]
    EditInst --> UpdateCreds[認証情報更新]
    UpdateCreds --> Dashboard[ダッシュボードへ]

    RetryConn --> ConnTest[接続テスト]
    ConnTest -->|成功| SuccessMsg[成功メッセージ]
    ConnTest -->|失敗| ShowError

    SuccessMsg --> Dashboard
    DismissNotif --> Dashboard
    Skip --> Dashboard
```

### エラー通知タイプ別フロー

```mermaid
flowchart TD
    Start[エラー検出] --> Classify{エラー分類}

    Classify -->|認証エラー| AuthErr[要対応通知]
    Classify -->|API側エラー| APIErr[情報通知]
    Classify -->|複数失敗| MultiErr[要確認通知]

    AuthErr --> AuthModal[モーダル表示]
    AuthModal --> AuthMsg["認証情報が無効です<br/>再度認証してください"]
    AuthMsg --> AuthActions[設定を開く / 後で]

    APIErr --> APIToast[トースト表示]
    APIToast --> APIMsg["データ取得失敗<br/>時間をおいて再試行"]
    APIMsg --> APIActions[再試行 / 閉じる]

    MultiErr --> MultiModal[モーダル表示]
    MultiModal --> MultiMsg["3件の金融機関で<br/>エラー発生"]
    MultiMsg --> ErrorList[エラー一覧表示]
    ErrorList --> MultiActions[詳細確認 / 閉じる]

    AuthActions --> End[完了]
    APIActions --> End
    MultiActions --> End
```

---

## 画面一覧

### 実装済み画面

| 画面名             | パス             | 説明                   | 機能要件    |
| ------------------ | ---------------- | ---------------------- | ----------- |
| ダッシュボード     | `/dashboard`     | 資産状況・接続状態表示 | FR-004      |
| 銀行追加画面       | `/banks/add`     | 銀行連携フォーム       | FR-001      |
| 設定画面           | `/settings`      | 金融機関管理           | FR-001〜003 |
| エラー通知モーダル | (コンポーネント) | エラー通知表示         | FR-005      |

### コンポーネント一覧

| コンポーネント名     | ファイル                   | 説明           | 機能要件    |
| -------------------- | -------------------------- | -------------- | ----------- |
| BankSelector         | `BankSelector.tsx`         | 銀行選択UI     | FR-001      |
| BankCredentialsForm  | `BankCredentialsForm.tsx`  | 認証情報入力   | FR-001      |
| ConnectionTestResult | `ConnectionTestResult.tsx` | 接続テスト結果 | FR-001〜003 |
| ErrorModal           | `ErrorModal.tsx`           | エラーモーダル | FR-005      |
| ErrorToast           | `ErrorToast.tsx`           | トースト通知   | FR-005      |

---

## 画面遷移のルール

### 一般原則

1. **戻るボタン**: 常に前の画面に戻れること
2. **キャンセル**: 作業中でもキャンセル可能
3. **自動遷移**: 成功時は自動的にダッシュボードへ
4. **エラー遷移**: エラー時は入力画面に留まる

### 状態保持

- 入力途中の情報は保持される (セッションストレージ)
- エラー後の再入力では前回値が復元される
- ページリロード時は入力内容がクリアされる

### アクセス制御

- 未認証ユーザーは設定画面にアクセス不可
- 金融機関追加は設定画面からのみ可能

---

## まとめ

この画面遷移図は、金融機関連携機能における全ての主要な画面フローを網羅しています。ユーザーはダッシュボードを起点として、各金融機関の追加・管理、接続状態確認、エラー通知への対応を行うことができます。
