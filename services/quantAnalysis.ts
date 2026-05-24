export type QuantSignal = '积极' | '偏积极' | '观望' | '偏谨慎' | '谨慎';

export interface QuantAnalysisFundItem {
  code: string;
  name: string;
  categoryLabel: string;
  marketLabel: string;
  signal: QuantSignal;
  score: number;
  dataStatus: 'available' | 'insufficient' | 'failed';
  reason: string;
  trendLabel: string;
  valuationLabel: string;
  valuationPositionPct?: number;
  benchmarkText: string;
  metrics: {
    return20d?: number;
    return60d?: number;
    annualizedReturn120d?: number;
    distanceToMa20Pct?: number;
    maxDrawdown120d?: number;
    volatility60d?: number;
    positiveDayRate60d?: number;
    sharpe120dProxy?: number;
    sortino120dProxy?: number;
    calmar120dProxy?: number;
  };
}

export interface QuantAnalysisGroup {
  title: string;
  items: QuantAnalysisFundItem[];
}

export interface QuantAnalysisResponse {
  ok: true;
  generatedAt: string;
  portfolio: {
    signal: QuantSignal;
    score: number;
    availableCount: number;
    totalCount: number;
    coveragePct: number;
    riskReturn: {
      volatility60d?: number;
      maxDrawdown120d?: number;
      sharpe120dProxy?: number;
      positiveDayRate60d?: number;
    };
  };
  groups: QuantAnalysisGroup[];
  note: string;
}

const DEFAULT_QUANT_ANALYSIS_WORKER_URL = 'https://fund-manager-telegram-ai-reminder.nizhan80.workers.dev';
const QUANT_ANALYSIS_CACHE_TTL_MS = 2 * 60 * 1000;
const QUANT_ANALYSIS_STORAGE_KEY = 'fundManager.quantAnalysisCache.v3';

interface CacheEntry {
  expiresAt: number;
  value: QuantAnalysisResponse;
}

let cachedQuantAnalysis: CacheEntry | null = null;

const isQuantSignal = (value: unknown): value is QuantSignal =>
  value === '积极' || value === '偏积极' || value === '观望' || value === '偏谨慎' || value === '谨慎';

const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const normalizeFundItem = (value: unknown): QuantAnalysisFundItem | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<QuantAnalysisFundItem>;
  if (!raw.name || !raw.code || !isQuantSignal(raw.signal)) return null;
  const rawMetrics = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {};

  return {
    code: asString(raw.code),
    name: asString(raw.name),
    categoryLabel: asString(raw.categoryLabel, 'UNKNOWN'),
    marketLabel: asString(raw.marketLabel, 'UNKNOWN'),
    signal: raw.signal,
    score: asNumber(raw.score) ?? 0,
    dataStatus:
      raw.dataStatus === 'available' || raw.dataStatus === 'insufficient' || raw.dataStatus === 'failed'
        ? raw.dataStatus
        : 'failed',
    reason: asString(raw.reason),
    trendLabel: asString(raw.trendLabel, '均线不足'),
    valuationLabel: asString(raw.valuationLabel, '估值不足'),
    valuationPositionPct: asNumber(raw.valuationPositionPct),
    benchmarkText: asString(raw.benchmarkText, '基准: 缺失'),
    metrics: {
      return20d: asNumber(rawMetrics.return20d),
      return60d: asNumber(rawMetrics.return60d),
      annualizedReturn120d: asNumber(rawMetrics.annualizedReturn120d),
      distanceToMa20Pct: asNumber(rawMetrics.distanceToMa20Pct),
      maxDrawdown120d: asNumber(rawMetrics.maxDrawdown120d),
      volatility60d: asNumber(rawMetrics.volatility60d),
      positiveDayRate60d: asNumber(rawMetrics.positiveDayRate60d),
      sharpe120dProxy: asNumber(rawMetrics.sharpe120dProxy),
      sortino120dProxy: asNumber(rawMetrics.sortino120dProxy),
      calmar120dProxy: asNumber(rawMetrics.calmar120dProxy),
    },
  };
};

const normalizeQuantAnalysis = (value: unknown): QuantAnalysisResponse | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<QuantAnalysisResponse>;
  if (raw.ok !== true || !raw.generatedAt || !raw.portfolio || !isQuantSignal(raw.portfolio.signal)) {
    return null;
  }

  const rawRiskReturn = raw.portfolio.riskReturn || {};
  const groups = Array.isArray(raw.groups)
    ? raw.groups
        .filter((group): group is QuantAnalysisGroup => Boolean(group && typeof group === 'object'))
        .map((group) => ({
          title: asString(group.title, '量化分组'),
          items: Array.isArray(group.items)
            ? group.items.map((item) => normalizeFundItem(item)).filter((item): item is QuantAnalysisFundItem => Boolean(item))
            : [],
        }))
        .filter((group) => group.items.length > 0)
    : [];

  return {
    ok: true,
    generatedAt: raw.generatedAt,
    portfolio: {
      signal: raw.portfolio.signal,
      score: asNumber(raw.portfolio.score) ?? 0,
      availableCount: asNumber(raw.portfolio.availableCount) ?? 0,
      totalCount: asNumber(raw.portfolio.totalCount) ?? 0,
      coveragePct: asNumber(raw.portfolio.coveragePct) ?? 0,
      riskReturn: {
        volatility60d: asNumber(rawRiskReturn.volatility60d),
        maxDrawdown120d: asNumber(rawRiskReturn.maxDrawdown120d),
        sharpe120dProxy: asNumber(rawRiskReturn.sharpe120dProxy),
        positiveDayRate60d: asNumber(rawRiskReturn.positiveDayRate60d),
      },
    },
    groups,
    note: asString(raw.note),
  };
};

const isCacheEntryValid = (entry: CacheEntry | null): entry is CacheEntry => Boolean(entry && entry.expiresAt > Date.now());

export const isQuantAnalysisComplete = (value: QuantAnalysisResponse | null) =>
  Boolean(value && value.portfolio.totalCount > 0 && value.portfolio.availableCount >= value.portfolio.totalCount);

const readLocalQuantAnalysisCache = (): CacheEntry | null => {
  try {
    const raw = localStorage.getItem(QUANT_ANALYSIS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    const value = normalizeQuantAnalysis(parsed.value);
    if (typeof parsed.expiresAt !== 'number' || !value) return null;
    return { expiresAt: parsed.expiresAt, value };
  } catch {
    return null;
  }
};

const writeLocalQuantAnalysisCache = (entry: CacheEntry) => {
  try {
    localStorage.setItem(QUANT_ANALYSIS_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
};

const resolveQuantAnalysisWorkerUrl = () => {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_QUANT_ANALYSIS_WORKER_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEWS_SUMMARY_WORKER_URL) ||
    '';
  return (envUrl || DEFAULT_QUANT_ANALYSIS_WORKER_URL).replace(/\/+$/, '');
};

export const getCachedQuantAnalysis = (): QuantAnalysisResponse | null => {
  if (isCacheEntryValid(cachedQuantAnalysis) && isQuantAnalysisComplete(cachedQuantAnalysis.value)) {
    return cachedQuantAnalysis.value;
  }
  const localEntry = readLocalQuantAnalysisCache();
  if (isCacheEntryValid(localEntry) && isQuantAnalysisComplete(localEntry.value)) {
    cachedQuantAnalysis = localEntry;
    return localEntry.value;
  }
  return null;
};

export const clearQuantAnalysisCache = () => {
  cachedQuantAnalysis = null;
  try {
    localStorage.removeItem(QUANT_ANALYSIS_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const fetchQuantAnalysis = async (force = false): Promise<QuantAnalysisResponse | null> => {
  const now = Date.now();
  if (!force && isCacheEntryValid(cachedQuantAnalysis) && isQuantAnalysisComplete(cachedQuantAnalysis.value)) {
    return cachedQuantAnalysis.value;
  }

  if (!force) {
    const localEntry = readLocalQuantAnalysisCache();
    if (isCacheEntryValid(localEntry) && isQuantAnalysisComplete(localEntry.value)) {
      cachedQuantAnalysis = localEntry;
      return localEntry.value;
    }
  }

  try {
    const url = new URL(`${resolveQuantAnalysisWorkerUrl()}/quant-analysis`);
    if (force) url.searchParams.set('t', String(now));
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const value = normalizeQuantAnalysis(await res.json());
    if (!value) return null;

    if (isQuantAnalysisComplete(value)) {
      const entry = { expiresAt: now + QUANT_ANALYSIS_CACHE_TTL_MS, value };
      cachedQuantAnalysis = entry;
      writeLocalQuantAnalysisCache(entry);
    }
    return value;
  } catch {
    return null;
  }
};
