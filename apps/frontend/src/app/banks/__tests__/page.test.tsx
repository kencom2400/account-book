/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BanksPage from '../page';
import * as institutionsApi from '@/lib/api/institutions';
import { useRouter } from 'next/navigation';

// モック
jest.mock('@/lib/api/institutions');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('BanksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    (institutionsApi.getInstitutions as jest.Mock).mockResolvedValue([]);
  });

  it('InstitutionListコンポーネントをレンダリングする', async () => {
    render(<BanksPage />);

    await waitFor(() => {
      expect(screen.getByText('金融機関設定')).toBeInTheDocument();
    });
  });
});
