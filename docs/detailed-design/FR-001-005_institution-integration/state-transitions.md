# 状態遷移図

このドキュメントでは、金融機関連携機能における状態遷移を記載しています。

## 目次

1. [金融機関接続状態の遷移](#金融機関接続状態の遷移)
2. [通知状態の遷移](#通知状態の遷移)
3. [接続確認プロセスの状態遷移](#接続確認プロセスの状態遷移)
4. [クレジットカード決済状態の遷移](#クレジットカード決済状態の遷移)

---

## 金融機関接続状態の遷移

### 基本状態遷移

```mermaid
stateDiagram-v2
    [*] --> 未登録: 初期状態

    未登録 --> 接続テスト中: 金融機関追加開始

    接続テスト中 --> 接続成功: API接続成功
    接続テスト中 --> 接続失敗: API接続失敗

    接続成功 --> データ同期中: 初回データ取得開始

    データ同期中 --> 最新: 同期完了
    データ同期中 --> 同期エラー: 同期失敗

    最新 --> 同期中: 手動/自動同期実行
    同期中 --> 最新: 同期成功
    同期中 --> 同期エラー: 同期失敗

    最新 --> 再認証必要: トークン期限切れ検出
    同期エラー --> 再認証必要: 認証エラー検出

    再認証必要 --> 接続テスト中: 認証情報更新

    接続失敗 --> 接続テスト中: 再試行
    接続失敗 --> 未登録: 金融機関削除

    最新 --> 未登録: 金融機関削除
    再認証必要 --> 未登録: 金融機関削除
    同期エラー --> 未登録: 金融機関削除
```

### 詳細状態と遷移条件

```mermaid
stateDiagram-v2
    state "未登録" as unregistered
    state "接続テスト中" as testing
    state "接続成功" as connected
    state "接続失敗" as failed
    state "データ同期中" as syncing
    state "最新" as uptodate
    state "同期エラー" as syncerror
    state "再認証必要" as needreauth

    unregistered --> testing: ユーザーが金融機関追加
    note right of unregistered
        ステータス: null
        isConnected: false
    end note

    testing --> connected: API testConnection() が成功
    testing --> failed: API testConnection() が失敗<br/>またはタイムアウト
    note right of testing
        ステータス: CHECKING
        ローディング表示
    end note

    connected --> syncing: 初回データ取得開始
    note right of connected
        ステータス: CONNECTED
        isConnected: true
    end note

    syncing --> uptodate: fetchData() 成功
    syncing --> syncerror: fetchData() 失敗
    note right of syncing
        ステータス: CONNECTED
        進捗表示
    end note

    uptodate --> syncing: 手動同期 or<br/>定期自動同期<br/>（24時間ごと）
    note right of uptodate
        ステータス: CONNECTED
        lastSyncedAt: 最新
    end note

    syncerror --> needreauth: エラーコードが<br/>認証関連<br/>（401, 403）
    syncerror --> syncing: その他エラー<br/>かつ再試行
    note right of syncerror
        ステータス: CONNECTED
        lastSyncedAt: 過去
    end note

    uptodate --> needreauth: 接続確認で<br/>トークン期限切れ検出
    note right of needreauth
        ステータス: NEED_REAUTH
        isConnected: false
    end note

    needreauth --> testing: ユーザーが<br/>認証情報を更新

    failed --> testing: ユーザーが再試行
    failed --> unregistered: ユーザーが削除
    note right of failed
        ステータス: DISCONNECTED
        isConnected: false
        エラーメッセージ表示
    end note
```

### ステータス定義

| ステータス   | 値 (ConnectionStatus) | 説明                           | UI表示       |
| ------------ | --------------------- | ------------------------------ | ------------ |
| 未登録       | -                     | 金融機関が登録されていない状態 | -            |
| 接続テスト中 | `CHECKING`            | API接続テスト実行中            | ローディング |
| 接続成功     | `CONNECTED`           | API接続成功、利用可能          | 🟢 緑        |
| 接続失敗     | `DISCONNECTED`        | API接続失敗                    | 🔴 赤        |
| データ同期中 | `CONNECTED`           | データ取得中                   | 進捗バー     |
| 最新         | `CONNECTED`           | データが最新                   | 🟢 緑        |
| 同期エラー   | `DISCONNECTED`        | データ同期失敗                 | 🔴 赤        |
| 再認証必要   | `NEED_REAUTH`         | 認証情報の再入力が必要         | 🟡 黄        |

---

## 通知状態の遷移

### 通知ライフサイクル

```mermaid
stateDiagram-v2
    [*] --> 未表示: 初期状態

    未表示 --> 表示待機: エラー検出

    表示待機 --> 重複チェック: 通知生成

    重複チェック --> スキップ: 24時間以内に<br/>同じエラーを通知済み
    重複チェック --> 表示中: 未通知 or<br/>24時間以上経過

    スキップ --> 未表示: 通知しない

    表示中 --> ユーザー確認済み: ユーザーが<br/>「設定を開く」を選択
    表示中 --> 後で確認: ユーザーが<br/>「後で」を選択
    表示中 --> 却下: ユーザーが<br/>「閉じる」を選択

    ユーザー確認済み --> アーカイブ: 問題解決
    後で確認 --> 未表示: 次回起動時まで非表示
    却下 --> アーカイブ: 通知削除

    後で確認 --> 表示中: 次回アプリ起動時<br/>（問題未解決の場合）

    アーカイブ --> [*]: 30日後に自動削除
```

### 通知優先度別の表示フロー

```mermaid
stateDiagram-v2
    state "エラー検出" as error_detected
    state "優先度判定" as priority_check
    state "優先度: 高" as high_priority
    state "優先度: 中" as med_priority
    state "優先度: 低" as low_priority
    state "モーダル表示" as modal
    state "トースト表示" as toast
    state "バナー表示" as banner

    error_detected --> priority_check

    priority_check --> high_priority: 認証エラー<br/>複数失敗
    priority_check --> med_priority: タイムアウト<br/>APIエラー
    priority_check --> low_priority: その他エラー

    high_priority --> modal: 即座に表示
    med_priority --> toast: 即座に表示
    low_priority --> banner: バナーに追加

    modal --> [*]: ユーザーアクション後
    toast --> [*]: 5秒後 or<br/>ユーザーが閉じる
    banner --> [*]: ユーザーが閉じる

    note right of modal
        モーダルポップアップ
        画面中央に表示
        背景暗転
        操作必須
    end note

    note right of toast
        トースト通知
        画面右上に表示
        自動消滅
        操作任意
    end note

    note right of banner
        バナー通知
        ダッシュボード上部
        常時表示
        操作任意
    end note
```

---

## 接続確認プロセスの状態遷移

### バックグラウンド接続確認

```mermaid
stateDiagram-v2
    [*] --> アイドル: アプリ起動

    アイドル --> 確認開始: トリガー<br/>・アプリ起動<br/>・手動同期<br/>・定期実行

    確認開始 --> 金融機関リスト取得: 登録済み<br/>金融機関を取得

    金融機関リスト取得 --> 並列確認実行: 最大5件並列

    state 並列確認実行 {
        [*] --> 銀行1確認
        [*] --> 銀行2確認
        [*] --> カード1確認

        銀行1確認 --> 銀行1結果
        銀行2確認 --> 銀行2結果
        カード1確認 --> カード1結果

        銀行1結果 --> [*]
        銀行2結果 --> [*]
        カード1結果 --> [*]
    }

    並列確認実行 --> 結果集約: 全確認完了

    結果集約 --> エラー判定: 結果を分析

    エラー判定 --> 通知生成: エラーあり
    エラー判定 --> UI更新: エラーなし

    通知生成 --> UI更新: 通知送信

    UI更新 --> 履歴保存: ステータス更新完了

    履歴保存 --> アイドル: 処理完了
```

### 個別金融機関の確認フロー

```mermaid
stateDiagram-v2
    [*] --> 確認開始: 接続確認トリガー

    確認開始 --> API呼び出し: testConnection()

    state API呼び出し {
        [*] --> リクエスト送信
        リクエスト送信 --> レスポンス待機

        state タイムアウト_check <<choice>>
        レスポンス待機 --> タイムアウト_check: 10秒経過?

        タイムアウト_check --> タイムアウトエラー: Yes
        タイムアウト_check --> レスポンス受信: No

        レスポンス受信 --> [*]
        タイムアウトエラー --> [*]
    }

    state 結果判定 <<choice>>
    API呼び出し --> 結果判定

    結果判定 --> 成功処理: 200 OK
    結果判定 --> 認証エラー処理: 401/403
    結果判定 --> 一時エラー処理: 500/503/Timeout

    成功処理 --> ステータス更新_成功: CONNECTED
    認証エラー処理 --> ステータス更新_認証: NEED_REAUTH
    一時エラー処理 --> リトライ判定

    state リトライ判定 <<choice>>
    リトライ判定 --> リトライ実行: リトライ回数 < 3
    リトライ判定 --> ステータス更新_失敗: リトライ回数 >= 3

    リトライ実行 --> 確認開始: 5秒待機後

    ステータス更新_成功 --> 履歴記録: CONNECTED
    ステータス更新_認証 --> 履歴記録: NEED_REAUTH
    ステータス更新_失敗 --> 履歴記録: DISCONNECTED

    履歴記録 --> [*]: 完了
```

---

## クレジットカード決済状態の遷移

### 決済ステータスの遷移 (FR-002, FR-012関連)

```mermaid
stateDiagram-v2
    [*] --> 利用発生: カード利用

    利用発生 --> 未確定: 利用明細取得
    note right of 未確定
        status: PENDING
        決済ステータス: 未確定
        カード会社で処理中
    end note

    未確定 --> 確定: 締め日通過
    note right of 確定
        status: SETTLED
        決済ステータス: 確定
        引落日が確定
    end note

    確定 --> 支払済み: 引落日に銀行引落実行
    note right of 支払済み
        status: PAID
        決済ステータス: 支払済み
        銀行口座から引落完了
    end note

    支払済み --> 照合済み: FR-013銀行引落と照合
    note right of 照合済み
        status: PAID
        isReconciled: true
        銀行取引と突合完了
    end note

    未確定 --> キャンセル: 利用取消
    確定 --> キャンセル: 利用取消
    note right of キャンセル
        status: CANCELLED
        決済ステータス: キャンセル
    end note

    照合済み --> [*]: 完了
    キャンセル --> [*]: 完了
```

### 支払いサイクルの状態遷移

```mermaid
stateDiagram-v2
    state "当月利用中" as current_month
    state "締め日" as closing_day
    state "請求確定" as billing_confirmed
    state "引落予定日" as payment_scheduled
    state "引落実行" as payment_executed
    state "次月へ" as next_month

    [*] --> current_month: 月初

    current_month --> current_month: カード利用発生
    note right of current_month
        利用明細蓄積
        status: PENDING
    end note

    current_month --> closing_day: 締め日到達<br/>（例: 毎月15日）

    closing_day --> billing_confirmed: 請求額確定
    note right of billing_confirmed
        請求額計算完了
        利用明細: SETTLED
        引落予定日確定
    end note

    billing_confirmed --> payment_scheduled: 引落予定日待機
    note right of payment_scheduled
        引落予定日まで待機
        （例: 翌月10日）
    end note

    payment_scheduled --> payment_executed: 引落日到達
    note right of payment_executed
        銀行口座から引落
        status: PAID
    end note

    payment_executed --> next_month: 次月へ移行
    next_month --> current_month: 新しい月の開始
```

---

## 状態遷移の制約条件

### 金融機関接続状態

| 現在の状態   | 許可される遷移先           | 遷移条件                     |
| ------------ | -------------------------- | ---------------------------- |
| 未登録       | 接続テスト中               | ユーザーが金融機関追加を開始 |
| 接続テスト中 | 接続成功, 接続失敗         | API接続テストの結果          |
| 接続成功     | データ同期中               | 自動的に遷移                 |
| データ同期中 | 最新, 同期エラー           | データ取得の結果             |
| 最新         | 同期中, 再認証必要, 未登録 | 手動同期/自動確認/削除       |
| 同期エラー   | 同期中, 再認証必要, 未登録 | 再試行/認証エラー/削除       |
| 再認証必要   | 接続テスト中, 未登録       | 認証情報更新/削除            |
| 接続失敗     | 接続テスト中, 未登録       | 再試行/削除                  |

### 通知状態

| 現在の状態       | 許可される遷移先                 | 遷移条件           |
| ---------------- | -------------------------------- | ------------------ |
| 未表示           | 表示待機                         | エラー検出         |
| 表示待機         | 重複チェック                     | 自動的に遷移       |
| 重複チェック     | スキップ, 表示中                 | 重複判定の結果     |
| 表示中           | ユーザー確認済み, 後で確認, 却下 | ユーザーアクション |
| ユーザー確認済み | アーカイブ                       | 問題解決           |
| 後で確認         | 未表示, 表示中                   | 時間経過           |
| 却下             | アーカイブ                       | 自動的に遷移       |

### クレジットカード決済

| 現在の状態 | 許可される遷移先     | 遷移条件           |
| ---------- | -------------------- | ------------------ |
| 利用発生   | 未確定               | カード利用明細取得 |
| 未確定     | 確定, キャンセル     | 締め日通過 or 取消 |
| 確定       | 支払済み, キャンセル | 引落実行 or 取消   |
| 支払済み   | 照合済み             | 銀行引落と照合完了 |
| キャンセル | (終了)               | 終了状態           |
| 照合済み   | (終了)               | 終了状態           |

---

## 状態遷移のイベント一覧

### トリガーとなるイベント

| イベント名         | 発生タイミング               | 影響する状態遷移          |
| ------------------ | ---------------------------- | ------------------------- |
| アプリ起動         | ユーザーがアプリを開く       | 接続確認プロセス開始      |
| 金融機関追加       | ユーザーが新規金融機関を追加 | 未登録 → 接続テスト中     |
| API接続テスト成功  | 外部APIとの接続成功          | 接続テスト中 → 接続成功   |
| API接続テスト失敗  | 外部APIとの接続失敗          | 接続テスト中 → 接続失敗   |
| データ同期開始     | 手動 or 自動同期実行         | 最新 → 同期中             |
| データ同期成功     | データ取得完了               | 同期中 → 最新             |
| データ同期失敗     | データ取得失敗               | 同期中 → 同期エラー       |
| 認証エラー検出     | API が401/403を返却          | 任意 → 再認証必要         |
| トークン期限切れ   | 定期確認で検出               | 最新 → 再認証必要         |
| 認証情報更新       | ユーザーが認証情報を再入力   | 再認証必要 → 接続テスト中 |
| 金融機関削除       | ユーザーが削除を実行         | 任意 → 未登録             |
| エラー検出         | 接続確認でエラー             | 未表示 → 表示待機         |
| 通知表示           | エラー内容を分析後           | 表示待機 → 表示中         |
| ユーザーアクション | 通知への操作                 | 表示中 → 各種状態         |
| 締め日到達         | カード締め日                 | 未確定 → 確定             |
| 引落日到達         | カード引落日                 | 確定 → 支払済み           |
| 銀行引落照合       | FR-013処理                   | 支払済み → 照合済み       |

---

## まとめ

この状態遷移図は、金融機関連携機能における全ての状態とその遷移条件を明確に示しています。各状態は明確に定義され、遷移条件も具体的に記載されているため、実装時の指針として活用できます。
