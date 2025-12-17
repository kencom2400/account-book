/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ConnectionTestResult } from '../ConnectionTestResult';
import { BankConnectionTestResult } from '@account-book/types';

describe('ConnectionTestResult', () => {
  const mockOnRetry = jest.fn();
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('成功時', () => {
    const successResult: BankConnectionTestResult = {
      success: true,
      message: '接続に成功しました',
      accountInfo: {
        bankName: 'テスト銀行',
        branchName: 'テスト支店',
        accountNumber: '1234567',
        accountHolder: 'テスト太郎',
        balance: 1000000,
      },
    };

    it('should render success message', () => {
      render(<ConnectionTestResult result={successResult} />);
      const messages = screen.getAllByText('接続に成功しました');
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should display account info when provided', () => {
      render(<ConnectionTestResult result={successResult} />);
      expect(screen.getByText('取得した口座情報')).toBeInTheDocument();
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
      expect(screen.getByText('テスト支店')).toBeInTheDocument();
      expect(screen.getByText('1234567')).toBeInTheDocument();
      expect(screen.getByText('テスト太郎')).toBeInTheDocument();
      expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
    });

    it('should not display account info when not provided', () => {
      const resultWithoutAccountInfo: BankConnectionTestResult = {
        success: true,
        message: '接続に成功しました',
      };
      render(<ConnectionTestResult result={resultWithoutAccountInfo} />);
      expect(screen.queryByText('取得した口座情報')).not.toBeInTheDocument();
    });

    it('should call onContinue when continue button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConnectionTestResult
          result={successResult}
          onContinue={mockOnContinue}
          onRetry={mockOnRetry}
        />
      );
      const continueButton = screen.getByRole('button', { name: 'この銀行を登録する' });
      await user.click(continueButton);
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).not.toHaveBeenCalled();
    });

    it('should not show continue button when onContinue is not provided', () => {
      render(<ConnectionTestResult result={successResult} />);
      expect(screen.queryByRole('button', { name: 'この銀行を登録する' })).not.toBeInTheDocument();
    });
  });

  describe('失敗時', () => {
    const failureResult: BankConnectionTestResult = {
      success: false,
      message: '接続に失敗しました',
      errorCode: 'BE001',
    };

    it('should render failure message', () => {
      render(<ConnectionTestResult result={failureResult} />);
      const messages = screen.getAllByText('接続に失敗しました');
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should display error code when provided', () => {
      render(<ConnectionTestResult result={failureResult} />);
      expect(screen.getByText(/エラーコード: BE001/)).toBeInTheDocument();
    });

    it('should not display error code when not provided', () => {
      const resultWithoutErrorCode: BankConnectionTestResult = {
        success: false,
        message: '接続に失敗しました',
      };
      render(<ConnectionTestResult result={resultWithoutErrorCode} />);
      expect(screen.queryByText(/エラーコード:/)).not.toBeInTheDocument();
    });

    it('should display troubleshooting guide for BE001', () => {
      render(<ConnectionTestResult result={failureResult} />);
      expect(screen.getByText('対処方法')).toBeInTheDocument();
      expect(
        screen.getByText(/銀行コード、支店コード、口座番号を確認してください/)
      ).toBeInTheDocument();
    });

    it('should display troubleshooting guide for BE002', () => {
      const be002Result: BankConnectionTestResult = {
        success: false,
        message: '接続に失敗しました',
        errorCode: 'BE002',
      };
      render(<ConnectionTestResult result={be002Result} />);
      expect(screen.getByText(/インターネット接続を確認してください/)).toBeInTheDocument();
    });

    it('should display troubleshooting guide for BE003', () => {
      const be003Result: BankConnectionTestResult = {
        success: false,
        message: '接続に失敗しました',
        errorCode: 'BE003',
      };
      render(<ConnectionTestResult result={be003Result} />);
      expect(screen.getByText(/銀行のメンテナンス情報を確認してください/)).toBeInTheDocument();
    });

    it('should display troubleshooting guide for BE004', () => {
      const be004Result: BankConnectionTestResult = {
        success: false,
        message: '接続に失敗しました',
        errorCode: 'BE004',
      };
      render(<ConnectionTestResult result={be004Result} />);
      expect(screen.getByText(/対応銀行一覧をご確認ください/)).toBeInTheDocument();
    });

    it('should display troubleshooting guide for BE005', () => {
      const be005Result: BankConnectionTestResult = {
        success: false,
        message: '接続に失敗しました',
        errorCode: 'BE005',
      };
      render(<ConnectionTestResult result={be005Result} />);
      expect(screen.getByText(/時間をおいてから再度お試しください/)).toBeInTheDocument();
    });

    it('should display default troubleshooting guide when error code is not provided', () => {
      const resultWithoutErrorCode: BankConnectionTestResult = {
        success: false,
        message: '接続に失敗しました',
      };
      render(<ConnectionTestResult result={resultWithoutErrorCode} />);
      expect(screen.getByText(/しばらく待ってから再度お試しください/)).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConnectionTestResult
          result={failureResult}
          onRetry={mockOnRetry}
          onContinue={mockOnContinue}
        />
      );
      const retryButton = screen.getByRole('button', { name: '再試行' });
      await user.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockOnContinue).not.toHaveBeenCalled();
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<ConnectionTestResult result={failureResult} />);
      expect(screen.queryByRole('button', { name: '再試行' })).not.toBeInTheDocument();
    });
  });
});
