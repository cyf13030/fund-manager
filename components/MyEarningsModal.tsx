import React, { useEffect, useMemo, useState } from 'react';
import { ModalShell } from './ModalShell';
import { Icons } from './Icon';
import { formatPct, formatSignedCurrency, getSignColor } from '../services/financeUtils';
import {
  aggregatePortfolioDailyEarnings,
  getAllFundDailyEarnings,
  type FundDailyEarningsPoint,
} from '../services/fundDailyEarnings';
import type { Fund } from '../types';

const addDays = (dateStr: string, delta: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

interface MyEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  funds?: Fund[] | null;
}

interface FundDailyEarningsRow extends FundDailyEarningsPoint {
  code: string;
  name: string;
}

export const MyEarningsModal: React.FC<MyEarningsModalProps> = ({ isOpen, onClose, funds }) => {
  const [dailyEarningsStore, setDailyEarningsStore] = useState(() => getAllFundDailyEarnings());
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const syncLocalStore = () => setDailyEarningsStore(getAllFundDailyEarnings());
    syncLocalStore();
    const intervalId = window.setInterval(syncLocalStore, 10000);
    window.addEventListener('focus', syncLocalStore);
    window.addEventListener('storage', syncLocalStore);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncLocalStore);
      window.removeEventListener('storage', syncLocalStore);
    };
  }, [isOpen]);

  const portfolioDailyEarnings = useMemo(
    () => aggregatePortfolioDailyEarnings(dailyEarningsStore).sort((a, b) => b.date.localeCompare(a.date)),
    [dailyEarningsStore],
  );

  const availableDates = useMemo(
    () => portfolioDailyEarnings.map((item) => item.date),
    [portfolioDailyEarnings],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (availableDates.length === 0) {
      setSelectedDate('');
      return;
    }
    if (!selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, isOpen, selectedDate]);

  const selectedSummary = portfolioDailyEarnings.find((item) => item.date === selectedDate) ?? null;
  const selectedHasData = selectedSummary !== null;

  const selectedFundRows = useMemo<FundDailyEarningsRow[]>(() => {
    if (!selectedDate) return [];
    const fundNameMap = new Map((funds ?? []).map((fund) => [fund.code, fund.name]));
    return Object.entries(dailyEarningsStore)
      .flatMap(([code, points]) =>
        points
          .filter((point) => point.date === selectedDate)
          .map((point) => ({
            code,
            name: fundNameMap.get(code) ?? code,
            ...point,
          })),
      )
      .sort((a, b) => b.earnings - a.earnings);
  }, [dailyEarningsStore, funds, selectedDate]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      overlayId="my-earnings-modal"
      className="w-full max-w-2xl overflow-hidden rounded-t-2xl border border-[var(--app-shell-line)] shadow-2xl sm:rounded-xl"
    >
      <div className="flex items-center justify-between border-b border-[var(--app-shell-line)] px-5 py-4 dark:border-border-dark">
        <div>
          <h2 className="text-base font-bold text-[var(--app-shell-ink)]">我的收益</h2>
          <p className="mt-0.5 text-xs text-[var(--app-shell-muted)]">按日期查看当天赚了多少</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[var(--app-shell-muted)] transition-colors hover:bg-[var(--app-shell-panel-strong)] hover:text-[var(--app-shell-ink)]"
          aria-label="关闭"
        >
          <Icons.X size={18} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {availableDates.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-[var(--app-shell-muted)]">日期</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-full border border-[var(--app-shell-line)] bg-[var(--app-shell-panel-strong)] px-3 py-2 text-sm text-[var(--app-shell-ink)] outline-none transition-colors focus:border-[var(--app-shell-line-strong)]"
              />
              <button
                type="button"
                onClick={() => setSelectedDate((current) => (current ? addDays(current, -1) : current))}
                className="rounded-full border border-[var(--app-shell-line)] bg-[var(--app-shell-panel)] px-3 py-1.5 text-xs font-medium text-[var(--app-shell-muted)] transition-colors hover:text-[var(--app-shell-ink)]"
              >
                上一天
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate((current) => (current ? addDays(current, 1) : current))}
                className="rounded-full border border-[var(--app-shell-line)] bg-[var(--app-shell-panel)] px-3 py-1.5 text-xs font-medium text-[var(--app-shell-muted)] transition-colors hover:text-[var(--app-shell-ink)]"
              >
                下一天
              </button>
              {availableDates.length > 0 && (
                <select
                  value={availableDates.includes(selectedDate) ? selectedDate : ''}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-full border border-[var(--app-shell-line)] bg-[var(--app-shell-panel-strong)] px-3 py-2 text-xs text-[var(--app-shell-ink)] outline-none transition-colors focus:border-[var(--app-shell-line-strong)]"
                >
                  <option value="">有记录日期</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid gap-3 rounded-2xl border border-[var(--app-shell-line)] bg-[var(--app-shell-panel-strong)]/70 p-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-[var(--app-shell-muted)]">当日收益</div>
                <div className={`mt-1 text-2xl font-bold ${getSignColor(selectedSummary?.earnings ?? 0)}`}>
                  {selectedHasData ? formatSignedCurrency(selectedSummary.earnings) : '--'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--app-shell-muted)]">当日收益率</div>
                <div className={`mt-1 text-2xl font-bold ${getSignColor(selectedSummary?.rate ?? 0)}`}>
                  {!selectedHasData || selectedSummary?.rate == null ? '--' : formatPct(selectedSummary.rate)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--app-shell-line)] bg-[var(--app-shell-panel)]">
              <div className="flex items-center justify-between border-b border-[var(--app-shell-line)] px-4 py-3 text-sm font-medium text-[var(--app-shell-ink)]">
                <span>基金明细</span>
                <span className="text-xs text-[var(--app-shell-muted)]">
                  {selectedFundRows.length > 0 ? `${selectedFundRows.length} 只` : '暂无'}
                </span>
              </div>
              {selectedFundRows.length > 0 ? (
                <div className="divide-y divide-[var(--app-shell-line)]">
                  {selectedFundRows.map((row) => (
                    <div key={`${row.code}-${row.date}`} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[var(--app-shell-ink)]">{row.name}</div>
                        <div className="text-xs text-[var(--app-shell-muted)]">{row.code}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-sans font-semibold ${getSignColor(row.earnings)}`}>
                          {formatSignedCurrency(row.earnings)}
                        </div>
                        <div className={`text-xs ${getSignColor(row.rate ?? 0)}`}>
                          {row.rate == null ? '--' : formatPct(row.rate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-xs text-[var(--app-shell-muted)]">
                  该日期暂无收益记录。
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-[var(--app-shell-line)] bg-[var(--app-shell-panel-strong)]/70 px-4 py-10 text-center text-sm text-[var(--app-shell-muted)]">
            暂无收益记录，先刷新一次持仓后再来看。
          </div>
        )}
      </div>
    </ModalShell>
  );
};
