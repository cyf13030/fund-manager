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

interface MoneyFlowPanelProps {
  summary: NewsSummaryResponse;
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

const getCard = (cards: NewsSummaryCard[], title: string) => cards.find((card) => card.title === title);

const mergeTones = (...tones: Array<NewsSummaryTone | undefined>): NewsSummaryTone => {
  if (tones.includes('negative')) return 'negative';
  if (tones.includes('warning')) return 'warning';
  if (tones.includes('positive')) return 'positive';
  if (tones.includes('info')) return 'info';
  return 'neutral';
};

const buildPrimaryCards = (cards: NewsSummaryCard[]) => {
  const marketCard = getCard(cards, '市场温度');
  const newsCard = getCard(cards, '盘后消息');
  const fundFlowCard = getCard(cards, '资金流');
  const rotationCard = getCard(cards, '行业轮动');
  const portfolioCard = getCard(cards, '持仓匹配');
  const capitalCard = getCard(cards, '资金面');

  const mainFlowCard: NewsSummaryCard | undefined = fundFlowCard
    ? {
        title: '主线资金',
        value: rotationCard ? `${fundFlowCard.value} · ${rotationCard.value}` : fundFlowCard.value,
        note: rotationCard ? `${fundFlowCard.note}；${rotationCard.note}` : fundFlowCard.note,
        tone: mergeTones(fundFlowCard.tone, rotationCard?.tone),
      }
    : rotationCard
      ? { ...rotationCard, title: '主线资金' }
      : undefined;

  return [marketCard, newsCard, mainFlowCard, portfolioCard ?? capitalCard].filter(
    (card): card is NewsSummaryCard => Boolean(card),
  );
};

const buildFocusItems = (sections: NewsSummaryResponse['sections']) => {
  return sections
    .flatMap((section) => section.items.map((item) => ({ ...item, sectionTitle: section.title })))
    .filter((item) => item.relatedToPortfolio || item.tone === 'negative' || item.tone === 'warning')
    .sort((a, b) => {
      const score = (item: NewsSummaryInsight) =>
        (item.relatedToPortfolio ? 4 : 0) + (item.tone === 'negative' ? 3 : item.tone === 'warning' ? 2 : 0);
      return score(b) - score(a);
    })
    .slice(0, 4);
};

const getSectionItems = (sections: NewsSummaryResponse['sections'], title: string) => {
  return sections.find((section) => section.title === title)?.items ?? [];
};

const buildMoneyFlowInterpretation = (
  mainFlowCard: NewsSummaryCard | undefined,
  rotationCard: NewsSummaryCard | undefined,
  breadthCard: NewsSummaryCard | undefined,
  capitalCard: NewsSummaryCard | undefined,
) => {
  const mainFlow = mainFlowCard?.value && mainFlowCard.value !== '--' ? mainFlowCard.value : '暂无明确主线';
  const rotation = rotationCard?.value ? `，轮动状态为${rotationCard.value}` : '';
  const breadth = breadthCard?.value ? `；市场宽度为${breadthCard.value}` : '';
  const capital = capitalCard?.value ? `；增量资金显示${capitalCard.value}` : '';
  return `当前资金主线偏向${mainFlow}${rotation}${breadth}${capital}。若后续放量且上涨家数维持扩散，说明主线延续性更强；若成交额缩量或宽度转弱，需要防范短线兑现。融资融券、ETF 和成交额均为 proxy，不等同于真实净申购或全市场资金净流入。`;
};

const MoneyFlowPanel: React.FC<MoneyFlowPanelProps> = ({ summary }) => {
  const flowItems = getSectionItems(summary.sections, '资金流');
  const breadthItems = getSectionItems(summary.sections, '市场宽度');
  const capitalItems = getSectionItems(summary.sections, '资金面');
  const mainFlowCard = getCard(summary.cards, '资金流');
  const rotationCard = getCard(summary.cards, '行业轮动');
  const breadthCard = getCard(summary.cards, '市场宽度');
  const turnoverCard = getCard(summary.cards, '成交量');
  const capitalCard = getCard(summary.cards, '资金面');
  const interpretation = buildMoneyFlowInterpretation(mainFlowCard, rotationCard, breadthCard, capitalCard);

  return (
    <section className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500 dark:text-sky-300">
            Fund Flow
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">资金流向</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            拆分主线资金、市场宽度和增量资金，避免只看单一榜单。
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
          proxy 口径
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="text-xs font-semibold text-slate-400">主线资金</div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {mainFlowCard?.value ?? '--'}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {rotationCard ? `${mainFlowCard?.note ?? ''}；${rotationCard.note}` : mainFlowCard?.note ?? '暂无主线资金数据'}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="text-xs font-semibold text-slate-400">市场宽度</div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {breadthCard?.value ?? '--'}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {turnoverCard ? `${breadthCard?.note ?? ''}；${turnoverCard.note}` : breadthCard?.note ?? '暂无宽度数据'}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="text-xs font-semibold text-slate-400">增量资金</div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {capitalCard?.value ?? '--'}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {capitalCard?.note ?? '暂无北向/南向和 ETF proxy 数据'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">资金榜单</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
              {flowItems.length} 条
            </span>
          </div>
          <div className="divide-y divide-slate-200/70 dark:divide-white/10">
            {flowItems.slice(0, 6).map((item) => (
              <div key={`${item.tag}-${item.title}-${item.time}`} className="grid grid-cols-[auto_1fr_auto] gap-3 py-2 text-sm">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[item.tone]}`}>
                  {item.tag}
                </span>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.relation}</div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">{item.time}</span>
              </div>
            ))}
            {flowItems.length === 0 ? (
              <div className="py-3 text-sm text-slate-400 dark:text-slate-500">暂无资金榜单数据。</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">宽度与增量资金</h3>
          <div className="mt-3 space-y-3">
            {[...breadthItems, ...capitalItems].map((item) => (
              <div key={`${item.tag}-${item.title}-${item.time}`} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`rounded-full px-2.5 py-1 ${toneClasses[item.tone]}`}>{item.tag}</span>
                  <span className="text-slate-400 dark:text-slate-500">{item.impact}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.relation}</div>
              </div>
            ))}
            {breadthItems.length + capitalItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 p-3 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
                暂无市场宽度或增量资金数据。
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-4 text-sm leading-7 text-slate-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-white">资金解读：</span>
        {interpretation}
      </div>
    </section>
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
  const [isShowingCache, setIsShowingCache] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'portfolio' | string>('all');
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      const cached = getCachedNewsSummary();
      if (cached) {
        setSummary(cached);
        setIsShowingCache(true);
        setIsLoading(false);
      }

      setLoadError(null);
      setIsRefreshing(Boolean(cached));

      const data = await fetchNewsSummary(true);
      if (cancelled) return;

      if (data) {
        setSummary(data);
        setIsShowingCache(false);
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
  const primaryCards = useMemo(() => buildPrimaryCards(summary.cards), [summary.cards]);
  const focusItems = useMemo(() => buildFocusItems(summary.sections), [summary.sections]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    const data = await fetchNewsSummary(true);
    if (data) {
      setSummary(data);
      setIsShowingCache(false);
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
  const generatedAtTime = summary.generatedAt
    ? new Date(summary.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const generatedAtAgeMinutes = summary.generatedAt
    ? Math.floor((Date.now() - Date.parse(summary.generatedAt)) / 60_000)
    : undefined;
  const dataFreshnessLabel = isShowingCache
    ? '缓存数据'
    : isRefreshing
      ? '正在刷新'
      : generatedAtAgeMinutes !== undefined && generatedAtAgeMinutes > 10
        ? `约 ${generatedAtAgeMinutes} 分钟前`
        : '实时摘要';

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
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <span>{todayLabel}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isShowingCache
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : isRefreshing
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  }`}
                >
                  {dataFreshnessLabel}
                </span>
              </div>
              <div className="mt-1">
                {generatedAtTime ? `更新时间 ${generatedAtTime}` : '等待 Worker 更新'}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur dark:bg-white/5 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">摘要：</span>
            {summary.summaryLine}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {primaryCards.map((card) => (
              <SummaryCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        <MoneyFlowPanel summary={summary} />

        <section className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="mb-5 rounded-3xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">重点消息</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  优先展示风险、需观察和持仓相关消息。
                </p>
              </div>
              <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-white/10 dark:text-amber-300">
                {focusItems.length} 条
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {focusItems.length > 0 ? (
                focusItems.map((item) => {
                  const itemKey = `focus-${item.sectionTitle}-${item.tag}-${item.title}-${item.time}`;
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
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-amber-200/80 bg-white/70 p-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-white/5 dark:text-amber-300">
                  暂无风险或持仓相关重点消息。
                </div>
              )}
            </div>
          </div>

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
                {isLoading ? '加载中' : isShowingCache ? '缓存摘要' : isRefreshing ? '刷新中' : 'Worker 摘要'}
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

        <section className="rounded-[2rem] border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">数据源状态</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            用来判断本次摘要是否完整；部分数据为 proxy，仅作辅助参考。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summary.sourceStatus.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{item.value}</div>
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
