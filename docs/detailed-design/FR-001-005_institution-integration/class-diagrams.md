# クラス図

このドキュメントでは、金融機関連携機能のクラス構造を記載しています。

## 目次

1. [Domain層クラス図](#domain層クラス図)
2. [Application層クラス図](#application層クラス図)
3. [Infrastructure層クラス図](#infrastructure層クラス図)
4. [Presentation層クラス図](#presentation層クラス図)
5. [Frontend コンポーネント図](#frontendコンポーネント図)

---

## Domain層クラス図

### Institution Module (FR-001)

```mermaid
classDiagram
    class InstitutionEntity {
        +string id
        +string name
        +InstitutionType type
        +EncryptedCredentials credentials
        +boolean isConnected
        +Date|null lastSyncedAt
        +AccountEntity[] accounts
        +Date createdAt
        +Date updatedAt
        +isBank() boolean
        +isCreditCard() boolean
        +isSecurities() boolean
        +updateConnectionStatus(isConnected) InstitutionEntity
        +updateLastSyncedAt(date) InstitutionEntity
        +updateCredentials(credentials) InstitutionEntity
        +addAccount(account) InstitutionEntity
        +updateAccount(accountId, account) InstitutionEntity
        +removeAccount(accountId) InstitutionEntity
        +toJSON() InstitutionJSONResponse
    }

    note right of InstitutionEntity
        toJSON()の返り値型は
        input-output-design.mdで
        定義されているレスポンスモデル
    end note

    class AccountEntity {
        +string id
        +string accountNumber
        +string accountName
        +string accountType
        +number balance
        +number availableBalance
        +Date createdAt
        +Date updatedAt
        +updateBalance(balance) AccountEntity
        +toJSON() AccountJSONResponse
    }

    class EncryptedCredentials {
        -string encryptedData
        -string iv
        +encrypt(data) EncryptedCredentials
        +decrypt() object
        +toJSON() object
    }

    class InstitutionType {
        <<enumeration>>
        BANK
        CREDIT_CARD
        SECURITIES
    }

    class InstitutionRepositoryInterface {
        <<interface>>
        +save(institution) Promise~InstitutionEntity~
        +findById(id) Promise~InstitutionEntity|null~
        +findAll() Promise~InstitutionEntity[]~
        +update(institution) Promise~InstitutionEntity~
        +delete(id) Promise~void~
    }

    InstitutionEntity --> InstitutionType
    InstitutionEntity --> EncryptedCredentials
    InstitutionEntity "1" *-- "many" AccountEntity
    InstitutionRepositoryInterface ..> InstitutionEntity
```

### Credit Card Module (FR-002)

```mermaid
classDiagram
    class CreditCardEntity {
        +string id
        +string cardName
        +string cardNumber
        +string cardHolderName
        +Date expiryDate
        +EncryptedCredentials credentials
        +boolean isConnected
        +Date|null lastSyncedAt
        +number paymentDay
        +number closingDay
        +number creditLimit
        +number currentBalance
        +string issuer
        +Date createdAt
        +Date updatedAt
        +isExpired() boolean
        +getAvailableCredit() number
        +getUtilizationRate() number
        +updateConnectionStatus(isConnected) CreditCardEntity
        +updateLastSyncedAt(date) CreditCardEntity
        +updateBalance(balance) CreditCardEntity
        +updateCredentials(credentials) CreditCardEntity
        +getType() InstitutionType
        +toJSON() CreditCardJSONResponse
    }

    class CreditCardTransactionEntity {
        +string id
        +string creditCardId
        +Date usageDate
        +string merchantName
        +number amount
        +string status
        +Date paymentDate
        +string category
        +Date createdAt
        +Date updatedAt
        +isSettled() boolean
        +toJSON() CreditCardTransactionJSONResponse
    }

    class PaymentVO {
        +number totalAmount
        +Date paymentDate
        +string bankAccountId
        +string status
        +calculatePending() number
        +isPaid() boolean
    }

    class CreditCardRepositoryInterface {
        <<interface>>
        +save(card) Promise~CreditCardEntity~
        +findById(id) Promise~CreditCardEntity|null~
        +findAll() Promise~CreditCardEntity[]~
        +update(card) Promise~CreditCardEntity~
        +delete(id) Promise~void~
    }

    CreditCardEntity --> EncryptedCredentials
    CreditCardEntity "1" *-- "many" CreditCardTransactionEntity
    CreditCardEntity --> PaymentVO
    CreditCardRepositoryInterface ..> CreditCardEntity
```

### Securities Module (FR-003)

```mermaid
classDiagram
    class SecuritiesAccountEntity {
        +string id
        +string securitiesCompanyName
        +string accountNumber
        +string accountType
        +EncryptedCredentials credentials
        +boolean isConnected
        +Date|null lastSyncedAt
        +number totalEvaluationAmount
        +number cashBalance
        +Date createdAt
        +Date updatedAt
        +getTotalAssets() number
        +updateConnectionStatus(isConnected) SecuritiesAccountEntity
        +updateLastSyncedAt(date) SecuritiesAccountEntity
        +updateCredentials(credentials) SecuritiesAccountEntity
        +updateBalances(evaluation, cash) SecuritiesAccountEntity
        +toJSON(portfolioStats) SecuritiesAccountJSONResponse
    }

    class PortfolioEntity {
        +string id
        +string securitiesAccountId
        +string stockCode
        +string stockName
        +number quantity
        +number acquisitionPrice
        +number currentPrice
        +Date createdAt
        +Date updatedAt
        +getProfitLoss() number
        +getProfitLossRate() number
        +getEvaluationAmount() number
        +toJSON() PortfolioJSONResponse
    }

    class SecuritiesTransactionEntity {
        +string id
        +string securitiesAccountId
        +Date transactionDate
        +string transactionType
        +string stockCode
        +number quantity
        +number unitPrice
        +number amount
        +number commission
        +Date createdAt
        +Date updatedAt
        +toJSON() SecuritiesTransactionJSONResponse
    }

    class SecuritiesAccountRepositoryInterface {
        <<interface>>
        +save(account) Promise~SecuritiesAccountEntity~
        +findById(id) Promise~SecuritiesAccountEntity|null~
        +findAll() Promise~SecuritiesAccountEntity[]~
        +update(account) Promise~SecuritiesAccountEntity~
        +delete(id) Promise~void~
    }

    SecuritiesAccountEntity --> EncryptedCredentials
    SecuritiesAccountEntity "1" *-- "many" PortfolioEntity
    SecuritiesAccountEntity "1" *-- "many" SecuritiesTransactionEntity
    SecuritiesAccountRepositoryInterface ..> SecuritiesAccountEntity
```

### Health Module (FR-004, FR-005)

```mermaid
classDiagram
    class ConnectionHistory {
        +string id
        +string institutionId
        +string institutionName
        +string institutionType
        +ConnectionStatus status
        +Date checkedAt
        +number responseTime
        +string|undefined errorMessage
        +string|undefined errorCode
        +create(params) ConnectionHistory
        +restore(params) ConnectionHistory
        +isConnected() boolean
        +hasError() boolean
        +toJSON() object
    }

    class ConnectionCheckResultVO {
        +string institutionId
        +string institutionName
        +ConnectionStatus status
        +number responseTime
        +Date checkedAt
        +string|undefined errorMessage
        +string|undefined errorCode
        +isSuccess() boolean
        +needsReauth() boolean
        +toJSON() object
    }

    class ConnectionStatus {
        <<enumeration>>
        CONNECTED
        DISCONNECTED
        NEED_REAUTH
        CHECKING
    }

    class ConnectionHistoryRepositoryInterface {
        <<interface>>
        +save(history) Promise~ConnectionHistory~
        +findByInstitutionId(id) Promise~ConnectionHistory[]~
        +findLatest(id) Promise~ConnectionHistory|null~
        +findAll() Promise~ConnectionHistory[]~
    }

    ConnectionHistory --> ConnectionStatus
    ConnectionCheckResultVO --> ConnectionStatus
    ConnectionHistoryRepositoryInterface ..> ConnectionHistory
```

---

## Application層クラス図

### Use Cases (FR-001 ~ FR-005)

```mermaid
classDiagram
    class ConnectInstitutionUseCase {
        -IInstitutionRepository repository
        -IBankApiAdapter bankApi
        -ICryptoService encryption
        +execute(dto) Promise~InstitutionEntity~
    }

    class ConnectCreditCardUseCase {
        -ICreditCardRepository repository
        -ICreditCardApiAdapter cardApi
        -ICryptoService encryption
        +execute(dto) Promise~CreditCardEntity~
    }

    class ConnectSecuritiesAccountUseCase {
        -ISecuritiesAccountRepository repository
        -ISecuritiesApiAdapter securitiesApi
        -ICryptoService encryption
        +execute(dto) Promise~SecuritiesAccountEntity~
    }

    class CheckConnectionStatusUseCase {
        -ConnectionCheckerService checker
        -IConnectionHistoryRepository historyRepo
        +execute(command, institutions) Promise~ConnectionStatusResult[]~
    }

    class ScheduledConnectionCheckUseCase {
        -CheckConnectionStatusUseCase checkUseCase
        -NotificationService notification
        +execute() Promise~void~
    }

    class GetConnectionHistoryUseCase {
        -ConnectionHistoryRepository repository
        +execute(institutionId) Promise~ConnectionHistory[]~
    }

    class InstitutionAggregationService {
        -InstitutionRepository institutionRepo
        -CreditCardRepository creditCardRepo
        -SecuritiesAccountRepository securitiesRepo
        +getAllInstitutions() Promise~AllInstitutions~
    }

    ConnectInstitutionUseCase --> InstitutionRepositoryInterface
    ConnectCreditCardUseCase --> CreditCardRepositoryInterface
    ConnectSecuritiesAccountUseCase --> SecuritiesAccountRepositoryInterface
    CheckConnectionStatusUseCase --> ConnectionHistoryRepositoryInterface
    ScheduledConnectionCheckUseCase --> CheckConnectionStatusUseCase
    GetConnectionHistoryUseCase --> ConnectionHistoryRepositoryInterface
```

---

## Infrastructure層クラス図

### Repository Implementations

```mermaid
classDiagram
    class InstitutionRepository {
        -FileStorageService storage
        +save(institution) Promise~InstitutionEntity~
        +findById(id) Promise~InstitutionEntity|null~
        +findAll() Promise~InstitutionEntity[]~
        +update(institution) Promise~InstitutionEntity~
        +delete(id) Promise~void~
    }

    class CreditCardRepository {
        -FileStorageService storage
        +save(card) Promise~CreditCardEntity~
        +findById(id) Promise~CreditCardEntity|null~
        +findAll() Promise~CreditCardEntity[]~
        +update(card) Promise~CreditCardEntity~
        +delete(id) Promise~void~
    }

    class SecuritiesAccountRepository {
        -FileStorageService storage
        +save(account) Promise~SecuritiesAccountEntity~
        +findById(id) Promise~SecuritiesAccountEntity|null~
        +findAll() Promise~SecuritiesAccountEntity[]~
        +update(account) Promise~SecuritiesAccountEntity~
        +delete(id) Promise~void~
    }

    class ConnectionHistoryRepository {
        -FileStorageService storage
        +save(history) Promise~ConnectionHistory~
        +findByInstitutionId(id) Promise~ConnectionHistory[]~
        +findLatest(id) Promise~ConnectionHistory|null~
        +findAll() Promise~ConnectionHistory[]~
    }

    class FileStorageService {
        -string dataPath
        +read(filename) Promise~object~
        +write(filename, data) Promise~void~
        +exists(filename) Promise~boolean~
    }

    InstitutionRepository ..> InstitutionRepositoryInterface
    CreditCardRepository ..> CreditCardRepositoryInterface
    SecuritiesAccountRepository ..> SecuritiesAccountRepositoryInterface
    ConnectionHistoryRepository ..> ConnectionHistoryRepositoryInterface

    InstitutionRepository --> FileStorageService
    CreditCardRepository --> FileStorageService
    SecuritiesAccountRepository --> FileStorageService
    ConnectionHistoryRepository --> FileStorageService
```

### API Adapters

```mermaid
classDiagram
    class BankApiAdapterInterface {
        <<interface>>
        +testConnection(credentials) Promise~boolean~
        +fetchAccounts(credentials) Promise~Account[]~
    }

    class MockBankApiAdapter {
        +testConnection(credentials) Promise~boolean~
        +fetchAccounts(credentials) Promise~Account[]~
    }

    class CreditCardApiAdapterInterface {
        <<interface>>
        +testConnection(credentials) Promise~boolean~
        +fetchTransactions(credentials, from, to) Promise~Transaction[]~
        +fetchPaymentInfo(credentials) Promise~PaymentInfo~
    }

    class MockCreditCardApiAdapter {
        +testConnection(credentials) Promise~boolean~
        +fetchTransactions(credentials, from, to) Promise~Transaction[]~
        +fetchPaymentInfo(credentials) Promise~PaymentInfo~
    }

    class SecuritiesApiAdapterInterface {
        <<interface>>
        +testConnection(credentials) Promise~boolean~
        +fetchPortfolio(credentials) Promise~Portfolio[]~
        +fetchTransactions(credentials, from, to) Promise~Transaction[]~
    }

    class MockSecuritiesApiAdapter {
        +testConnection(credentials) Promise~boolean~
        +fetchPortfolio(credentials) Promise~Portfolio[]~
        +fetchTransactions(credentials, from, to) Promise~Transaction[]~
    }

    class ConnectionCheckerService {
        -BankApiAdapter bankApi
        -CreditCardApiAdapter cardApi
        -SecuritiesApiAdapter securitiesApi
        +checkInstitution(institution) Promise~ConnectionCheckResultVO~
        +checkCreditCard(card) Promise~ConnectionCheckResultVO~
        +checkSecuritiesAccount(account) Promise~ConnectionCheckResultVO~
    }

    MockBankApiAdapter ..> BankApiAdapterInterface
    MockCreditCardApiAdapter ..> CreditCardApiAdapterInterface
    MockSecuritiesApiAdapter ..> SecuritiesApiAdapterInterface

    ConnectionCheckerService --> BankApiAdapterInterface
    ConnectionCheckerService --> CreditCardApiAdapterInterface
    ConnectionCheckerService --> SecuritiesApiAdapterInterface
```

---

## Presentation層クラス図

### Controllers

```mermaid
classDiagram
    class InstitutionController {
        -ConnectInstitutionUseCase connectUseCase
        -GetInstitutionsUseCase getUseCase
        -UpdateInstitutionUseCase updateUseCase
        -DeleteInstitutionUseCase deleteUseCase
        -TestConnectionUseCase testUseCase
        +connect(dto) Promise~InstitutionResponse~
        +getAll() Promise~InstitutionResponse[]~
        +getById(id) Promise~InstitutionResponse~
        +update(id, dto) Promise~InstitutionResponse~
        +delete(id) Promise~void~
        +testConnection(dto) Promise~TestConnectionResponse~
    }

    class CreditCardController {
        -ConnectCreditCardUseCase connectUseCase
        -GetCreditCardsUseCase getUseCase
        -FetchCreditCardTransactionsUseCase fetchTransactionsUseCase
        -FetchPaymentInfoUseCase fetchPaymentInfoUseCase
        +connect(dto) Promise~CreditCardResponse~
        +getAll() Promise~CreditCardResponse[]~
        +getById(id) Promise~CreditCardResponse~
        +getTransactions(id, query) Promise~TransactionResponse[]~
        +getPaymentInfo(id) Promise~PaymentInfoResponse~
    }

    class SecuritiesController {
        -ConnectSecuritiesAccountUseCase connectUseCase
        -GetSecuritiesAccountsUseCase getUseCase
        -FetchPortfolioUseCase fetchPortfolioUseCase
        +connect(dto) Promise~SecuritiesAccountResponse~
        +getAll() Promise~SecuritiesAccountResponse[]~
        +getById(id) Promise~SecuritiesAccountResponse~
        +getPortfolio(id) Promise~PortfolioResponse[]~
    }

    class HealthController {
        -CheckConnectionStatusUseCase checkUseCase
        -GetConnectionHistoryUseCase getHistoryUseCase
        +checkAllConnections() Promise~ConnectionStatusResponse[]~
        +getHistory(institutionId) Promise~ConnectionHistoryResponse[]~
    }

    InstitutionController --> ConnectInstitutionUseCase
    CreditCardController --> ConnectCreditCardUseCase
    SecuritiesController --> ConnectSecuritiesAccountUseCase
    HealthController --> CheckConnectionStatusUseCase
    HealthController --> GetConnectionHistoryUseCase
```

### DTOs

```mermaid
classDiagram
    class ConnectInstitutionDto {
        +string name
        +string type
        +string bankCode
        +string branchCode
        +string accountNumber
        +string apiKey
    }

    class ConnectCreditCardDto {
        +string cardName
        +string cardNumber
        +string cardHolderName
        +string expiryDate
        +string issuer
        +string loginId
        +string password
        +number paymentDay
        +number closingDay
        +number creditLimit
    }

    class ConnectSecuritiesAccountDto {
        +string securitiesCompanyName
        +string accountNumber
        +string accountType
        +string loginId
        +string password
        +string tradePassword
    }

    class CheckConnectionDto {
        +string[] institutionIds
    }

    class GetConnectionHistoryDto {
        +string institutionId
        +Date from
        +Date to
    }
```

---

## Frontendコンポーネント図

### Component Structure

```mermaid
classDiagram
    class BankSelector {
        +banks Bank[]
        +onSelect(bank) void
        +searchTerm string
        +filterBanks() Bank[]
        +render() JSX.Element
    }

    class BankCredentialsForm {
        +selectedBank Bank
        +onSubmit(credentials) Promise~void~
        +validateForm() boolean
        +handleInputChange(field, value) void
        +render() JSX.Element
    }

    class ConnectionTestResult {
        +status string
        +message string
        +error string|undefined
        +onRetry() void
        +onClose() void
        +render() JSX.Element
    }

    class ErrorModal {
        +isOpen boolean
        +error Error
        +priority string
        +onClose() void
        +onAction(action) void
        +render() JSX.Element
    }

    class ErrorToast {
        +message string
        +type string
        +duration number
        +onClose() void
        +render() JSX.Element
    }

    class MonthlySummaryCard {
        +month string
        +income number
        +expense number
        +balance number
        +render() JSX.Element
    }

    class CategoryBreakdown {
        +categories Category[]
        +onCategoryClick(category) void
        +render() JSX.Element
    }

    class TransactionList {
        +transactions Transaction[]
        +onTransactionClick(transaction) void
        +render() JSX.Element
    }

    BankSelector --> BankCredentialsForm : 選択
    BankCredentialsForm --> ConnectionTestResult : テスト実行
    ConnectionTestResult --> ErrorModal : エラー時
    ErrorModal --> ErrorToast : 通知
```

### Store (State Management)

```mermaid
classDiagram
    class NotificationStore {
        +notifications Notification[]
        +addNotification(notification) void
        +removeNotification(id) void
        +clearAll() void
        +getUnreadCount() number
    }

    class InstitutionStore {
        +institutions Institution[]
        +selectedInstitution Institution|null
        +fetchInstitutions() Promise~void~
        +addInstitution(institution) void
        +updateInstitution(id, data) void
        +deleteInstitution(id) void
        +selectInstitution(id) void
    }

    class TransactionStore {
        +transactions Transaction[]
        +fetchTransactions(filters) Promise~void~
        +addTransaction(transaction) void
        +updateTransaction(id, data) void
        +deleteTransaction(id) void
    }
```

---

## クラス間の関係性

### 依存関係の方向

```mermaid
graph TD
    Presentation[Presentation Layer] --> Application[Application Layer]
    Application --> Domain[Domain Layer]
    Infrastructure[Infrastructure Layer] --> Domain
    Infrastructure --> Application

    Presentation -.-> Infrastructure
```

### モジュール間の関連

```mermaid
graph LR
    Institution[Institution Module] --> Health[Health Module]
    CreditCard[Credit Card Module] --> Health
    Securities[Securities Module] --> Health
    Health --> Notification[Notification Service]
```

---

## まとめ

このクラス図は、金融機関連携機能における全てのクラスとその関係性を示しています。Onion Architectureに基づき、Domain層を中心に各レイヤが適切に分離されており、保守性と拡張性が確保されています。
