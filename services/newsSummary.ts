export type NewsSummaryTone = 'positive' | 'negative' | 'neutral' | 'warning' | 'info';

export interface NewsSummaryCard {
  title: string;
  value: string;
  note: string;
  tone: NewsSummaryTone;
}

export interface NewsSummaryInsight {
  tag: string;
  title: string;
  impact: string;
  relation: string;
  time: string;
  tone: NewsSummaryTone;
  url?: string;
  relatedToPortfolio?: boolean;
  relationReason?: string;
}

export interface NewsSummarySection {
  title: string;
  description: string;
  items: NewsSummaryInsight[];
}

export interface NewsSummarySourceStatus {
  label: string;
  value: string;
  tone: NewsSummaryTone;
}

export interface NewsSummaryResponse {
  ok: true;
  generatedAt: string;
  marketPhase: string;
  summaryLine: string;
  cards: NewsSummaryCard[];
  sections: NewsSummarySection[];
  sourceStatus: NewsSummarySourceStatus[];
}

const DEFAULT_NEWS_SUMMARY_WORKER_URL = 'https://fund-manager-telegram-ai-reminder.nizhan80.workers.dev';
const NEWS_SUMMARY_CACHE_TTL_MS = 2 * 60 * 1000;
const NEWS_SUMMARY_STORAGE_KEY = 'fundManager.newsSummaryCache.v3';
const LEGACY_NEWS_SUMMARY_STORAGE_KEY = 'fundManager.newsSummaryCache.v1';

type CacheEntry = {
  expiresAt: number;
  value: NewsSummaryResponse;
};

let cachedSummary: CacheEntry | null = null;

const isTone = (value: unknown): value is NewsSummaryTone => {
  return (
    value === 'positive' ||
    value === 'negative' ||
    value === 'neutral' ||
    value === 'warning' ||
    value === 'info'
  );
};

const asString = (value: unknown, fallback = '') => {
  return typeof value === 'string' ? value : fallback;
};

const normalizeInsight = (value: unknown): NewsSummaryInsight | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<NewsSummaryInsight>;
  if (!raw.title || !raw.tag) return null;

  return {
    tag: asString(raw.tag, '资讯'),
    title: asString(raw.title),
    impact: asString(raw.impact, '中性'),
    relation: asString(raw.relation, '暂无关联说明。'),
    time: asString(raw.time, '--'),
    tone: isTone(raw.tone) ? raw.tone : 'neutral',
    url: typeof raw.url === 'string' ? raw.url : undefined,
    relatedToPortfolio: typeof raw.relatedToPortfolio === 'boolean' ? raw.relatedToPortfolio : undefined,
    relationReason: typeof raw.relationReason === 'string' ? raw.relationReason : undefined,
  };
};

const normalizeNewsSummary = (value: unknown): NewsSummaryResponse | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<NewsSummaryResponse>;
  if (raw.ok !== true || !raw.generatedAt || !Array.isArray(raw.cards)) return null;

  const cards = raw.cards
    .filter((card): card is NewsSummaryCard => Boolean(card && typeof card === 'object'))
    .map((card) => ({
      title: asString(card.title, '摘要'),
      value: asString(card.value, '--'),
      note: asString(card.note, ''),
      tone: isTone(card.tone) ? card.tone : 'neutral',
    }))
    .filter((card) => card.title);
  if (cards.length === 0) return null;

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .filter((section): section is NewsSummarySection => Boolean(section && typeof section === 'object'))
        .map((section) => ({
          title: asString(section.title, '资讯'),
          description: asString(section.description, ''),
          items: Array.isArray(section.items)
            ? section.items
                .map((item) => normalizeInsight(item))
                .filter((item): item is NewsSummaryInsight => Boolean(item))
            : [],
        }))
    : [];

  const sourceStatus = Array.isArray(raw.sourceStatus)
    ? raw.sourceStatus
        .filter((item): item is NewsSummarySourceStatus => Boolean(item && typeof item === 'object'))
        .map((item) => ({
          label: asString(item.label, '数据源'),
          value: asString(item.value, 'missing'),
          tone: isTone(item.tone) ? item.tone : 'neutral',
        }))
    : [];

  return {
    ok: true,
    generatedAt: raw.generatedAt,
    marketPhase: asString(raw.marketPhase, 'unknown'),
    summaryLine: asString(raw.summaryLine, '资讯摘要暂不可用'),
    cards,
    sections,
    sourceStatus,
  };
};

const isCacheEntryValid = (entry: CacheEntry | null): entry is CacheEntry => {
  return Boolean(entry && entry.expiresAt > Date.now());
};

const readLocalNewsSummaryCache = (): CacheEntry | null => {
  try {
    const raw = localStorage.getItem(NEWS_SUMMARY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    const value = normalizeNewsSummary(parsed.value);
    if (typeof parsed.expiresAt !== 'number' || !value) {
      return null;
    }
    return { expiresAt: parsed.expiresAt, value };
  } catch {
    return null;
  }
};

const writeLocalNewsSummaryCache = (entry: CacheEntry) => {
  try {
    localStorage.setItem(NEWS_SUMMARY_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
};

const hasSectionItems = (summary: NewsSummaryResponse, title: string) => {
  return summary.sections.some((section) => section.title === title && section.items.length > 0);
};

const getSourceStatusValue = (summary: NewsSummaryResponse, label: string) => {
  return summary.sourceStatus.find((item) => item.label === label)?.value;
};

const shouldPersistNewsSummary = (summary: NewsSummaryResponse) => {
  const fundFlowFailed = getSourceStatusValue(summary, '资金流') === 'failed';
  const marketBreadthFailed = getSourceStatusValue(summary, '市场宽度') === 'failed';

  if (fundFlowFailed && !hasSectionItems(summary, '资金流')) return false;
  if (marketBreadthFailed && !hasSectionItems(summary, '市场宽度')) return false;

  return true;
};

export const getCachedNewsSummary = (): NewsSummaryResponse | null => {
  if (isCacheEntryValid(cachedSummary)) {
    return cachedSummary.value;
  }

  const localEntry = readLocalNewsSummaryCache();
  if (isCacheEntryValid(localEntry)) {
    cachedSummary = localEntry;
    return localEntry.value;
  }

  return null;
};

export const clearNewsSummaryCache = () => {
  cachedSummary = null;
  try {
    localStorage.removeItem(NEWS_SUMMARY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_NEWS_SUMMARY_STORAGE_KEY);
    localStorage.removeItem('fundManager.newsSummaryCache.v2');
  } catch {
    // ignore
  }
};

const resolveNewsSummaryWorkerUrl = () => {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEWS_SUMMARY_WORKER_URL) || '';
  return (envUrl || DEFAULT_NEWS_SUMMARY_WORKER_URL).replace(/\/+$/, '');
};

export const fetchNewsSummary = async (force = false): Promise<NewsSummaryResponse | null> => {
  const now = Date.now();
  if (!force && isCacheEntryValid(cachedSummary)) {
    return cachedSummary.value;
  }

  if (!force) {
    const localEntry = readLocalNewsSummaryCache();
    if (isCacheEntryValid(localEntry)) {
      cachedSummary = localEntry;
      return localEntry.value;
    }
  }

  try {
    const url = new URL(`${resolveNewsSummaryWorkerUrl()}/news-summary`);
    if (force) url.searchParams.set('t', String(now));
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const value = normalizeNewsSummary(await res.json());
    if (!value) return null;

    cachedSummary = { value, expiresAt: now + NEWS_SUMMARY_CACHE_TTL_MS };
    if (shouldPersistNewsSummary(value)) {
      writeLocalNewsSummaryCache(cachedSummary);
    }
    return value;
  } catch {
    return null;
  }
};
