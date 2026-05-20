/// <reference types="vitest/globals" />
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyEarningsModal } from '../MyEarningsModal';
import { recordFundDailyEarnings } from '../../services/fundDailyEarnings';
import type { Fund } from '../../types';

vi.mock('../ModalShell', () => ({
  ModalShell: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

describe('MyEarningsModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('按日期展示组合收益并切换到指定日期', () => {
    recordFundDailyEarnings({ code: '000001', date: '2026-05-19', earnings: 100, rate: 1.2 });
    recordFundDailyEarnings({ code: '000002', date: '2026-05-19', earnings: 30, rate: 0.4 });
    recordFundDailyEarnings({ code: '000001', date: '2026-05-20', earnings: 50, rate: 0.6 });

    render(
      <MyEarningsModal
        isOpen
        onClose={vi.fn()}
        funds={[
          { code: '000001', name: '基金A' },
          { code: '000002', name: '基金B' },
        ] as Fund[]}
      />,
    );

    expect(screen.getByRole('heading', { name: '我的收益' })).toBeInTheDocument();
    expect(screen.getByText('2026-05-20')).toBeInTheDocument();
    expect(screen.getByText('基金A')).toBeInTheDocument();
    expect(screen.getAllByText('+50.00').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '2026-05-19' }));

    expect(screen.getByText('2026-05-19')).toBeInTheDocument();
    expect(screen.getByText('基金B')).toBeInTheDocument();
    expect(screen.getByText('+130.00')).toBeInTheDocument();
  });
});
