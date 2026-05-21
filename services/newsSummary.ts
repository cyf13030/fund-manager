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

type CacheEntry = {
  expiresAt: number;
  value: NewsSummaryResponse;
};

let cachedSummary: CacheEntry | null = null;

const resolveNewsSummaryWorkerUrl = () => {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEWS_SUMMARY_WORKER_URL) || '';
  return (envUrl || DEFAULT_NEWS_SUMMARY_WORKER_URL).replace(/\/+$/, '');
};

export const fetchNewsSummary = async (force = false): Promise<NewsSummaryResponse | null> => {
  const now = Date.now();
  if (!force && cachedSummary && cachedSummary.expiresAt > now) {
    return cachedSummary.value;
  }

  try {
    const res = await fetch(`${resolveNewsSummaryWorkerUrl()}/news-summary`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as Partial<NewsSummaryResponse>;
    if (!payload.ok || !payload.generatedAt || !Array.isArray(payload.cards)) return null;

    const value = payload as NewsSummaryResponse;
    cachedSummary = { value, expiresAt: now + NEWS_SUMMARY_CACHE_TTL_MS };
    return value;
  } catch {
    return null;
  }
};
