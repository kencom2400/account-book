import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorModal } from '@/components/ui';

describe('ErrorModal', () => {
  const mockOnClose = jest.fn();
  const mockOnRetry = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reactのact警告を抑制（意図的なテストケースのため）
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      // act警告のみ抑制、その他のエラーは表示
      if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
        return;
      }
      // 他のエラーは console.warn にリダイレクトして表示
      console.warn(...args);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it('isOpenがfalseの場合は何も表示されない', () => {
    const { container } = render(
      <ErrorModal isOpen={false} onClose={mockOnClose} type="error" message="テストエラー" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('isOpenがtrueの場合にモーダルが表示される', () => {
    render(
      <ErrorModal
        isOpen={true}
        onClose={mockOnClose}
        type="error"
        message="テストエラーメッセージ"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
  });

  it('エラータイプに応じて正しいタイトルが表示される', () => {
    const { rerender } = render(
      <ErrorModal isOpen={true} onClose={mockOnClose} type="warning" message="警告メッセージ" />
    );

    expect(screen.getByRole('heading', { name: '警告' })).toBeInTheDocument();

    rerender(
      <ErrorModal isOpen={true} onClose={mockOnClose} type="error" message="エラーメッセージ" />
    );

    expect(screen.getByRole('heading', { name: 'エラー' })).toBeInTheDocument();

    rerender(
      <ErrorModal isOpen={true} onClose={mockOnClose} type="critical" message="重大メッセージ" />
    );

    expect(screen.getByRole('heading', { name: '重大なエラー' })).toBeInTheDocument();
  });

  it('詳細情報が表示される（文字列形式）', () => {
    render(
      <ErrorModal
        isOpen={true}
        onClose={mockOnClose}
        type="error"
        message="エラー"
        details="詳細なエラー情報"
      />
    );

    expect(screen.getByText('詳細情報')).toBeInTheDocument();
    expect(screen.getByText('詳細なエラー情報')).toBeInTheDocument();
  });

  it('詳細情報が表示される（配列形式）', () => {
    const details = [
      { field: 'name', message: '名前は必須です' },
      { field: 'email', message: 'メールアドレスの形式が不正です' },
    ];

    render(
      <ErrorModal
        isOpen={true}
        onClose={mockOnClose}
        type="error"
        message="バリデーションエラー"
        details={details}
      />
    );

    expect(screen.getByText('詳細情報')).toBeInTheDocument();
    // フィールド名とメッセージが別々の要素で表示されるため、それぞれ確認
    expect(screen.getByText(/name/)).toBeInTheDocument();
    expect(screen.getByText('名前は必須です')).toBeInTheDocument();
    expect(screen.getByText(/email/)).toBeInTheDocument();
    expect(screen.getByText('メールアドレスの形式が不正です')).toBeInTheDocument();
  });

  it('配列形式の詳細情報でフィールド名がない場合でも表示される', () => {
    const details = [{ message: '一般的なエラーメッセージ' }];

    render(
      <ErrorModal
        isOpen={true}
        onClose={mockOnClose}
        type="error"
        message="エラー"
        details={details}
      />
    );

    expect(screen.getByText('詳細情報')).toBeInTheDocument();
    expect(screen.getByText('一般的なエラーメッセージ')).toBeInTheDocument();
  });

  it('金融機関IDとタイムスタンプが表示される', () => {
    const timestamp = new Date('2024-01-01T12:00:00');
    render(
      <ErrorModal
        isOpen={true}
        onClose={mockOnClose}
        type="error"
        message="エラー"
        institutionId="0001"
        timestamp={timestamp}
      />
    );

    expect(screen.getByText(/金融機関ID: 0001/)).toBeInTheDocument();
    expect(screen.getByText(/発生時刻:/)).toBeInTheDocument();
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
    const user = userEvent.setup();

    render(<ErrorModal isOpen={true} onClose={mockOnClose} type="error" message="エラー" />);

    const closeButtons = screen.getAllByRole('button', { name: '閉じる' });
    // モーダル内の「閉じる」ボタンをクリック（最後のボタンがモーダル内のボタン）
    await user.click(closeButtons[closeButtons.length - 1]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('リトライボタンが表示されonRetryが呼ばれる', async () => {
    const user = userEvent.setup();

    render(
      <ErrorModal
        isOpen={true}
        onClose={mockOnClose}
        type="error"
        message="エラー"
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: '再試行' });
    await user.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('onRetryがない場合はリトライボタンが表示されない', () => {
    render(<ErrorModal isOpen={true} onClose={mockOnClose} type="error" message="エラー" />);

    expect(screen.queryByRole('button', { name: '再試行' })).not.toBeInTheDocument();
  });
});
