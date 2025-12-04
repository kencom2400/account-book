import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';
import type {
  ISecuritiesAccountRepository,
  IHoldingRepository,
  ISecurityTransactionRepository,
} from '../../domain/repositories/securities.repository.interface';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

const DATA_DIR = path.join(process.cwd(), 'data', 'securities');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const HOLDINGS_FILE = path.join(DATA_DIR, 'holdings.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

interface AccountData {
  id: string;
  securitiesCompanyName: string;
  accountNumber: string;
  accountType: string;
  credentials: {
    encrypted: string;
    iv: string;
    authTag: string;
    algorithm: string;
    version: string;
  };
  isConnected: boolean;
  lastSyncedAt: string | null;
  totalEvaluationAmount: number;
  cashBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface HoldingData {
  id: string;
  securitiesAccountId: string;
  securityCode: string;
  securityName: string;
  quantity: number;
  averageAcquisitionPrice: number;
  currentPrice: number;
  securityType: string;
  market: string;
  updatedAt: string;
}

interface TransactionData {
  id: string;
  securitiesAccountId: string;
  securityCode: string;
  securityName: string;
  transactionDate: string;
  transactionType: string;
  quantity: number;
  price: number;
  fee: number;
  status: string;
  createdAt: string;
}

/**
 * FileSystemSecuritiesAccountRepository
 * 証券口座リポジトリのファイルシステム実装
 */
@Injectable()
export class FileSystemSecuritiesAccountRepository
  implements ISecuritiesAccountRepository
{
  private readonly logger = new Logger(
    FileSystemSecuritiesAccountRepository.name,
  );

  async create(account: SecuritiesAccountEntity): Promise<void> {
    await this.ensureDataDirectory();
    const accounts = await this.loadAccounts();
    accounts.push(this.toData(account));
    await this.saveAccounts(accounts);
    this.logger.log(`Created securities account: ${account.id}`);
  }

  async findById(id: string): Promise<SecuritiesAccountEntity | null> {
    const accounts = await this.loadAccounts();
    const accountData = accounts.find((a) => a.id === id);
    return accountData ? this.toEntity(accountData) : null;
  }

  async findAll(): Promise<SecuritiesAccountEntity[]> {
    const accounts = await this.loadAccounts();
    return accounts.map((a) => this.toEntity(a));
  }

  async update(account: SecuritiesAccountEntity): Promise<void> {
    const accounts = await this.loadAccounts();
    const index = accounts.findIndex((a) => a.id === account.id);
    if (index === -1) {
      throw new Error(`Account not found: ${account.id}`);
    }
    accounts[index] = this.toData(account);
    await this.saveAccounts(accounts);
    this.logger.log(`Updated securities account: ${account.id}`);
  }

  async delete(id: string): Promise<void> {
    const accounts = await this.loadAccounts();
    const filtered = accounts.filter((a) => a.id !== id);
    await this.saveAccounts(filtered);
    this.logger.log(`Deleted securities account: ${id}`);
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch {
      // ディレクトリが既に存在する場合は無視
    }
  }

  private async loadAccounts(): Promise<AccountData[]> {
    try {
      const data = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
      return JSON.parse(data) as AccountData[];
    } catch {
      return [];
    }
  }

  private async saveAccounts(accounts: AccountData[]): Promise<void> {
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  }

  private toData(entity: SecuritiesAccountEntity): AccountData {
    return {
      id: entity.id,
      securitiesCompanyName: entity.securitiesCompanyName,
      accountNumber: entity.accountNumber,
      accountType: entity.accountType,
      credentials: entity.credentials.toJSON(),
      isConnected: entity.isConnected,
      lastSyncedAt: entity.lastSyncedAt?.toISOString() || null,
      totalEvaluationAmount: entity.totalEvaluationAmount,
      cashBalance: entity.cashBalance,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toEntity(data: AccountData): SecuritiesAccountEntity {
    return new SecuritiesAccountEntity(
      data.id,
      data.securitiesCompanyName,
      data.accountNumber,
      data.accountType as
        | 'general'
        | 'specific'
        | 'nisa'
        | 'tsumitate-nisa'
        | 'isa',
      new EncryptedCredentials(
        data.credentials.encrypted,
        data.credentials.iv,
        data.credentials.authTag,
        data.credentials.algorithm,
        data.credentials.version,
      ),
      data.isConnected,
      data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
      data.totalEvaluationAmount,
      data.cashBalance,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}

/**
 * FileSystemHoldingRepository
 * 保有銘柄リポジトリのファイルシステム実装
 */
@Injectable()
export class FileSystemHoldingRepository implements IHoldingRepository {
  private readonly logger = new Logger(FileSystemHoldingRepository.name);

  async create(holding: HoldingEntity): Promise<void> {
    await this.ensureDataDirectory();
    const holdings = await this.loadHoldings();
    holdings.push(this.toData(holding));
    await this.saveHoldings(holdings);
    this.logger.log(`Created holding: ${holding.id}`);
  }

  async findById(id: string): Promise<HoldingEntity | null> {
    const holdings = await this.loadHoldings();
    const holdingData = holdings.find((h) => h.id === id);
    return holdingData ? this.toEntity(holdingData) : null;
  }

  async findByAccountId(accountId: string): Promise<HoldingEntity[]> {
    const holdings = await this.loadHoldings();
    return holdings
      .filter((h) => h.securitiesAccountId === accountId)
      .map((h) => this.toEntity(h));
  }

  async findByAccountIdAndSecurityCode(
    accountId: string,
    securityCode: string,
  ): Promise<HoldingEntity | null> {
    const holdings = await this.loadHoldings();
    const holdingData = holdings.find(
      (h) =>
        h.securitiesAccountId === accountId && h.securityCode === securityCode,
    );
    return holdingData ? this.toEntity(holdingData) : null;
  }

  async update(holding: HoldingEntity): Promise<void> {
    const holdings = await this.loadHoldings();
    const index = holdings.findIndex((h) => h.id === holding.id);
    if (index === -1) {
      throw new Error(`Holding not found: ${holding.id}`);
    }
    holdings[index] = this.toData(holding);
    await this.saveHoldings(holdings);
    this.logger.log(`Updated holding: ${holding.id}`);
  }

  async delete(id: string): Promise<void> {
    const holdings = await this.loadHoldings();
    const filtered = holdings.filter((h) => h.id !== id);
    await this.saveHoldings(filtered);
    this.logger.log(`Deleted holding: ${id}`);
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch {
      // ディレクトリが既に存在する場合は無視
    }
  }

  private async loadHoldings(): Promise<HoldingData[]> {
    try {
      const data = await fs.readFile(HOLDINGS_FILE, 'utf-8');
      return JSON.parse(data) as HoldingData[];
    } catch {
      return [];
    }
  }

  private async saveHoldings(holdings: HoldingData[]): Promise<void> {
    await fs.writeFile(HOLDINGS_FILE, JSON.stringify(holdings, null, 2));
  }

  private toData(entity: HoldingEntity): HoldingData {
    return {
      id: entity.id,
      securitiesAccountId: entity.securitiesAccountId,
      securityCode: entity.securityCode,
      securityName: entity.securityName,
      quantity: entity.quantity,
      averageAcquisitionPrice: entity.averageAcquisitionPrice,
      currentPrice: entity.currentPrice,
      securityType: entity.securityType,
      market: entity.market,
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toEntity(data: HoldingData): HoldingEntity {
    return new HoldingEntity(
      data.id,
      data.securitiesAccountId,
      data.securityCode,
      data.securityName,
      data.quantity,
      data.averageAcquisitionPrice,
      data.currentPrice,
      data.securityType as 'stock' | 'bond' | 'fund' | 'etf' | 'reit',
      data.market,
      new Date(data.updatedAt),
    );
  }
}

/**
 * FileSystemSecurityTransactionRepository
 * 証券取引リポジトリのファイルシステム実装
 */
@Injectable()
export class FileSystemSecurityTransactionRepository
  implements ISecurityTransactionRepository
{
  private readonly logger = new Logger(
    FileSystemSecurityTransactionRepository.name,
  );

  async create(transaction: SecurityTransactionEntity): Promise<void> {
    await this.ensureDataDirectory();
    const transactions = await this.loadTransactions();
    transactions.push(this.toData(transaction));
    await this.saveTransactions(transactions);
    this.logger.log(`Created transaction: ${transaction.id}`);
  }

  async findById(id: string): Promise<SecurityTransactionEntity | null> {
    const transactions = await this.loadTransactions();
    const txData = transactions.find((t) => t.id === id);
    return txData ? this.toEntity(txData) : null;
  }

  async findByAccountId(
    accountId: string,
  ): Promise<SecurityTransactionEntity[]> {
    const transactions = await this.loadTransactions();
    return transactions
      .filter((t) => t.securitiesAccountId === accountId)
      .map((t) => this.toEntity(t));
  }

  async findByAccountIdAndDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SecurityTransactionEntity[]> {
    const transactions = await this.loadTransactions();
    return transactions
      .filter((t) => {
        const txDate = new Date(t.transactionDate);
        return (
          t.securitiesAccountId === accountId &&
          txDate >= startDate &&
          txDate <= endDate
        );
      })
      .map((t) => this.toEntity(t));
  }

  async update(transaction: SecurityTransactionEntity): Promise<void> {
    const transactions = await this.loadTransactions();
    const index = transactions.findIndex((t) => t.id === transaction.id);
    if (index === -1) {
      throw new Error(`Transaction not found: ${transaction.id}`);
    }
    transactions[index] = this.toData(transaction);
    await this.saveTransactions(transactions);
    this.logger.log(`Updated transaction: ${transaction.id}`);
  }

  async delete(id: string): Promise<void> {
    const transactions = await this.loadTransactions();
    const filtered = transactions.filter((t) => t.id !== id);
    await this.saveTransactions(filtered);
    this.logger.log(`Deleted transaction: ${id}`);
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch {
      // ディレクトリが既に存在する場合は無視
    }
  }

  private async loadTransactions(): Promise<TransactionData[]> {
    try {
      const data = await fs.readFile(TRANSACTIONS_FILE, 'utf-8');
      return JSON.parse(data) as TransactionData[];
    } catch {
      return [];
    }
  }

  private async saveTransactions(
    transactions: TransactionData[],
  ): Promise<void> {
    await fs.writeFile(
      TRANSACTIONS_FILE,
      JSON.stringify(transactions, null, 2),
    );
  }

  private toData(entity: SecurityTransactionEntity): TransactionData {
    return {
      id: entity.id,
      securitiesAccountId: entity.securitiesAccountId,
      securityCode: entity.securityCode,
      securityName: entity.securityName,
      transactionDate: entity.transactionDate.toISOString(),
      transactionType: entity.transactionType,
      quantity: entity.quantity,
      price: entity.price,
      fee: entity.fee,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  private toEntity(data: TransactionData): SecurityTransactionEntity {
    return new SecurityTransactionEntity(
      data.id,
      data.securitiesAccountId,
      data.securityCode,
      data.securityName,
      new Date(data.transactionDate),
      data.transactionType as
        | 'buy'
        | 'sell'
        | 'dividend'
        | 'distribution'
        | 'split'
        | 'other',
      data.quantity,
      data.price,
      data.fee,
      data.status as 'pending' | 'completed' | 'cancelled',
      new Date(data.createdAt),
    );
  }
}
