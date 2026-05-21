import React, { useEffect, useState } from 'react';
import { Icons } from './Icon';
import { useTranslation } from '../services/i18n';
import {
  fetchNewsSummary,
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

const SummaryItem: React.FC<SummaryItemProps> = ({ item }) => {
  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className={`rounded-full px-2.5 py-1 ${toneClasses[item.tone]}`}>{item.tag}</span>
        <span className="text-slate-400 dark:text-slate-500">{item.time}</span>
        <span className="text-slate-400 dark:text-slate-500">{item.impact}</span>
      </div>
      <h3 className="mt-3 text-[1rem] font-semibold leading-7 text-slate-900 dark:text-white">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.relation}</p>
    </article>
  );
};

export const NewsPage: React.FC = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<NewsSummaryResponse>(fallbackSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setIsLoading(true);
      setLoadError(null);

      const data = await fetchNewsSummary(true);
      if (cancelled) return;

      if (data) {
        setSummary(data);
      } else {
        setSummary(fallbackSummary);
        setLoadError('资讯摘要暂不可用，正在显示本地兜底结构。');
      }
      setIsLoading(false);
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

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
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <Icons.Layers size={14} />
              {isLoading ? '加载中' : 'Worker 摘要'}
            </div>
          </div>

          {loadError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              {loadError}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {summary.sections.flatMap((section) =>
              section.items.length > 0
                ? section.items.map((item) => <SummaryItem key={`${section.title}-${item.title}`} item={item} />)
                : [
                    <div
                      key={section.title}
                      className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                    >
                      <div className="font-semibold text-slate-600 dark:text-slate-300">{section.title}</div>
                      <div className="mt-2 leading-6">{section.description}</div>
                    </div>,
                  ],
            )}
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
