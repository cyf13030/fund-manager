export interface FundDailyEarningsPoint {
  date: string;
  earnings: number;
  rate: number | null;
  baseCostAmount: number | null;
}

export type FundDailyEarningsStore = Record<string, FundDailyEarningsPoint[]>;

const STORAGE_KEY = 'fundManager.fundDailyEarnings';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const roundMoney = (value: number) => Number(value.toFixed(2));

const roundRate = (value: number) => Number(value.toFixed(4));

const isValidPoint = (value: unknown): value is FundDailyEarningsPoint => {
  if (!isRecord(value)) return false;
  const rate = value.rate;
  const baseCostAmount = value.baseCostAmount;
  return (
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.earnings === 'number' &&
    Number.isFinite(value.earnings) &&
    (rate === null || (typeof rate === 'number' && Number.isFinite(rate))) &&
    (baseCostAmount === null ||
      (typeof baseCostAmount === 'number' && Number.isFinite(baseCostAmount) && baseCostAmount > 0))
  );
};

const comparePoints = (a: FundDailyEarningsPoint, b: FundDailyEarningsPoint) =>
  a.date.localeCompare(b.date);

const readStore = (): FundDailyEarningsStore => {
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
        .filter(([, points]) => (points as FundDailyEarningsPoint[]).length > 0),
    );
  } catch {
    return {};
  }
};

const writeStore = (store: FundDailyEarningsStore): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // 存储失败不影响主刷新流程。
  }
};

const sanitizeStore = (store: FundDailyEarningsStore): FundDailyEarningsStore => {
  return Object.fromEntries(
    Object.entries(store)
      .map(([code, points]) => [code, points.filter(isValidPoint).sort(comparePoints)] as const)
      .filter(([, points]) => points.length > 0),
  );
};

export const recordFundDailyEarnings = (params: {
  code: string;
  date: string;
  earnings: number;
  rate?: number | null;
  baseCostAmount?: number | null;
}): FundDailyEarningsPoint[] => {
  const { code, date, earnings, rate = null, baseCostAmount = null } = params;
  if (!code || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(earnings)) {
    return getFundDailyEarnings(code);
  }

  const point: FundDailyEarningsPoint = {
    date,
    earnings: roundMoney(earnings),
    rate: typeof rate === 'number' && Number.isFinite(rate) ? roundRate(rate) : null,
    baseCostAmount:
      typeof baseCostAmount === 'number' && Number.isFinite(baseCostAmount) && baseCostAmount > 0
        ? roundMoney(baseCostAmount)
        : null,
  };

  const store = readStore();
  const existing = store[code] ?? [];
  const withoutSameDate = existing.filter((item) => item.date !== date);
  store[code] = [...withoutSameDate, point].sort(comparePoints);
  writeStore(store);
  return store[code];
};

export const getFundDailyEarnings = (code: string): FundDailyEarningsPoint[] => {
  if (!code) return [];
  return readStore()[code] ?? [];
};

export const getAllFundDailyEarnings = (): FundDailyEarningsStore => readStore();

export const replaceAllFundDailyEarnings = (store: FundDailyEarningsStore): void => {
  writeStore(sanitizeStore(store));
};

export const mergeFundDailyEarnings = (incoming: FundDailyEarningsStore): void => {
  const store = readStore();
  Object.entries(sanitizeStore(incoming)).forEach(([code, points]) => {
    const byDate = new Map((store[code] ?? []).map((point) => [point.date, point]));
    points.forEach((point) => {
      byDate.set(point.date, point);
    });
    store[code] = Array.from(byDate.values()).sort(comparePoints);
  });
  writeStore(store);
};

export const aggregatePortfolioDailyEarnings = (
  store: FundDailyEarningsStore = readStore(),
): FundDailyEarningsPoint[] => {
  const byDate = new Map<string, { earnings: number; baseCostAmount: number }>();

  Object.values(store).forEach((points) => {
    points.forEach((point) => {
      const current = byDate.get(point.date) ?? { earnings: 0, baseCostAmount: 0 };
      current.earnings += point.earnings;
      current.baseCostAmount += point.baseCostAmount ?? 0;
      byDate.set(point.date, current);
    });
  });

  return Array.from(byDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, item]) => ({
      date,
      earnings: roundMoney(item.earnings),
      rate: item.baseCostAmount > 0 ? roundRate((item.earnings / item.baseCostAmount) * 100) : null,
      baseCostAmount: item.baseCostAmount > 0 ? roundMoney(item.baseCostAmount) : null,
    }));
};

export const clearFundDailyEarnings = (code?: string): void => {
  if (!code) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const store = readStore();
  if (!(code in store)) return;
  delete store[code];
  writeStore(store);
};
