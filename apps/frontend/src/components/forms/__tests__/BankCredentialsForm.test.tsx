/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BankCredentialsForm } from '../BankCredentialsForm';
import { Bank, BankCategory } from '@account-book/types';

const mockBank: Bank = {
  id: 'bank_test',
  code: '0000',
  name: 'テスト銀行',
  category: BankCategory.ONLINE_BANK,
  isSupported: true,
};

describe('BankCredentialsForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with all fields', () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('銀行コード')).toBeInTheDocument();
    expect(screen.getByText('支店コード')).toBeInTheDocument();
    expect(screen.getByText('口座番号')).toBeInTheDocument();
    expect(screen.getByText(/APIキー/)).toBeInTheDocument();
    expect(screen.getByText(/APIシークレット/)).toBeInTheDocument();
  });

  it('should display selected bank name', () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('テスト銀行')).toBeInTheDocument();
  });

  it('should pre-fill bank code', () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    // 銀行コードは入力フィールドの値として自動入力されている
    const bankCodeInput = screen.getByDisplayValue('0000') as HTMLInputElement;
    expect(bankCodeInput).toBeInTheDocument();
    expect(bankCodeInput.value).toBe('0000');
  });

  it('should validate branch code format', async () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

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
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

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
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001');
    const accountNumberInput = screen.getByPlaceholderText('例: 1234567');
    const submitButton = screen.getByText('接続テスト');

    fireEvent.change(branchCodeInput, { target: { value: '001' } });
    fireEvent.change(accountNumberInput, { target: { value: '1234567' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: '',
        apiSecret: '',
      });
    });
  });

  it('should include optional API credentials', async () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

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
        branchCode: '001',
        accountNumber: '1234567',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      });
    });
  });

  it('should toggle API secret visibility', () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    const apiSecretInput = screen.getByPlaceholderText(
      '銀行から発行されたAPIシークレットを入力'
    ) as HTMLInputElement;
    const toggleButton = screen.getByText('表示');

    expect(apiSecretInput.type).toBe('password');

    fireEvent.click(toggleButton);

    expect(apiSecretInput.type).toBe('text');
    expect(screen.getByText('非表示')).toBeInTheDocument();
  });

  it('should clear error when user starts typing', async () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

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
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    const branchCodeInput = screen.getByPlaceholderText('例: 001') as HTMLInputElement;
    const accountNumberInput = screen.getByPlaceholderText('例: 1234567') as HTMLInputElement;

    expect(branchCodeInput.maxLength).toBe(3);
    expect(accountNumberInput.maxLength).toBe(7);
  });

  it('should show loading state when loading prop is true', () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} loading={true} />);

    // ボタンのテキストを部分一致で検索（spanの中に含まれているため）
    const submitButton = screen.getByRole('button', { name: /接続テスト中/ });
    expect(submitButton).toBeDisabled();
  });

  it('should display security notice', () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('セキュリティに関する注意')).toBeInTheDocument();
    expect(
      screen.getByText(/入力された認証情報は暗号化されて安全に保存されます/)
    ).toBeInTheDocument();
  });

  it('should display help text for each field', () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('4桁の数字（自動入力済み）')).toBeInTheDocument();
    expect(screen.getByText('3桁の数字で入力してください')).toBeInTheDocument();
    expect(screen.getByText('7桁の数字で入力してください')).toBeInTheDocument();
  });

  it('should validate all required fields', async () => {
    render(<BankCredentialsForm bank={mockBank} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByText('接続テスト');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('支店コードは3桁の数字で入力してください')).toBeInTheDocument();
      expect(screen.getByText('口座番号は7桁の数字で入力してください')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
