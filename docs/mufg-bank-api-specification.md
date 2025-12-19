# 三菱UFJ銀行API仕様書

## 概要

三菱UFJ銀行の口座情報API（口座\_v2）の仕様書です。
このドキュメントは、提供されたOpenAPI仕様書（口座\_v2-1.1.1.yaml）に基づいています。

## API情報

- **タイトル**: 口座\_v2
- **バージョン**: 1.1.1
- **ベースURL**: `https://developer.api.bk.mufg.jp/btmu/retail/trial/v2/me/accounts`
- **スキーム**: HTTPS
- **Content-Type**: `application/json`

## 認証

### X-IBM-Client-Id（必須）

- **タイプ**: API Key
- **場所**: HTTPヘッダー
- **ヘッダー名**: `X-IBM-Client-Id`
- **説明**: クライアントID（APIキー）

### X-BTMU-Seq-No（必須）

- **タイプ**: 文字列
- **場所**: HTTPヘッダー
- **ヘッダー名**: `X-BTMU-Seq-No`
- **長さ**: 25文字（固定）
- **説明**: シーケンス番号（リクエストごとに一意の値を生成）

## エンドポイント

### 1. 口座情報照会

**エンドポイント**: `GET /`

**リクエストヘッダー**:

- `X-IBM-Client-Id`: クライアントID（必須）
- `X-BTMU-Seq-No`: シーケンス番号（必須、25文字）

**レスポンス**: `AccountResponse`（Account[]の配列）

**ステータスコード**:

- `200`: 成功
- その他: エラー（ErrorResponse）

### 2. 入出金明細照会

**エンドポイント**: `GET /{account_id}/transactions`

**パスパラメータ**:

- `account_id`: 口座ID（必須、12文字）

**クエリパラメータ**:

- `inquiryDateFrom`: 照会開始日（必須、YYYY-MM-DD形式、10文字）
- `inquiryDateTo`: 照会終了日（必須、YYYY-MM-DD形式、10文字）
- `nextKeyword`: 次明細取得キーワード（オプション、23文字）

**リクエストヘッダー**:

- `X-IBM-Client-Id`: クライアントID（必須）
- `X-BTMU-Seq-No`: シーケンス番号（必須、25文字）

**レスポンス**: `TransactionResponse`

**ステータスコード**:

- `200`: 成功
- その他: エラー（ErrorResponse）

### 3. 定期預金明細照会

**エンドポイント**: `GET /{account_id}/term-deposits`

**パスパラメータ**:

- `account_id`: 口座ID（必須、12文字）

**リクエストヘッダー**:

- `X-IBM-Client-Id`: クライアントID（必須）
- `X-BTMU-Seq-No`: シーケンス番号（必須、25文字）

**レスポンス**: `TermDepositResponse`

**ステータスコード**:

- `200`: 成功
- その他: エラー（ErrorResponse）

## データモデル

### Account（口座情報）

```typescript
interface Account {
  accountId: string; // 12文字、口座情報を特定する情報
  branchNo: string; // 3文字、サービス指定口座の店番
  branchName: string; // 1-30文字、店名
  accountTypeCode: string; // 2文字、科目コード
  accountTypeDetailCode: string; // 5文字、預金種類、貯蓄フラグ、口座商品詳細コードを連結
  accountTypeName: string; // 1-32文字、科目名（例: 当座、普通）
  accountNo: string; // 7文字、サービス指定口座の口座番号
  accountName: string; // 0-50文字、円流動性口座の口座名義（漢字）
  balance: number; // 残高（整数、int64）
  withdrawableAmount: number; // 引出可能額（整数、int64）
  // その他のフィールド（外貨、投資信託など）
}
```

### Transaction（取引明細）

```typescript
interface Transaction {
  settlementDate: string; // YYYY-MM-DD形式、取引日（勘定日）
  valueDate: string; // YYYY-MM-DD形式、取引指定日（起算日）
  transactionId: string; // 1-5文字、異動明細番号
  transactionType: string; // 1-12文字、取引区分（例: カード）
  remarks: string; // 1-15文字、摘要内容
  debitCreditTypeCode: string; // 1文字、入払区分コード（'1'など）
  amount: number; // 入出金金額（整数、int64）
  balance: number; // 差引残高（整数、int64）
  memo?: string; // 1-7文字、メモ（Eco通帳契約者のみ）
}
```

### TransactionResponse（取引明細レスポンス）

```typescript
interface TransactionResponse {
  nextFlag: string; // 1文字、次明細有フラグ
  nextKeyword?: string; // 23文字、次明細取得キーワード
  number: number; // 明細取得件数
  transactionDateFrom: string; // YYYY-MM-DD形式、返却した先頭明細の取引日
  transactionDateTo: string; // YYYY-MM-DD形式、返却した最終明細の取引日
  transactionIdFirst: string; // 1-5文字、異動明細番号(1明細目)
  transactionIdLast: string; // 1-5文字、異動明細番号(最終明細)
  operationDate: string; // YYYY-MM-DD形式、操作日
  operationTime: string; // HH:mm:ss形式、操作時刻
  accountInfo: AccountInfo; // 口座情報
  transactions: Transaction[]; // 入出金明細配列
}
```

### ErrorResponse（エラーレスポンス）

```typescript
interface ErrorResponse {
  status: number; // ステータスコード（100-999）
  message: string; // ステータスコードに紐づくメッセージ
  code?: string; // エラーコード
  developer_message?: string; // 開発者向けの詳細メッセージ
  httpCode?: string; // HTTPステータスコード
  httpMessage?: string; // HTTPステータスコードの文字列
  moreInformation?: string; // 開発者向けの詳細メッセージ
  error?: string; // エラーの種別を表す文字列
  error_description?: string; // 開発者向けの詳細メッセージ
}
```

## 実装時の注意事項

### 1. シーケンス番号（X-BTMU-Seq-No）の生成

- 25文字の固定長
- リクエストごとに一意の値を生成する必要がある
- 推奨: タイムスタンプ + ランダム文字列の組み合わせ

### 2. 認証情報の管理

- `X-IBM-Client-Id`は環境変数から取得
- 実際のAPIキーは開発者ポータルで取得

### 3. 口座ID（account_id）の取得

- 口座情報照会API（`GET /`）で取得した`Account.accountId`を使用
- 12文字の固定長

### 4. 日付形式

- すべて`YYYY-MM-DD`形式（例: `2016-07-15`）
- 取引明細照会の`inquiryDateFrom`と`inquiryDateTo`は必須

### 5. ページネーション

- `nextKeyword`を使用して次明細を取得可能
- `nextFlag`が`'1'`の場合、`nextKeyword`を使用して続きを取得

### 6. エラーハンドリング

- HTTPステータスコードに加えて、`ErrorResponse`の`status`フィールドも確認
- `developer_message`に詳細なエラー情報が含まれる場合がある

## 環境変数

以下の環境変数を設定してください：

```env
# 三菱UFJ銀行API設定
MUFG_API_BASE_URL=https://developer.api.bk.mufg.jp/btmu/retail/trial/v2/me/accounts
MUFG_API_CLIENT_ID=your-client-id-here
MUFG_API_TIMEOUT_MS=30000
```

## 参考資料

- [API開発者ポータル](https://developer.portal.bk.mufg.jp/)
- [Developer's Guide](https://developer.portal.bk.mufg.jp/btmu/openapitrial/product/retail/trial_v1)
- [OpenAPI仕様書](口座_v2-1.1.1.yaml)
