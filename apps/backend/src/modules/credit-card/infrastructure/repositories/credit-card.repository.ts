import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { CreditCardTransactionEntity } from '../../domain/entities/credit-card-transaction.entity';
import { PaymentVO } from '../../domain/value-objects/payment.vo';
import {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
  IPaymentRepository,
} from '../../domain/repositories/credit-card.repository.interface';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

/**
 * CreditCard Repository Implementation
 * JSONファイルでの永続化を実装
 */
@Injectable()
export class FileSystemCreditCardRepository implements ICreditCardRepository {
  private readonly dataDir: string;
  private readonly fileName = 'credit-cards.json';

  constructor(private configService: ConfigService) {
    this.dataDir = path.join(process.cwd(), 'data', 'credit-cards');
    this.ensureDataDirectory();
  }

  async save(creditCard: CreditCardEntity): Promise<CreditCardEntity> {
    const cards = await this.loadData();
    const index = cards.findIndex((c) => c.id === creditCard.id);

    if (index >= 0) {
      cards[index] = creditCard;
    } else {
      cards.push(creditCard);
    }

    await this.saveData(cards);
    return creditCard;
  }

  async findById(id: string): Promise<CreditCardEntity | null> {
    const cards = await this.loadData();
    return cards.find((c) => c.id === id) || null;
  }

  async findAll(): Promise<CreditCardEntity[]> {
    return await this.loadData();
  }

  async findConnected(): Promise<CreditCardEntity[]> {
    const cards = await this.loadData();
    return cards.filter((c) => c.isConnected);
  }

  async findByIssuer(issuer: string): Promise<CreditCardEntity[]> {
    const cards = await this.loadData();
    return cards.filter((c) => c.issuer === issuer);
  }

  async delete(id: string): Promise<void> {
    const cards = await this.loadData();
    const filtered = cards.filter((c) => c.id !== id);
    await this.saveData(filtered);
  }

  async exists(id: string): Promise<boolean> {
    const card = await this.findById(id);
    return card !== null;
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private getFilePath(): string {
    return path.join(this.dataDir, this.fileName);
  }

  private async loadData(): Promise<CreditCardEntity[]> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath();

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.map((item: any) => this.deserialize(item));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async saveData(cards: CreditCardEntity[]): Promise<void> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath();
    const data = cards.map((card) => this.serialize(card));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private serialize(card: CreditCardEntity): any {
    return {
      id: card.id,
      cardName: card.cardName,
      cardNumber: card.cardNumber,
      cardHolderName: card.cardHolderName,
      expiryDate: card.expiryDate.toISOString(),
      credentials: card.credentials.toJSON(),
      isConnected: card.isConnected,
      lastSyncedAt: card.lastSyncedAt?.toISOString() || null,
      paymentDay: card.paymentDay,
      closingDay: card.closingDay,
      creditLimit: card.creditLimit,
      currentBalance: card.currentBalance,
      issuer: card.issuer,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }

  private deserialize(data: any): CreditCardEntity {
    return new CreditCardEntity(
      data.id,
      data.cardName,
      data.cardNumber,
      data.cardHolderName,
      new Date(data.expiryDate),
      new EncryptedCredentials(
        data.credentials.encrypted,
        data.credentials.iv,
        data.credentials.authTag,
        data.credentials.algorithm,
        data.credentials.version,
      ),
      data.isConnected,
      data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
      data.paymentDay,
      data.closingDay,
      data.creditLimit,
      data.currentBalance,
      data.issuer,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}

/**
 * CreditCardTransaction Repository Implementation
 * JSONファイルでの永続化を実装
 */
@Injectable()
export class FileSystemCreditCardTransactionRepository
  implements ICreditCardTransactionRepository
{
  private readonly dataDir: string;

  constructor(private configService: ConfigService) {
    this.dataDir = path.join(process.cwd(), 'data', 'credit-cards');
    this.ensureDataDirectory();
  }

  async save(
    transaction: CreditCardTransactionEntity,
  ): Promise<CreditCardTransactionEntity> {
    const transactions = await this.loadData(transaction.creditCardId);
    const index = transactions.findIndex((t) => t.id === transaction.id);

    if (index >= 0) {
      transactions[index] = transaction;
    } else {
      transactions.push(transaction);
    }

    await this.saveData(transaction.creditCardId, transactions);
    return transaction;
  }

  async saveMany(
    transactions: CreditCardTransactionEntity[],
  ): Promise<CreditCardTransactionEntity[]> {
    if (transactions.length === 0) return [];

    const creditCardId = transactions[0].creditCardId;
    const existingTransactions = await this.loadData(creditCardId);

    // 既存の取引をMapに変換し、新しい取引で更新または追加
    const transactionsMap = new Map(existingTransactions.map((t) => [t.id, t]));
    transactions.forEach((t) => transactionsMap.set(t.id, t));

    const allTransactions = Array.from(transactionsMap.values());
    await this.saveData(creditCardId, allTransactions);

    return transactions;
  }

  async findById(id: string): Promise<CreditCardTransactionEntity | null> {
    // 全カードの取引を検索（効率が悪いが、IDから直接検索するため）
    const cards = await this.getAllCreditCardIds();

    for (const cardId of cards) {
      const transactions = await this.loadData(cardId);
      const found = transactions.find((t) => t.id === id);
      if (found) return found;
    }

    return null;
  }

  async findByCreditCardId(
    creditCardId: string,
  ): Promise<CreditCardTransactionEntity[]> {
    return await this.loadData(creditCardId);
  }

  async findByCreditCardIdAndDateRange(
    creditCardId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CreditCardTransactionEntity[]> {
    const transactions = await this.loadData(creditCardId);
    return transactions.filter(
      (t) => t.transactionDate >= startDate && t.transactionDate <= endDate,
    );
  }

  async findUnpaid(
    creditCardId: string,
  ): Promise<CreditCardTransactionEntity[]> {
    const transactions = await this.loadData(creditCardId);
    return transactions.filter((t) => !t.isPaid);
  }

  async findByMonth(
    creditCardId: string,
    year: number,
    month: number,
  ): Promise<CreditCardTransactionEntity[]> {
    const transactions = await this.loadData(creditCardId);
    return transactions.filter((t) => {
      const txDate = t.transactionDate;
      return txDate.getFullYear() === year && txDate.getMonth() + 1 === month;
    });
  }

  async delete(id: string): Promise<void> {
    const cards = await this.getAllCreditCardIds();

    for (const cardId of cards) {
      const transactions = await this.loadData(cardId);
      const filtered = transactions.filter((t) => t.id !== id);

      if (filtered.length !== transactions.length) {
        await this.saveData(cardId, filtered);
        return;
      }
    }
  }

  async exists(id: string): Promise<boolean> {
    const transaction = await this.findById(id);
    return transaction !== null;
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private getFilePath(creditCardId: string): string {
    return path.join(this.dataDir, `${creditCardId}_transactions.json`);
  }

  private async getAllCreditCardIds(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      return files
        .filter((f) => f.endsWith('_transactions.json'))
        .map((f) => f.replace('_transactions.json', ''));
    } catch {
      return [];
    }
  }

  private async loadData(
    creditCardId: string,
  ): Promise<CreditCardTransactionEntity[]> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath(creditCardId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.map((item: any) => this.deserializeTransaction(item));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async saveData(
    creditCardId: string,
    transactions: CreditCardTransactionEntity[],
  ): Promise<void> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath(creditCardId);
    const data = transactions.map((tx) => this.serializeTransaction(tx));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private serializeTransaction(tx: CreditCardTransactionEntity): any {
    return {
      id: tx.id,
      creditCardId: tx.creditCardId,
      transactionDate: tx.transactionDate.toISOString(),
      postingDate: tx.postingDate.toISOString(),
      amount: tx.amount,
      merchantName: tx.merchantName,
      merchantCategory: tx.merchantCategory,
      description: tx.description,
      category: tx.category,
      isInstallment: tx.isInstallment,
      installmentCount: tx.installmentCount,
      installmentNumber: tx.installmentNumber,
      isPaid: tx.isPaid,
      paymentScheduledDate: tx.paymentScheduledDate?.toISOString() || null,
      paidDate: tx.paidDate?.toISOString() || null,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    };
  }

  private deserializeTransaction(data: any): CreditCardTransactionEntity {
    return new CreditCardTransactionEntity(
      data.id,
      data.creditCardId,
      new Date(data.transactionDate),
      new Date(data.postingDate),
      data.amount,
      data.merchantName,
      data.merchantCategory,
      data.description,
      data.category,
      data.isInstallment,
      data.installmentCount,
      data.installmentNumber,
      data.isPaid,
      data.paymentScheduledDate ? new Date(data.paymentScheduledDate) : null,
      data.paidDate ? new Date(data.paidDate) : null,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}

/**
 * Payment Repository Implementation
 * JSONファイルでの永続化を実装
 */
@Injectable()
export class FileSystemPaymentRepository implements IPaymentRepository {
  private readonly dataDir: string;

  constructor(private configService: ConfigService) {
    this.dataDir = path.join(process.cwd(), 'data', 'credit-cards');
    this.ensureDataDirectory();
  }

  async save(creditCardId: string, payment: PaymentVO): Promise<PaymentVO> {
    const payments = await this.loadData(creditCardId);
    const index = payments.findIndex(
      (p) => p.billingMonth === payment.billingMonth,
    );

    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.push(payment);
    }

    await this.saveData(creditCardId, payments);
    return payment;
  }

  async findByCreditCardIdAndMonth(
    creditCardId: string,
    billingMonth: string,
  ): Promise<PaymentVO | null> {
    const payments = await this.loadData(creditCardId);
    return payments.find((p) => p.billingMonth === billingMonth) || null;
  }

  async findByCreditCardId(creditCardId: string): Promise<PaymentVO[]> {
    return await this.loadData(creditCardId);
  }

  async findUnpaid(creditCardId: string): Promise<PaymentVO[]> {
    const payments = await this.loadData(creditCardId);
    return payments.filter((p) => !p.isPaid());
  }

  async findOverdue(creditCardId: string): Promise<PaymentVO[]> {
    const payments = await this.loadData(creditCardId);
    return payments.filter((p) => p.isOverdue());
  }

  async delete(creditCardId: string, billingMonth: string): Promise<void> {
    const payments = await this.loadData(creditCardId);
    const filtered = payments.filter((p) => p.billingMonth !== billingMonth);
    await this.saveData(creditCardId, filtered);
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private getFilePath(creditCardId: string): string {
    return path.join(this.dataDir, `${creditCardId}_payments.json`);
  }

  private async loadData(creditCardId: string): Promise<PaymentVO[]> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath(creditCardId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.map((item: any) => this.deserializePayment(item));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async saveData(
    creditCardId: string,
    payments: PaymentVO[],
  ): Promise<void> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath(creditCardId);
    const data = payments.map((p) => this.serializePayment(p));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private serializePayment(payment: PaymentVO): any {
    return {
      billingMonth: payment.billingMonth,
      closingDate: payment.closingDate.toISOString(),
      paymentDueDate: payment.paymentDueDate.toISOString(),
      totalAmount: payment.totalAmount,
      paidAmount: payment.paidAmount,
      remainingAmount: payment.remainingAmount,
      status: payment.status,
    };
  }

  private deserializePayment(data: any): PaymentVO {
    return new PaymentVO(
      data.billingMonth,
      new Date(data.closingDate),
      new Date(data.paymentDueDate),
      data.totalAmount,
      data.paidAmount,
      data.remainingAmount,
      data.status,
    );
  }
}
