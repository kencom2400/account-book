import { Inject, Injectable } from '@nestjs/common';
import {
  CreditCardCredentials,
  CreditCardConnectionTestResult,
} from '@account-book/types';
import type { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';
import { CREDIT_CARD_API_CLIENT } from '../../credit-card.tokens';

export interface TestCreditCardConnectionDto {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  username: string;
  password: string;
  issuer: string;
  apiKey?: string;
}

/**
 * クレジットカード接続テストユースケース
 */
@Injectable()
export class TestCreditCardConnectionUseCase {
  constructor(
    @Inject(CREDIT_CARD_API_CLIENT)
    private readonly creditCardApiClient: ICreditCardAPIClient,
  ) {}

  async execute(
    dto: TestCreditCardConnectionDto,
  ): Promise<CreditCardConnectionTestResult> {
    try {
      // DTOをCreditCardCredentialsに変換
      const credentials: CreditCardCredentials = {
        cardNumber: dto.cardNumber,
        cardHolderName: dto.cardHolderName,
        expiryDate: dto.expiryDate,
        username: dto.username,
        password: dto.password,
        apiKey: dto.apiKey,
      };

      // クレジットカードAPIアダプターを使って接続テスト
      const result = await this.creditCardApiClient.testConnection(credentials);

      if (result.success) {
        // 接続成功時はカード情報を取得
        const cardInfo =
          await this.creditCardApiClient.getCardInfo(credentials);

        return {
          success: true,
          message: '接続に成功しました',
          cardInfo: {
            cardName: dto.issuer,
            cardNumber: cardInfo.cardNumber, // 下4桁のみ
            cardHolderName: dto.cardHolderName,
            expiryDate: dto.expiryDate,
            issuer: dto.issuer,
          },
        };
      }

      return {
        success: false,
        message: result.error || '接続テストに失敗しました',
        errorCode: 'CC001',
      };
    } catch (error) {
      // エラーの場合は汎用エラー
      return {
        success: false,
        message: `接続テストに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'CC002',
      };
    }
  }
}
