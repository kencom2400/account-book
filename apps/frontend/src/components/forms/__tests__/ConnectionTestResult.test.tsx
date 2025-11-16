/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionTestResult } from '../ConnectionTestResult';
import {
  BankConnectionTestResult,
  BankAccountType,
} from '@account-book/types';

describe('ConnectionTestResult', () => {
  const mockOnRetry = jest.fn();
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success state', () => {
    const successResult: BankConnectionTestResult = {
      success: true,
      message: '接続に成功しました',
      accountInfo: {
        bankName: 'テスト銀行',
        branchName: 'テスト支店',
        accountNumber: '1234567',
        accountHolder: 'テスト　タロウ',
        accountType: BankAccountType.ORDINARY,
        balance: 1000000,
        availableBalance: 1000000,
      },
    };

    it('should render success message', () => {
      render(<ConnectionTestResult result={successResult} />);

      const successMessages = screen.getAllByText('接続に成功しました');
      expect(successMessages.length).toBeGreaterThan(0);
    });

    it('should display account information', () => {
      render(<ConnectionTestResult result={successResult} />);

      expect(screen.getByText('取得した口座情報')).toBeInTheDocument();
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
      expect(screen.getByText('テスト支店')).toBeInTheDocument();
      expect(screen.getByText('1234567')).toBeInTheDocument();
      // 全角スペースと半角スペースの違いを考慮
      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('タロウ');
      expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
    });

    it('should render continue button when onContinue is provided', () => {
      render(
        <ConnectionTestResult
          result={successResult}
          onContinue={mockOnContinue}
        />,
      );

      const continueButton = screen.getByText('この銀行を登録する');
      expect(continueButton).toBeInTheDocument();
    });

    it('should call onContinue when continue button is clicked', () => {
      render(
        <ConnectionTestResult
          result={successResult}
          onContinue={mockOnContinue}
        />,
      );

      const continueButton = screen.getByText('この銀行を登録する');
      fireEvent.click(continueButton);

      expect(mockOnContinue).toHaveBeenCalled();
    });

    it('should not render continue button when onContinue is not provided', () => {
      render(<ConnectionTestResult result={successResult} />);

      expect(
        screen.queryByText('この銀行を登録する'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Failure state', () => {
    const failureResult: BankConnectionTestResult = {
      success: false,
      message: '認証情報が不正です',
      errorCode: 'BE001',
    };

    it('should render failure message', () => {
      render(<ConnectionTestResult result={failureResult} />);

      expect(screen.getByText('接続に失敗しました')).toBeInTheDocument();
      expect(screen.getByText('認証情報が不正です')).toBeInTheDocument();
    });

    it('should display error code', () => {
      render(<ConnectionTestResult result={failureResult} />);

      expect(screen.getByText(/エラーコード: BE001/)).toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      render(
        <ConnectionTestResult
          result={failureResult}
          onRetry={mockOnRetry}
        />,
      );

      const retryButton = screen.getByText('再試行');
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      render(
        <ConnectionTestResult
          result={failureResult}
          onRetry={mockOnRetry}
        />,
      );

      const retryButton = screen.getByText('再試行');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should display appropriate solution for BE001', () => {
      render(<ConnectionTestResult result={failureResult} />);

      expect(
        screen.getByText(/銀行コード、支店コード、口座番号を確認してください/),
      ).toBeInTheDocument();
    });

    it('should display appropriate solution for BE002', () => {
      const timeoutResult: BankConnectionTestResult = {
        success: false,
        message: '接続がタイムアウトしました',
        errorCode: 'BE002',
      };

      render(<ConnectionTestResult result={timeoutResult} />);

      expect(
        screen.getByText(/インターネット接続を確認してください/),
      ).toBeInTheDocument();
    });

    it('should display appropriate solution for BE003', () => {
      const bankApiErrorResult: BankConnectionTestResult = {
        success: false,
        message: '銀行のシステムエラーが発生しました',
        errorCode: 'BE003',
      };

      render(<ConnectionTestResult result={bankApiErrorResult} />);

      expect(
        screen.getByText(/銀行のメンテナンス情報を確認してください/),
      ).toBeInTheDocument();
    });

    it('should display appropriate solution for BE004', () => {
      const unsupportedBankResult: BankConnectionTestResult = {
        success: false,
        message: '対応していない銀行です',
        errorCode: 'BE004',
      };

      render(<ConnectionTestResult result={unsupportedBankResult} />);

      expect(
        screen.getByText(/対応銀行一覧をご確認ください/),
      ).toBeInTheDocument();
    });

    it('should display appropriate solution for BE005', () => {
      const rateLimitResult: BankConnectionTestResult = {
        success: false,
        message: 'APIのレート制限を超過しました',
        errorCode: 'BE005',
      };

      render(<ConnectionTestResult result={rateLimitResult} />);

      expect(
        screen.getByText(/時間をおいてから再度お試しください/),
      ).toBeInTheDocument();
    });

    it('should display generic solution when error code is not recognized', () => {
      const unknownErrorResult: BankConnectionTestResult = {
        success: false,
        message: '不明なエラーが発生しました',
      };

      render(<ConnectionTestResult result={unknownErrorResult} />);

      expect(
        screen.getByText(/しばらく待ってから再度お試しください/),
      ).toBeInTheDocument();
    });
  });

  describe('Account info formatting', () => {
    it('should format balance with commas', () => {
      const result: BankConnectionTestResult = {
        success: true,
        message: '接続に成功しました',
        accountInfo: {
          bankName: 'テスト銀行',
          branchName: 'テスト支店',
          accountNumber: '1234567',
          accountHolder: 'テスト　タロウ',
          accountType: BankAccountType.ORDINARY,
          balance: 1234567,
          availableBalance: 1234567,
        },
      };

      render(<ConnectionTestResult result={result} />);

      expect(screen.getByText('¥1,234,567')).toBeInTheDocument();
    });
  });

  describe('Optional handlers', () => {
    const successResult: BankConnectionTestResult = {
      success: true,
      message: '接続に成功しました',
    };

    const failureResult: BankConnectionTestResult = {
      success: false,
      message: '認証情報が不正です',
      errorCode: 'BE001',
    };

    it('should not crash when handlers are not provided', () => {
      expect(() => {
        render(<ConnectionTestResult result={successResult} />);
      }).not.toThrow();

      expect(() => {
        render(<ConnectionTestResult result={failureResult} />);
      }).not.toThrow();
    });
  });
});

