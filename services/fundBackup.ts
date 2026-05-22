import type { Account, Fund, WatchlistItem, InvestmentPlan } from '../types';
import type { InvestmentProfileSnapshot } from './aiAnalysis';
import type { FundDailyEarningsPoint, FundDailyEarningsStore } from './fundDailyEarnings';
import type { FundValuationSeriesPoint, FundValuationStore } from './fundValuationTimeseries';

export interface FundBackupPayload {
  version: number;
  exportDate: string;
  funds: Fund[];
  accounts?: Account[];
  watchlists?: WatchlistItem[];
  investmentPlans?: InvestmentPlan[];
  investmentProfile?: InvestmentProfileSnapshot;
  /** 可用资产（余额宝类随时可取用资产），undefined 表示未配置 */
  availableAssets?: number;
  /** 单基金每日收益归档，用于跨设备恢复收益回看与 Worker 归因 */
  fundDailyEarnings?: FundDailyEarningsStore;
  /** 单基金盘中估值序列，用于估值误差回测 */
  fundValuationTimeseries?: FundValuationStore;
}

const BACKUP_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const FUND_BACKUP_FIELDS: (keyof Fund)[] = [
  'code',
  'name',
  'platform',
  'holdingShares',
  'costPrice',
  'currentNav',
  'lastUpdate',
  'dayChangePct',
  'dayChangeVal',
  'officialDayChangePct',
  'estimatedDayChangePct',
  'todayChangeIsEstimated',
  'todayChangeUnavailable',
  'todayChangePreOpen',
  'buyDate',
  'buyTime',
  'settlementDays',
  'pendingTransactions',
  'realizedGain',
  'realizedGainCost',
  'positionOpenAmount',
  'positionOpenDate',
  'category',
  'trackingInfo',
  'parentEtfInfo',
  'underlyingMarket',
];

const stripFundId = (fund: Fund): Fund => {
  const cleanFund: Record<string, unknown> = {};
  for (const key of FUND_BACKUP_FIELDS) {
    if (key in fund) {
      cleanFund[key] = fund[key];
    }
  }
  return cleanFund as unknown as Fund;
};

const WATCHLIST_BACKUP_FIELDS: (keyof WatchlistItem)[] = [
  'code',
  'name',
  'type',
  'platform',
  'anchorPrice',
  'anchorDate',
  'currentPrice',
  'dayChangePct',
  'lastUpdate',
  'todayChangeIsEstimated',
  'todayChangeUnavailable',
  'todayChangePreOpen',
  'category',
  'trackingInfo',
  'parentEtfInfo',
  'underlyingMarket',
];

const stripWatchlistId = (item: WatchlistItem): WatchlistItem => {
  const cleanItem: Record<string, unknown> = {};
  for (const key of WATCHLIST_BACKUP_FIELDS) {
    if (key in item) {
      cleanItem[key] = item[key];
    }
  }
  return cleanItem as unknown as WatchlistItem;
};

const stripAccountId = (account: Account): Account => {
  const cleanAccount = { ...account } as Account & { id?: number };
  delete cleanAccount.id;
  return cleanAccount as Account;
};

const isValidFund = (fund: Partial<Fund>): fund is Fund => {
  return (
    typeof fund.code === 'string' &&
    typeof fund.name === 'string' &&
    typeof fund.platform === 'string' &&
    typeof fund.holdingShares === 'number' &&
    typeof fund.costPrice === 'number' &&
    typeof fund.currentNav === 'number' &&
    typeof fund.lastUpdate === 'string' &&
    typeof fund.dayChangePct === 'number' &&
    typeof fund.dayChangeVal === 'number'
  );
};

const isValidWatchlistItem = (item: Partial<WatchlistItem>): item is WatchlistItem => {
  return (
    typeof item.code === 'string' &&
    typeof item.name === 'string' &&
    (item.type === 'fund' || item.type === 'index') &&
    typeof item.anchorPrice === 'number' &&
    typeof item.anchorDate === 'string' &&
    typeof item.currentPrice === 'number' &&
    typeof item.dayChangePct === 'number' &&
    typeof item.lastUpdate === 'string' &&
    (item.platform === undefined || typeof item.platform === 'string') &&
    (item.todayChangeIsEstimated === undefined ||
      typeof item.todayChangeIsEstimated === 'boolean') &&
    (item.todayChangeUnavailable === undefined || typeof item.todayChangeUnavailable === 'boolean')
  );
};

const isValidAccount = (account: Partial<Account>): account is Account => {
  return (
    typeof account.name === 'string' &&
    account.name.trim().length > 0 &&
    (account.isDefault === undefined || typeof account.isDefault === 'boolean')
  );
};

const isValidFundDailyEarningsPoint = (value: unknown): value is FundDailyEarningsPoint => {
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

const normalizeFundDailyEarningsStore = (value: unknown): FundDailyEarningsStore | undefined => {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new Error('无效的备份文件格式');
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([code, points]) => [
        code,
        Array.isArray(points)
          ? points.filter(isValidFundDailyEarningsPoint).sort((a, b) => a.date.localeCompare(b.date))
          : [],
      ] as const)
      .filter(([code, points]) => /^\d{6}$/.test(code) && points.length > 0),
  );
};

const isValidFundValuationSeriesPoint = (value: unknown): value is FundValuationSeriesPoint => {
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

const normalizeFundValuationStore = (value: unknown): FundValuationStore | undefined => {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new Error('无效的备份文件格式');
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([code, points]) => [
        code,
        Array.isArray(points)
          ? points
              .filter(isValidFundValuationSeriesPoint)
              .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
          : [],
      ] as const)
      .filter(([code, points]) => /^\d{6}$/.test(code) && points.length > 0),
  );
};

export const buildFundBackupKey = (fund: Pick<Fund, 'code' | 'platform'>): string => {
  return `${fund.code}_${fund.platform}`;
};

export const findDuplicateFundBackupKeys = (funds: Array<Pick<Fund, 'code' | 'platform'>>) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  funds.forEach((fund) => {
    const key = buildFundBackupKey(fund);
    if (seen.has(key)) {
      duplicates.add(key);
      return;
    }
    seen.add(key);
  });

  return Array.from(duplicates);
};

const stripInvestmentPlanId = (plan: InvestmentPlan): InvestmentPlan => {
  const cleanPlan = { ...plan } as InvestmentPlan & { id?: number };
  delete cleanPlan.id;
  return cleanPlan as InvestmentPlan;
};

export const buildFundBackupPayload = (
  funds: Fund[],
  exportDate = new Date().toISOString(),
  accounts: Account[] = [],
  watchlists: WatchlistItem[] = [],
  investmentPlans: InvestmentPlan[] = [],
  investmentProfile?: InvestmentProfileSnapshot,
  availableAssets?: number,
  fundDailyEarnings?: FundDailyEarningsStore,
  fundValuationTimeseries?: FundValuationStore,
): FundBackupPayload => {
  return {
    version: BACKUP_VERSION,
    exportDate,
    funds: funds.map(stripFundId),
    accounts: accounts.map(stripAccountId),
    watchlists: watchlists.map(stripWatchlistId),
    investmentPlans: investmentPlans.map(stripInvestmentPlanId),
    investmentProfile,
    ...(availableAssets !== undefined ? { availableAssets } : {}),
    ...(fundDailyEarnings && Object.keys(fundDailyEarnings).length > 0
      ? { fundDailyEarnings: normalizeFundDailyEarningsStore(fundDailyEarnings) }
      : {}),
    ...(fundValuationTimeseries && Object.keys(fundValuationTimeseries).length > 0
      ? { fundValuationTimeseries: normalizeFundValuationStore(fundValuationTimeseries) }
      : {}),
  };
};

export const parseAndNormalizeFundBackupPayload = (
  content: unknown,
): {
  funds: Fund[];
  accounts: Account[];
  watchlists: WatchlistItem[];
  investmentPlans: InvestmentPlan[];
  investmentProfile?: InvestmentProfileSnapshot;
  availableAssets?: number;
  fundDailyEarnings?: FundDailyEarningsStore;
  fundValuationTimeseries?: FundValuationStore;
} => {
  const parsed =
    typeof content === 'string' ? (JSON.parse(content) as Partial<FundBackupPayload>) : content;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('无效的备份文件格式');
  }

  const payload = parsed as Partial<FundBackupPayload>;
  if (payload.version !== BACKUP_VERSION || !Array.isArray(payload.funds)) {
    throw new Error('无效的备份文件格式');
  }

  const normalizedFunds = payload.funds.map((fund) => {
    if (!fund || typeof fund !== 'object' || !isValidFund(fund as Partial<Fund>)) {
      throw new Error('无效的备份文件格式');
    }
    return stripFundId(fund as Fund);
  });

  const rawAccounts = payload.accounts ?? [];
  if (!Array.isArray(rawAccounts)) {
    throw new Error('无效的备份文件格式');
  }

  const normalizedAccounts = rawAccounts.map((account) => {
    if (!account || typeof account !== 'object' || !isValidAccount(account as Partial<Account>)) {
      throw new Error('无效的备份文件格式');
    }
    return stripAccountId(account as Account);
  });

  const rawWatchlists = payload.watchlists ?? [];
  if (!Array.isArray(rawWatchlists)) {
    throw new Error('无效的备份文件格式');
  }

  const normalizedWatchlists = rawWatchlists.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      !isValidWatchlistItem(item as Partial<WatchlistItem>)
    ) {
      throw new Error('无效的备份文件格式');
    }
    return stripWatchlistId(item as WatchlistItem);
  });

  const rawInvestmentPlans = payload.investmentPlans ?? [];
  if (!Array.isArray(rawInvestmentPlans)) {
    throw new Error('无效的备份文件格式');
  }

  const isValidInvestmentPlan = (plan: Partial<InvestmentPlan>): plan is InvestmentPlan => {
    return (
      typeof plan.fundCode === 'string' &&
      typeof plan.amount === 'number' &&
      typeof plan.active === 'boolean' &&
      typeof plan.createdAt === 'string'
    );
  };

  const normalizedInvestmentPlans = rawInvestmentPlans.map((plan) => {
    if (
      !plan ||
      typeof plan !== 'object' ||
      !isValidInvestmentPlan(plan as Partial<InvestmentPlan>)
    ) {
      throw new Error('无效的备份文件格式');
    }
    return stripInvestmentPlanId(plan as InvestmentPlan);
  });

  const parsedAvailableAssets =
    typeof payload.availableAssets === 'number' && isFinite(payload.availableAssets)
      ? payload.availableAssets
      : undefined;
  const fundDailyEarnings = normalizeFundDailyEarningsStore(payload.fundDailyEarnings);
  const fundValuationTimeseries = normalizeFundValuationStore(payload.fundValuationTimeseries);

  return {
    funds: normalizedFunds,
    accounts: normalizedAccounts,
    watchlists: normalizedWatchlists,
    investmentPlans: normalizedInvestmentPlans,
    investmentProfile:
      payload.investmentProfile && typeof payload.investmentProfile === 'object'
        ? {
            riskTolerance:
              typeof payload.investmentProfile.riskTolerance === 'string'
                ? payload.investmentProfile.riskTolerance
                : '',
            investmentHorizon:
              typeof payload.investmentProfile.investmentHorizon === 'string'
                ? payload.investmentProfile.investmentHorizon
                : '',
            externalAssets:
              typeof payload.investmentProfile.externalAssets === 'string'
                ? payload.investmentProfile.externalAssets
                : '',
            notes:
              typeof payload.investmentProfile.notes === 'string'
                ? payload.investmentProfile.notes
                : '',
          }
        : undefined,
    availableAssets: parsedAvailableAssets,
    fundDailyEarnings,
    fundValuationTimeseries,
  };
};

export const parseAndNormalizeFundBackup = (content: unknown): Fund[] => {
  return parseAndNormalizeFundBackupPayload(content).funds;
};
