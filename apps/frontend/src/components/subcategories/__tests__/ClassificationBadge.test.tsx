import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClassificationBadge } from '../ClassificationBadge';
import { ClassificationReason } from '@account-book/types';

describe('ClassificationBadge', () => {
  describe('信頼度別の色表示', () => {
    it('90%以上の信頼度で緑色（高信頼度）が表示される', () => {
      render(
        <ClassificationBadge confidence={0.95} reason={ClassificationReason.MERCHANT_MATCH} />
      );

      const badge = screen.getByText('95%').closest('div');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
      expect(screen.getByText('(高信頼度)')).toBeInTheDocument();
    });

    it('70-90%の信頼度で黄色（中信頼度）が表示される', () => {
      render(<ClassificationBadge confidence={0.85} reason={ClassificationReason.KEYWORD_MATCH} />);

      const badge = screen.getByText('85%').closest('div');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(screen.getByText('(中信頼度)')).toBeInTheDocument();
    });

    it('50-70%の信頼度でオレンジ色（低信頼度）が表示される', () => {
      render(
        <ClassificationBadge confidence={0.65} reason={ClassificationReason.AMOUNT_INFERENCE} />
      );

      const badge = screen.getByText('65%').closest('div');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
      expect(screen.getByText('(低信頼度)')).toBeInTheDocument();
    });

    it('50%未満の信頼度でグレー（デフォルト）が表示される', () => {
      render(<ClassificationBadge confidence={0.45} reason={ClassificationReason.DEFAULT} />);

      const badge = screen.getByText('45%').closest('div');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
      expect(screen.getByText('(デフォルト)')).toBeInTheDocument();
    });
  });

  describe('分類理由の表示', () => {
    it('店舗マスタ一致の場合、店舗名が表示される', () => {
      render(
        <ClassificationBadge
          confidence={0.95}
          reason={ClassificationReason.MERCHANT_MATCH}
          merchantName="スターバックス"
        />
      );

      const badge = screen.getByText('95%').closest('div');
      expect(badge).toHaveAttribute('title', '店舗マスタ一致: スターバックス');
    });

    it('店舗マスタ一致の場合、店舗名がない場合はデフォルトテキストが表示される', () => {
      render(
        <ClassificationBadge confidence={0.95} reason={ClassificationReason.MERCHANT_MATCH} />
      );

      const badge = screen.getByText('95%').closest('div');
      expect(badge).toHaveAttribute('title', '店舗マスタ一致');
    });

    it('キーワード一致の場合、正しいテキストが表示される', () => {
      render(<ClassificationBadge confidence={0.85} reason={ClassificationReason.KEYWORD_MATCH} />);

      const badge = screen.getByText('85%').closest('div');
      expect(badge).toHaveAttribute('title', 'キーワード一致');
    });

    it('金額推測の場合、正しいテキストが表示される', () => {
      render(
        <ClassificationBadge confidence={0.65} reason={ClassificationReason.AMOUNT_INFERENCE} />
      );

      const badge = screen.getByText('65%').closest('div');
      expect(badge).toHaveAttribute('title', '金額推測');
    });

    it('定期性判定の場合、正しいテキストが表示される', () => {
      render(
        <ClassificationBadge confidence={0.75} reason={ClassificationReason.RECURRING_PATTERN} />
      );

      const badge = screen.getByText('75%').closest('div');
      expect(badge).toHaveAttribute('title', '定期性判定');
    });

    it('デフォルトの場合、正しいテキストが表示される', () => {
      render(<ClassificationBadge confidence={0.45} reason={ClassificationReason.DEFAULT} />);

      const badge = screen.getByText('45%').closest('div');
      expect(badge).toHaveAttribute('title', 'デフォルト');
    });
  });

  describe('信頼度パーセンテージの表示', () => {
    it('信頼度が正しくパーセンテージで表示される', () => {
      render(
        <ClassificationBadge confidence={0.9234} reason={ClassificationReason.MERCHANT_MATCH} />
      );

      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('信頼度が0.5の場合、50%と表示される', () => {
      render(<ClassificationBadge confidence={0.5} reason={ClassificationReason.DEFAULT} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('信頼度が1.0の場合、100%と表示される', () => {
      render(<ClassificationBadge confidence={1.0} reason={ClassificationReason.MERCHANT_MATCH} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
