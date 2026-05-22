import React, { useState } from 'react';

import {
  fetchQuantAnalysis,
  getCachedQuantAnalysis,
  type QuantAnalysisFundItem,
  type QuantAnalysisResponse,
  type QuantSignal,
} from '../services/quantAnalysis';
import { interpretQuantAnalysis } from '../services/quantInterpretation';
import { useSettings } from '../services/SettingsContext';
import { resolveAiRuntimeConfigByBusiness } from '../services/aiProviderConfig';
import { Icons } from './Icon';
import { ModalShell } from './ModalShell';

const signalClassMap: Record<QuantSignal, string> = {
  积极: 'text-red-500 bg-red-500/10 border-red-500/20',
  偏积极: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  观望: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  偏谨慎: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  谨慎: 'text-green-600 bg-green-500/10 border-green-500/20',
};

const formatPct = (value: number | undefined) => {
  if (value === undefined) return '缺失';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatRatio = (value: number | undefined) => {
  if (value === undefined) return '缺失';
  return value.toFixed(2);
};

const MetricPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-[var(--app-shell-line)] bg-[var(--app-shell-panel-strong)] px-3 py-2">
    <div className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 dark:text-gray-500">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-gray-100">{value}</div>
  </div>
);

const FundMetricRow: React.FC<{ item: QuantAnalysisFundItem }> = ({ item }) => (
  <div className="rounded-2xl border border-[var(--app-shell-line)] bg-white/55 p-4 dark:bg-white/[0.04]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900 dark:text-gray-50">{item.name}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
          {item.code} · {item.categoryLabel}/{item.marketLabel} · {item.benchmarkText}
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${signalClassMap[item.signal]}`}
      >
        {item.signal}
      </span>
    </div>
    {item.dataStatus !== 'available' ? (
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-gray-400">{item.reason}</p>
    ) : (
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <MetricPill label="20日" value={formatPct(item.metrics.return20d)} />
        <MetricPill label="60日" value={formatPct(item.metrics.return60d)} />
        <MetricPill label="120日年化" value={formatPct(item.metrics.annualizedReturn120d)} />
        <MetricPill label="MA20" value={formatPct(item.metrics.distanceToMa20Pct)} />
        <MetricPill label="回撤" value={formatPct(item.metrics.maxDrawdown120d)} />
        <MetricPill label="波动" value={formatPct(item.metrics.volatility60d)} />
        <MetricPill label="胜率" value={formatPct(item.metrics.positiveDayRate60d)} />
        <MetricPill label="夏普 proxy" value={formatRatio(item.metrics.sharpe120dProxy)} />
      </div>
    )}
    <div className="mt-3 text-xs text-slate-500 dark:text-gray-400">
      {item.trendLabel} · {item.valuationLabel}
      {item.valuationPositionPct !== undefined ? `（历史位置 ${item.valuationPositionPct.toFixed(0)}%）` : ''}
    </div>
  </div>
);

export const QuantAnalysisCard: React.FC = () => {
  const settings = useSettings();
  const aiRuntime = resolveAiRuntimeConfigByBusiness(settings, 'aiHoldingsAnalysis');
  const [analysis, setAnalysis] = useState<QuantAnalysisResponse | null>(() => getCachedQuantAnalysis());
  const [isLoading, setIsLoading] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [interpretationError, setInterpretationError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const loadAnalysis = async (force = false) => {
    setIsLoading(true);
    const next = await fetchQuantAnalysis(force);
    if (next) setAnalysis(next);
    setIsLoading(false);
  };

  const portfolio = analysis?.portfolio;
  const openDetails = () => {
    setIsOpen(true);
    if (!analysis) void loadAnalysis(false);
  };

  const loadInterpretation = async (force = false) => {
    const shouldRefreshAnalysis =
      force || !analysis || analysis.portfolio.availableCount < analysis.portfolio.totalCount;
    const current = await fetchQuantAnalysis(shouldRefreshAnalysis);
    if (!current) {
      setInterpretationError('量化数据读取失败，暂不能生成 AI 解读。');
      return;
    }
    if (!analysis) setAnalysis(current);
    if (!aiRuntime.apiKey) {
      setInterpretationError('请先在设置中填写 AI 接口密钥。');
      window.dispatchEvent(new CustomEvent('open-ai-settings'));
      return;
    }

    setIsInterpreting(true);
    setInterpretationError('');
    try {
      const text = await interpretQuantAnalysis(current, aiRuntime, { force });
      setInterpretation(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      const friendlyMessageMap: Record<string, string> = {
        MISSING_API_KEY: '请先在设置中填写 AI 接口密钥。',
        MISSING_MODEL: '请先在设置中选择或填写 AI 模型。',
        MISSING_BASE_URL: '请先在设置中填写兼容接口服务地址。',
        EMPTY_LLM_CONTENT: 'AI 返回内容为空，请稍后重试或更换模型。',
      };
      setInterpretationError(friendlyMessageMap[message] ?? `AI 量化解读失败：${message}`);
    } finally {
      setIsInterpreting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDetails}
        className="glass-card group flex flex-col justify-center rounded-[1.75rem] px-5 py-5 text-left transition-transform hover:-translate-y-0.5 md:px-6 md:py-6"
      >
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-none dark:border-transparent dark:bg-emerald-500/15 dark:text-emerald-200">
              <Icons.Chart size={22} />
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 dark:text-gray-500">
                量化信号
              </div>
              <div className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-gray-50">
                <span>{portfolio?.signal ?? '读取中'}</span>
                {portfolio ? (
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${signalClassMap[portfolio.signal]}`}>
                    {portfolio.score.toFixed(2)}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-[13px] text-slate-500 dark:text-gray-400">
                {portfolio
                  ? `覆盖 ${portfolio.availableCount}/${portfolio.totalCount} 只 · 夏普proxy ${formatRatio(portfolio.riskReturn.sharpe120dProxy)}`
                  : isLoading
                    ? '正在读取量化分析'
                    : '点击查看组合量化分析'}
              </div>
            </div>
          </div>
          <Icons.ArrowUp
            size={18}
            className="rotate-90 text-slate-400 transition-transform group-hover:translate-x-1 dark:text-gray-500"
          />
        </div>
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        overlayId="quant-analysis-modal"
        className="w-full overflow-hidden rounded-t-3xl border border-[var(--app-shell-line)] shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        <div className="max-h-[88vh] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 dark:text-gray-500">
                组合量化分析
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {portfolio?.signal ?? '量化数据读取中'}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                {analysis?.note ?? '基于历史净值生成客观量化信号，不构成投资建议。'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAnalysis(true)}
              className="rounded-full border border-[var(--app-shell-line)] px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-[var(--app-shell-panel-strong)] dark:text-gray-300"
            >
              {isLoading ? '刷新中' : '刷新'}
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--app-shell-line)] bg-[var(--app-shell-panel-strong)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-gray-100">AI 量化解读</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                  只解释当前量化 JSON，不生成新数据。
                </div>
              </div>
              <button
                type="button"
                onClick={() => void loadInterpretation(Boolean(interpretation))}
                className="shrink-0 rounded-full border border-[var(--app-shell-line)] px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/70 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {isInterpreting ? '解读中' : interpretation ? '重新解读' : '生成解读'}
              </button>
            </div>
            {interpretationError ? (
              <p className="mt-3 text-xs leading-5 text-rose-500">{interpretationError}</p>
            ) : null}
            {interpretation ? (
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-gray-200">
                {interpretation}
              </div>
            ) : null}
          </div>

          {portfolio ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricPill label="评分" value={portfolio.score.toFixed(2)} />
              <MetricPill label="覆盖" value={`${portfolio.availableCount}/${portfolio.totalCount}`} />
              <MetricPill label="波动" value={formatPct(portfolio.riskReturn.volatility60d)} />
              <MetricPill label="回撤" value={formatPct(portfolio.riskReturn.maxDrawdown120d)} />
              <MetricPill label="夏普 proxy" value={formatRatio(portfolio.riskReturn.sharpe120dProxy)} />
              <MetricPill label="60日胜率" value={formatPct(portfolio.riskReturn.positiveDayRate60d)} />
              <MetricPill label="资产覆盖" value={formatPct(portfolio.coveragePct)} />
            </div>
          ) : null}

          <div className="mt-5 space-y-5">
            {analysis?.groups.map((group) => (
              <section key={group.title}>
                <div className="mb-2 text-sm font-semibold text-slate-800 dark:text-gray-100">
                  {group.title}
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <FundMetricRow key={`${group.title}-${item.code}`} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </ModalShell>
    </>
  );
};
