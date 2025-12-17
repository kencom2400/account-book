/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AlertList } from '../AlertList';
import type { AlertListItem } from '@/lib/api/alerts';
import { AlertStatus, AlertLevel, AlertType } from '@/lib/api/alerts';

const mockAlerts: AlertListItem[] = [
  {
    id: 'alert-1',
    type: AlertType.PAYMENT_DELAY,
    level: AlertLevel.WARNING,
    title: '支払い遅延の可能性',
    status: AlertStatus.UNREAD,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'alert-2',
    type: AlertType.AMOUNT_MISMATCH,
    level: AlertLevel.ERROR,
    title: '金額不一致',
    status: AlertStatus.READ,
    createdAt: '2024-01-16T10:00:00Z',
  },
];

describe('AlertList', () => {
  const mockOnAlertClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty message when alerts is empty', () => {
    render(<AlertList alerts={[]} />);
    expect(screen.getByText('アラートはありません')).toBeInTheDocument();
  });

  it('should render alerts list', () => {
    render(<AlertList alerts={mockAlerts} />);
    expect(screen.getByText('支払い遅延の可能性')).toBeInTheDocument();
    expect(screen.getByText('金額不一致')).toBeInTheDocument();
  });

  it('should render alert links with correct href', () => {
    render(<AlertList alerts={mockAlerts} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/alerts/alert-1');
    expect(links[1]).toHaveAttribute('href', '/alerts/alert-2');
  });

  it('should call onAlertClick when alert is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertList alerts={mockAlerts} onAlertClick={mockOnAlertClick} />);
    const links = screen.getAllByRole('link');
    await user.click(links[0]);
    expect(mockOnAlertClick).toHaveBeenCalledTimes(1);
    expect(mockOnAlertClick).toHaveBeenCalledWith(mockAlerts[0]);
  });

  it('should display unread indicator for unread alerts', () => {
    render(<AlertList alerts={mockAlerts} />);
    // unread indicator is a span with blue dot
    const unreadIndicators = screen.getAllByRole('generic').filter((el) => {
      return el.className.includes('bg-blue-600') && el.className.includes('rounded-full');
    });
    expect(unreadIndicators.length).toBeGreaterThan(0);
  });

  it('should not display unread indicator for read alerts', () => {
    const readOnlyAlerts: AlertListItem[] = [
      {
        id: 'alert-2',
        type: AlertType.AMOUNT_MISMATCH,
        level: AlertLevel.ERROR,
        title: '金額不一致',
        status: AlertStatus.READ,
        createdAt: '2024-01-16T10:00:00Z',
      },
    ];
    render(<AlertList alerts={readOnlyAlerts} />);
    const unreadIndicators = screen.queryAllByRole('generic').filter((el) => {
      return el.className.includes('bg-blue-600') && el.className.includes('rounded-full');
    });
    expect(unreadIndicators.length).toBe(0);
  });
});
