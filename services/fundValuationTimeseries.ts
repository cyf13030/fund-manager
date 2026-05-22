import type { FundIntradayPoint } from '../types';

export interface FundValuationSeriesPoint {
  date: string;
  time: string;
  estimatedNav: number;
}

export type FundValuationStore = Record<string, FundValuationSeriesPoint[]>;

const STORAGE_KEY = 'fundManager.fundValuationTimeseries';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidPoint = (value: unknown): value is FundValuationSeriesPoint => {
  if (!isRecord(value)) return false;
  return (
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.time === 'string' &&
    /^\d{2}:\d{2}$/.test(value.time) &&
    typeof value.estimatedNav === 'number' &&
    Number.isFinite(value.estimatedNav) &&
    value.estimatedNav > 0
  );
};

const readStore = (): FundValuationStore => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([code, points]) => [
          code,
          Array.isArray(points) ? points.filter(isValidPoint).sort(comparePoints) : [],
        ])
        .filter(([, points]) => (points as FundValuationSeriesPoint[]).length > 0),
    );
  } catch {
    return {};
  }
};

const writeStore = (store: FundValuationStore): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // 存储空间不足时忽略，不影响主刷新流程。
  }
};

const comparePoints = (a: FundValuationSeriesPoint, b: FundValuationSeriesPoint) =>
  a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

const normalizeSeries = (series: FundIntradayPoint[], date: string): FundValuationSeriesPoint[] => {
  const byTime = new Map<string, FundValuationSeriesPoint>();
  series.forEach((point) => {
    if (!/^\d{2}:\d{2}$/.test(point.time)) return;
    if (!Number.isFinite(point.estimatedNav) || point.estimatedNav <= 0) return;
    byTime.set(point.time, {
      date,
      time: point.time,
      estimatedNav: Number(point.estimatedNav.toFixed(6)),
    });
  });
  return Array.from(byTime.values()).sort(comparePoints);
};

/**
 * 保存某只基金当天的盘中估值序列。新交易日会自动清理旧日数据。
 */
export const recordFundValuationSeries = (
  code: string,
  series: FundIntradayPoint[] | undefined,
  date: string,
): FundValuationSeriesPoint[] => {
  if (!code || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !series?.length) {
    return getFundValuationSeries(code);
  }

  const normalized = normalizeSeries(series, date);
  if (normalized.length === 0) return getFundValuationSeries(code);

  const store = readStore();
  const existing = store[code] ?? [];
  const latestExistingDate = existing.reduce((latest, point) => (point.date > latest ? point.date : latest), '');

  const base = date > latestExistingDate ? [] : existing.filter((point) => point.date === date);
  const byTime = new Map<string, FundValuationSeriesPoint>();
  base.forEach((point) => byTime.set(point.time, point));
  normalized.forEach((point) => byTime.set(point.time, point));

  const next = Array.from(byTime.values()).sort(comparePoints);
  store[code] = next;
  writeStore(store);
  return next;
};

export const getFundValuationSeries = (code: string): FundValuationSeriesPoint[] => {
  if (!code) return [];
  return readStore()[code] ?? [];
};

export const getAllFundValuationSeries = (): FundValuationStore => readStore();

export const replaceAllFundValuationSeries = (store: FundValuationStore): void => {
  writeStore(store);
};

export const mergeFundValuationSeries = (store: FundValuationStore): void => {
  const current = readStore();
  const next: FundValuationStore = { ...current };

  Object.entries(store).forEach(([code, points]) => {
    const byKey = new Map<string, FundValuationSeriesPoint>();
    (next[code] ?? []).forEach((point) => byKey.set(`${point.date} ${point.time}`, point));
    points.forEach((point) => byKey.set(`${point.date} ${point.time}`, point));
    next[code] = Array.from(byKey.values()).filter(isValidPoint).sort(comparePoints);
  });

  writeStore(next);
};

export const clearFundValuationSeries = (code?: string): void => {
  if (!code) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const store = readStore();
  if (!(code in store)) return;
  delete store[code];
  writeStore(store);
};
