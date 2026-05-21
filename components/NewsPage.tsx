import React, { useEffect, useMemo, useState } from 'react';
import { Icons } from './Icon';
import { useTranslation } from '../services/i18n';
import {
  fetchNewsSummary,
  getCachedNewsSummary,
  type NewsSummaryCard,
  type NewsSummaryInsight,
  type NewsSummaryResponse,
  type NewsSummaryTone,
} from '../services/newsSummary';

const toneClasses: Record<NewsSummaryTone, string> = {
  positive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  info: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  negative: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

const fallbackSummary: NewsSummaryResponse = {
  ok: true,
  generatedAt: '',
  marketPhase: 'unknown',
  summaryLine: '正在加载资讯摘要',
  cards: [
    {
      title: '市场温度',
      value: '加载中',
      note: '正在读取 Worker 资讯摘要',
      tone: 'info',
    },
    {
      title: '盘后消息',
      value: '--',
      note: '等待新闻与公告摘要',
      tone: 'neutral',
    },
    {
      title: '外围市场',
      value: '--',
      note: '等待外围快照',
      tone: 'neutral',
    },
    {
      title: '资金流',
      value: '--',
      note: '等待资金流摘要',
      tone: 'neutral',
    },
  ],
  sections: [
    {
      title: 'A 股指数',
      description: '等待 Worker 数据返回。',
      items: [],
    },
    {
      title: '盘后消息',
      description: '等待 Worker 数据返回。',
      items: [],
    },
    {
      title: '资金流',
      description: '等待 Worker 数据返回。',
      items: [],
    },
    {
      title: '外围市场',
      description: '等待 Worker 数据返回。',
      items: [],
    },
  ],
  sourceStatus: [
    { label: 'A股指数', value: 'missing', tone: 'neutral' },
    { label: '外围市场', value: 'missing', tone: 'neutral' },
    { label: '盘后消息', value: 'missing', tone: 'neutral' },
    { label: '资金流', value: 'missing', tone: 'neutral' },
  ],
};

interface SummaryCardProps {
  card: NewsSummaryCard;
}

interface SummaryItemProps {
  item: NewsSummaryInsight;
  isOpen: boolean;
  onToggle: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ card }) => {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          {card.title}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[card.tone]}`}>
          {card.tone === 'positive'
            ? '偏正面'
            : card.tone === 'negative'
              ? '偏负面'
              : card.tone === 'warning'
                ? '需观察'
                : card.tone === 'info'
                  ? '信息'
                  : '中性'}
        </span>
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{card.note}</p>
    </div>
  );
};

const SummaryItem: React.FC<SummaryItemProps> = ({ item, isOpen, onToggle }) => {
  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full rounded-3xl p-4 text-left transition hover:border-slate-300 hover:bg-white dark:hover:border-white/20 dark:hover:bg-white/5"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className={`rounded-full px-2.5 py-1 ${toneClasses[item.tone]}`}>{item.tag}</span>
          <span className="text-slate-400 dark:text-slate-500">{item.time}</span>
          <span className="text-slate-400 dark:text-slate-500">{item.impact}</span>
          {item.relatedToPortfolio ? (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              持仓相关
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-[1rem] font-semibold leading-7 text-slate-900 dark:text-white">
          {item.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.relation}</p>
        <div className="mt-4 flex items-center justify-end text-xs font-semibold text-slate-400 dark:text-slate-500">
          {isOpen ? '收起' : '展开详情'}
        </div>
      </button>
      {isOpen ? (
        <div className="border-t border-slate-200/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:text-slate-300">
          {item.relationReason ? <p>关联原因：{item.relationReason}</p> : null}
          {item.url ? (
            <p className="mt-2">
              原文：
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-sky-600 underline-offset-4 hover:underline dark:text-sky-300"
              >
                打开链接
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export const NewsPage: React.FC = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<NewsSummaryResponse>(fallbackSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'portfolio' | string>('all');
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      const cached = getCachedNewsSummary();
      if (cached) {
        setSummary(cached);
        setIsLoading(false);
      }

      setLoadError(null);
      setIsRefreshing(Boolean(cached));

      const data = await fetchNewsSummary(true);
      if (cancelled) return;

      if (data) {
        setSummary(data);
        setLoadError(null);
      } else if (!cached) {
        setSummary(fallbackSummary);
        setLoadError('资讯摘要暂不可用，正在显示本地兜底结构。');
      } else {
        setLoadError('资讯摘要刷新失败，当前显示的是缓存内容。');
      }

      setIsLoading(false);
      setIsRefreshing(false);
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = useMemo(() => {
    const sectionTitles = summary.sections.map((section) => section.title);
    return ['all', 'portfolio', ...sectionTitles] as const;
  }, [summary.sections]);

  const filteredSections = useMemo(() => {
    return summary.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (activeFilter === 'all') return true;
          if (activeFilter === 'portfolio') return Boolean(item.relatedToPortfolio);
          return section.title === activeFilter;
        }),
      }))
      .filter((section) => section.items.length > 0 || activeFilter === section.title || activeFilter === 'all');
  }, [activeFilter, summary.sections]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    const data = await fetchNewsSummary(true);
    if (data) {
      setSummary(data);
      setLoadError(null);
    } else {
      setLoadError('手动刷新失败，当前继续显示已有内容。');
    }
    setIsRefreshing(false);
  };

  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  return (
    <div className="min-h-[60vh] px-4 pt-4 pb-6 md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-[2rem] border border-white/60 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-sm dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500 dark:text-sky-300">
                {t('common.news')}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                市场资讯
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                只看会影响持仓和明日判断的消息，不堆标题，不堆噪音。
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur dark:bg-white/5 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white">{todayLabel}</div>
              <div className="mt-1">{summary.generatedAt ? `更新时间 ${new Date(summary.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '等待 Worker 更新'}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur dark:bg-white/5 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">摘要：</span>
            {summary.summaryLine}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.cards.map((card) => (
              <SummaryCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">资讯洞察</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">按影响强弱整理，不按时间堆叠。</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleRefresh();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <Icons.Refresh size={14} />
                {isRefreshing ? '刷新中' : '手动刷新'}
              </button>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <Icons.Layers size={14} />
                {isLoading ? '加载中' : 'Worker 摘要'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = activeFilter === option;
              const label =
                option === 'all'
                  ? '全部'
                  : option === 'portfolio'
                    ? '持仓相关'
                    : option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setActiveFilter(option);
                    setOpenItemKey(null);
                  }}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loadError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              {loadError}
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            {filteredSections.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
                当前筛选下暂无该类资讯。
              </div>
            ) : null}
            {filteredSections.map((section) => (
              <section key={section.title} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{section.title}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{section.description}</div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    {section.items.length} 条
                  </div>
                </div>

                {section.items.length > 0 ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {section.items.map((item) => {
                      const itemKey = `${section.title}-${item.tag}-${item.title}-${item.time}`;
                      return (
                        <SummaryItem
                          key={itemKey}
                          item={item}
                          isOpen={openItemKey === itemKey}
                          onToggle={() =>
                            setOpenItemKey((current) => (current === itemKey ? null : itemKey))
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
                    当前筛选下暂无该类资讯。
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">本次 AI 依据</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {summary.sourceStatus.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{item.value}</div>
                <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[item.tone]}`}>
                  {item.tone === 'positive'
                    ? '可用'
                    : item.tone === 'negative'
                      ? '失败'
                      : item.tone === 'warning'
                        ? '部分'
                        : '观察'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
