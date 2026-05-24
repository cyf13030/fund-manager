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

type BriefingGroupKey = 'focus' | 'policy' | 'industry' | 'competitor' | 'market' | 'watch';

interface BriefingItem extends NewsSummaryInsight {
  sectionTitle: string;
  priority: BriefingPriority;
}

interface BriefingGroup {
  key: BriefingGroupKey;
  title: string;
  description: string;
  items: BriefingItem[];
}

interface BriefingPriority {
  label: 'P0' | 'P1' | 'P2' | 'P3';
  text: string;
  className: string;
}

interface MarketBreadthStats {
  upCount?: number;
  downCount?: number;
  limitUpCount?: number;
  limitDownCount?: number;
  upRatio?: number;
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

const getSectionItems = (sections: NewsSummaryResponse['sections'], title: string) => {
  return sections.find((section) => section.title === title)?.items ?? [];
};

const BRIEFING_GROUP_META: Record<BriefingGroupKey, Omit<BriefingGroup, 'key' | 'items'>> = {
  focus: {
    title: '今日焦点',
    description: '高优先级事件，承接原重点消息，不重复展示。',
  },
  policy: {
    title: '监管政策',
    description: '证监会、中基协、央行和合规相关信息。',
  },
  industry: {
    title: '基金行业趋势',
    description: '公募、ETF、FOF、发行、费率和投顾趋势。',
  },
  competitor: {
    title: '竞品/渠道动态',
    description: '代销平台、银行、券商和互联网财富渠道。',
  },
  market: {
    title: '市场行情',
    description: '指数、成交额、跨境资金和外围扰动。',
  },
  watch: {
    title: '待观察',
    description: '信息不足或影响偏中性的后续观察项。',
  },
};

const resolveBriefingPriority = (item: NewsSummaryInsight): BriefingPriority => {
  const text = `${item.impact} ${item.title} ${item.relation}`;
  if (item.tone === 'negative' || /极高|高|风险|紧急|处罚|监管/.test(text)) {
    return {
      label: 'P0',
      text: '紧急必看',
      className: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    };
  }
  if (item.tone === 'warning') {
    return {
      label: 'P1',
      text: '重要关注',
      className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    };
  }
  if (item.tone === 'positive' || item.tone === 'info') {
    return {
      label: 'P2',
      text: '建议了解',
      className: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    };
  }
  return {
    label: 'P3',
    text: '知悉即可',
    className: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
  };
};

const classifyBriefingItem = (item: NewsSummaryInsight, sectionTitle: string): BriefingGroupKey => {
  const text = `${sectionTitle} ${item.tag} ${item.title} ${item.impact} ${item.relation}`;
  if (/证监会|中基协|央行|监管|处罚|信披|适当性|合规|政策/.test(text)) return 'policy';
  if (/蚂蚁|天天基金|招商银行|银行|券商|代销|渠道|盈米|且慢|竞品/.test(text)) return 'competitor';
  if (/公募|ETF|FOF|发行|规模|费率|投顾|基金公司|行业趋势/.test(text)) return 'industry';
  if (/指数|A股|外围|成交额|北向|南向|涨跌|资金面|市场宽度/.test(text)) return 'market';
  if (item.tone === 'negative' || item.tone === 'warning' || item.relatedToPortfolio) return 'focus';
  return 'watch';
};

const buildIndustryBriefingGroups = (sections: NewsSummaryResponse['sections']): BriefingGroup[] => {
  const groups = new Map<BriefingGroupKey, BriefingItem[]>();
  const seen = new Set<string>();

  sections.forEach((section) => {
    section.items.forEach((item) => {
      const dedupeKey = `${item.title}-${item.time}-${item.tag}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      const key = classifyBriefingItem(item, section.title);
      const priority = resolveBriefingPriority(item);
      groups.set(key, [...(groups.get(key) ?? []), { ...item, sectionTitle: section.title, priority }]);
    });
  });

  const order: BriefingGroupKey[] = ['focus', 'policy', 'industry', 'competitor', 'market', 'watch'];
  return order
    .map((key) => {
      const meta = BRIEFING_GROUP_META[key];
      const items = (groups.get(key) ?? [])
        .sort((a, b) => a.priority.label.localeCompare(b.priority.label))
        .slice(0, 3);
      return { key, ...meta, items };
    })
    .filter((group) => group.items.length > 0);
};

const parseMarketBreadthStats = (breadthItems: NewsSummaryInsight[]): MarketBreadthStats => {
  const breadthText = breadthItems.map((item) => `${item.title} ${item.relation}`).join(' ');
  const upDownMatch = breadthText.match(/([\d,]+)\s*涨\s*\/\s*([\d,]+)\s*跌/);
  const limitMatch = breadthText.match(/涨停\s*([\d,]+).*?跌停\s*([\d,]+)/);
  const parseCount = (value: string | undefined) => {
    const parsed = Number(value?.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const upCount = parseCount(upDownMatch?.[1]);
  const downCount = parseCount(upDownMatch?.[2]);
  const totalCount = (upCount ?? 0) + (downCount ?? 0);

  return {
    upCount,
    downCount,
    limitUpCount: parseCount(limitMatch?.[1]),
    limitDownCount: parseCount(limitMatch?.[2]),
    upRatio: totalCount > 0 && upCount !== undefined ? Math.round((upCount / totalCount) * 1000) / 10 : undefined,
  };
};

const AShareBreadthCard: React.FC<{ stats: MarketBreadthStats }> = ({ stats }) => {
  if (stats.upCount === undefined || stats.downCount === undefined) return null;
  const distributionLabel =
    stats.upRatio === undefined
      ? '涨跌分布数据可用'
      : stats.upRatio >= 65
        ? '多数样本上涨'
        : stats.upRatio <= 45
          ? '多数样本下跌'
          : '涨跌分布较均衡';
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
      <div className="text-xs font-semibold text-slate-400">上涨 / 下跌</div>
      <div className="mt-2 text-lg font-bold">
        <span className="text-rose-500 dark:text-rose-300">{stats.upCount.toLocaleString('zh-CN')}</span>
        <span className="mx-1 text-slate-400">/</span>
        <span className="text-emerald-500 dark:text-emerald-300">{stats.downCount.toLocaleString('zh-CN')}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {stats.upRatio !== undefined ? `上涨占比 ${stats.upRatio.toFixed(1)}%，${distributionLabel}` : distributionLabel}
      </p>
    </div>
  );
};

const AShareLimitCard: React.FC<{ stats: MarketBreadthStats }> = ({ stats }) => {
  if (stats.limitUpCount === undefined || stats.limitDownCount === undefined) return null;
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
      <div className="text-xs font-semibold text-slate-400">涨停 / 跌停</div>
      <div className="mt-2 text-lg font-bold">
        <span className="text-rose-500 dark:text-rose-300">{stats.limitUpCount.toLocaleString('zh-CN')}</span>
        <span className="mx-1 text-slate-400">/</span>
        <span className="text-emerald-500 dark:text-emerald-300">{stats.limitDownCount.toLocaleString('zh-CN')}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {stats.limitUpCount > stats.limitDownCount ? '涨停多于跌停，短线情绪偏强' : '跌停压力不低，短线情绪需观察'}
      </p>
    </div>
  );
};

const buildMoneyFlowInterpretation = (
  mainFlowCard: NewsSummaryCard | undefined,
  rotationCard: NewsSummaryCard | undefined,
  breadthCard: NewsSummaryCard | undefined,
  capitalCard: NewsSummaryCard | undefined,
) => {
  const mainFlow = mainFlowCard?.value && mainFlowCard.value !== '--' ? mainFlowCard.value : '暂无明确主线';
  const rotation = rotationCard?.value ? `，轮动状态为${rotationCard.value}` : '';
  const breadth = breadthCard?.value ? `；涨跌分布为${breadthCard.value}` : '';
  const capital = capitalCard?.value ? `；增量资金显示${capitalCard.value}` : '';
  return `当前资金主线偏向${mainFlow}${rotation}${breadth}${capital}。若后续放量且上涨家数继续扩散，说明主线延续性更强；若成交额缩量或上涨家数明显回落，需要防范短线兑现。融资融券、ETF 和成交额均为 proxy，不等同于真实净申购或全市场资金净流入。`;
};

const MoneyFlowPanel: React.FC<MoneyFlowPanelProps> = ({ summary }) => {
  const flowItems = getSectionItems(summary.sections, '资金流');
  const breadthItems = getSectionItems(summary.sections, '市场宽度');
  const capitalItems = getSectionItems(summary.sections, '资金面');
  const breadthStats = parseMarketBreadthStats(breadthItems);
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
            拆分主线资金、涨跌分布和增量资金，避免只看单一榜单。
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
          <div className="text-xs font-semibold text-slate-400">涨跌分布</div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {breadthCard?.value ?? '--'}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {turnoverCard ? `${breadthCard?.note ?? ''}；${turnoverCard.note}` : breadthCard?.note ?? '暂无涨跌分布数据'}
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">涨跌与增量资金</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <AShareBreadthCard stats={breadthStats} />
            <AShareLimitCard stats={breadthStats} />
            {capitalItems.map((item) => (
              <div key={`${item.tag}-${item.title}-${item.time}`} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`rounded-full px-2.5 py-1 ${toneClasses[item.tone]}`}>{item.tag}</span>
                  <span className="text-slate-400 dark:text-slate-500">{item.impact}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.relation}</div>
              </div>
            ))}
            {breadthStats.upCount === undefined && breadthStats.limitUpCount === undefined && capitalItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 p-3 text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
                暂无涨跌分布或增量资金数据。
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

const IndustryBriefingPanel: React.FC<{ groups: BriefingGroup[] }> = ({ groups }) => {
  return (
    <section className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500 dark:text-indigo-300">
            Industry Briefing
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">基金行业简报</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            参考行业看板的分层方式，只重组 Worker 已返回内容，默认关注近两周；缺失不补写。
          </p>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          P0-P3 优先级
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
          暂无可重组的行业简报数据，等待 Worker 返回监管、行业或竞品信息。
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.key} className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{group.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{group.description}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  {group.items.length} 条
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <article key={`${group.key}-${item.tag}-${item.title}-${item.time}`} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className={`rounded-full px-2.5 py-1 ${item.priority.className}`}>
                        {item.priority.label} {item.priority.text}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                        {item.sectionTitle}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">{item.time}</span>
                    </div>
                    <h4 className="mt-2 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.relation}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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
  const briefingGroups = useMemo(() => buildIndustryBriefingGroups(summary.sections), [summary.sections]);

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
                聚合市场、资金、监管和基金行业信息，不堆标题，不补写缺失数据。
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

        <IndustryBriefingPanel groups={briefingGroups} />

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
