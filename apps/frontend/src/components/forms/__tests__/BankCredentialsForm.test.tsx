/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BankCredentialsForm } from '../BankCredentialsForm';
import { Bank, BankCategory, AuthenticationType } from '@account-book/types';

const mockBankBranchAccount: Bank = {
  id: 'bank_test',
  code: '0000',
  name: 'テスト銀行',
  category: BankCategory.ONLINE_BANK,
  isSupported: true,
  authenticationType: AuthenticationType.BRANCH_ACCOUNT,
};

const mockBankUserIdPassword: Bank = {
  id: 'bank_test_userid',
  code: '0005',
  name: 'テスト銀行（ユーザID認証）',
  category: BankCategory.MEGA_BANK,
  isSupported: true,
  authenticationType: AuthenticationType.USERID_PASSWORD,
};

describe('BankCredentialsForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with all fields for BRANCH_ACCOUNT', () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('銀行コード')).toBeInTheDocument();
    expect(screen.getByText('支店コード')).toBeInTheDocument();
    expect(screen.getByText('口座番号')).toBeInTheDocument();
    expect(screen.getByText(/APIキー/)).toBeInTheDocument();
    expect(screen.getByText(/APIシークレット/)).toBeInTheDocument();
  });

  it('should display selected bank name', () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('テスト銀行')).toBeInTheDocument();
  });

  it('should pre-fill bank code', () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    // 銀行コードは入力フィールドの値として自動入力されている
    const bankCodeInput = screen.getByDisplayValue('0000');
    expect(bankCodeInput).toBeInTheDocument();
    expect(bankCodeInput).toHaveValue('0000');
  });

  it('should validate branch code format', async () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001');
    const submitButton = screen.getByText('接続テスト');

    // 無効な値を入力
    fireEvent.change(branchCodeInput, { target: { value: 'ab' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('支店コードは3桁の数字で入力してください')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate account number format', async () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001');
    const accountNumberInput = screen.getByPlaceholderText('例: 1234567');
    const submitButton = screen.getByText('接続テスト');

    fireEvent.change(branchCodeInput, { target: { value: '001' } });
    fireEvent.change(accountNumberInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('口座番号は7桁の数字で入力してください')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit with valid data', async () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001');
    const accountNumberInput = screen.getByPlaceholderText('例: 1234567');
    const submitButton = screen.getByText('接続テスト');

    fireEvent.change(branchCodeInput, { target: { value: '001' } });
    fireEvent.change(accountNumberInput, { target: { value: '1234567' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        bankCode: '0000',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: '',
        apiSecret: '',
        userId: '',
        password: '',
      });
    });
  });

  it('should include optional API credentials', async () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001');
    const accountNumberInput = screen.getByPlaceholderText('例: 1234567');
    const apiKeyInput = screen.getByPlaceholderText('銀行から発行されたAPIキーを入力');
    const apiSecretInput = screen.getByPlaceholderText('銀行から発行されたAPIシークレットを入力');
    const submitButton = screen.getByText('接続テスト');

    fireEvent.change(branchCodeInput, { target: { value: '001' } });
    fireEvent.change(accountNumberInput, { target: { value: '1234567' } });
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    fireEvent.change(apiSecretInput, {
      target: { value: 'test-api-secret' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        bankCode: '0000',
        authenticationType: AuthenticationType.BRANCH_ACCOUNT,
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
        userId: '',
        password: '',
      });
    });
  });

  it('should toggle API secret visibility', () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const apiSecretInput = screen.getByPlaceholderText('銀行から発行されたAPIシークレットを入力');
    const toggleButton = screen.getByText('表示');

    expect(apiSecretInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);

    expect(apiSecretInput).toHaveAttribute('type', 'text');
    expect(screen.getByText('非表示')).toBeInTheDocument();
  });

  it('should clear error when user starts typing', async () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001');
    const submitButton = screen.getByText('接続テスト');

    // エラーを表示
    fireEvent.change(branchCodeInput, { target: { value: 'ab' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('支店コードは3桁の数字で入力してください')).toBeInTheDocument();
    });

    // 正しい値を入力
    fireEvent.change(branchCodeInput, { target: { value: '001' } });

    await waitFor(() => {
      expect(screen.queryByText('支店コードは3桁の数字で入力してください')).not.toBeInTheDocument();
    });
  });

  it('should enforce maxLength on inputs', () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001');
    const accountNumberInput = screen.getByPlaceholderText('例: 1234567');

    expect(branchCodeInput).toHaveAttribute('maxLength', '3');
    expect(accountNumberInput).toHaveAttribute('maxLength', '7');
  });

  it('should show loading state when loading prop is true', () => {
    render(
      <BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} loading={true} />
    );

    // ボタンのテキストを部分一致で検索（spanの中に含まれているため）
    const submitButton = screen.getByRole('button', { name: /接続テスト中/ });
    expect(submitButton).toBeDisabled();
  });

  it('should display security notice', () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('セキュリティに関する注意')).toBeInTheDocument();
    expect(
      screen.getByText(/入力された認証情報は暗号化されて安全に保存されます/)
    ).toBeInTheDocument();
  });

  it('should display help text for each field', () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('4桁の数字（自動入力済み）')).toBeInTheDocument();
    expect(screen.getByText('3桁の数字で入力してください')).toBeInTheDocument();
    expect(screen.getByText('7桁の数字で入力してください')).toBeInTheDocument();
  });

  it('should validate all required fields', async () => {
    render(<BankCredentialsForm bank={mockBankBranchAccount} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByText('接続テスト');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('支店コードは3桁の数字で入力してください')).toBeInTheDocument();
      expect(screen.getByText('口座番号は7桁の数字で入力してください')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // USERID_PASSWORD認証のテストケース
  describe('USERID_PASSWORD authentication', () => {
    it('should render User ID and Password fields for USERID_PASSWORD authenticationType', () => {
      render(<BankCredentialsForm bank={mockBankUserIdPassword} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('ユーザID')).toBeInTheDocument();
      expect(screen.getByText('パスワード')).toBeInTheDocument();
      expect(screen.queryByText('支店コード')).not.toBeInTheDocument();
      expect(screen.queryByText('口座番号')).not.toBeInTheDocument();
    });

    it('should validate userId format for USERID_PASSWORD authenticationType', async () => {
      render(<BankCredentialsForm bank={mockBankUserIdPassword} onSubmit={mockOnSubmit} />);

      const userIdInput = screen.getByPlaceholderText('例: user123');
      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const submitButton = screen.getByText('接続テスト');

      // 空のユーザID
      fireEvent.change(userIdInput, { target: { value: '' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ユーザIDは1-100文字で入力してください')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();

      // 長すぎるユーザID
      fireEvent.change(userIdInput, { target: { value: 'a'.repeat(101) } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ユーザIDは1-100文字で入力してください')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate password format for USERID_PASSWORD authenticationType', async () => {
      render(<BankCredentialsForm bank={mockBankUserIdPassword} onSubmit={mockOnSubmit} />);

      const userIdInput = screen.getByPlaceholderText('例: user123');
      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const submitButton = screen.getByText('接続テスト');

      fireEvent.change(userIdInput, { target: { value: 'testuser' } });
      // 短すぎるパスワード
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('パスワードは8-100文字で入力してください')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();

      // 長すぎるパスワード
      fireEvent.change(passwordInput, { target: { value: 'a'.repeat(101) } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('パスワードは8-100文字で入力してください')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit with valid userId and password for USERID_PASSWORD authenticationType', async () => {
      render(<BankCredentialsForm bank={mockBankUserIdPassword} onSubmit={mockOnSubmit} />);

      const userIdInput = screen.getByPlaceholderText('例: user123');
      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const submitButton = screen.getByText('接続テスト');

      fireEvent.change(userIdInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'securepassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          bankCode: '0005',
          authenticationType: AuthenticationType.USERID_PASSWORD,
          userId: 'testuser',
          password: 'securepassword123',
          branchCode: '',
          accountNumber: '',
          apiKey: '',
          apiSecret: '',
        });
      });
    });

    it('should toggle password visibility for USERID_PASSWORD authenticationType', () => {
      render(<BankCredentialsForm bank={mockBankUserIdPassword} onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByPlaceholderText('パスワードを入力');
      const toggleButton = screen.getByText('表示');

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByText('非表示')).toBeInTheDocument();
    });

    it('should display help text for USERID_PASSWORD fields', () => {
      render(<BankCredentialsForm bank={mockBankUserIdPassword} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('1-100文字で入力してください')).toBeInTheDocument();
      expect(screen.getByText('8-100文字で入力してください')).toBeInTheDocument();
    });

    it('should validate all required fields for USERID_PASSWORD', async () => {
      render(<BankCredentialsForm bank={mockBankUserIdPassword} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByText('接続テスト');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ユーザIDは1-100文字で入力してください')).toBeInTheDocument();
        expect(screen.getByText('パスワードは8-100文字で入力してください')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
