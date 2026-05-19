import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

ed.hashes.sha512 = (...messages) => sha512(ed.etc.concatBytes(...messages));

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  GITHUB_TOKEN: string;
  GIST_ID: string;
  GIST_FILENAME?: string;
  AI_PROVIDER?: 'openai' | 'gemini' | 'deepseek' | 'customOpenAi';
  AI_API_KEY: string;
  AI_MODEL: string;
  AI_BASE_URL?: string;
  AI_MODE?: 'quick' | 'deep' | 'risk';
  AI_QUESTION?: string;
  CRON_SECRET?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  MARKET_ANALYSIS_ENABLED?: string;
  MARKET_INDEX_CODES?: string;
  NEWS_ANALYSIS_ENABLED?: string;
  NEWS_PROVIDER?: 'eastmoney' | 'sina' | 'mixed';
  NEWS_LOOKBACK_HOURS?: string;
  NEWS_MAX_ITEMS?: string;
  NEWS_QUERY_TIMEOUT_MS?: string;
  QQ_OFFICIAL_ENABLED?: string;
  QQ_OFFICIAL_APP_ID?: string;
  QQ_OFFICIAL_APP_SECRET?: string;
  QQ_OFFICIAL_ALLOWED_GROUP_OPENIDS?: string;
  QQ_OFFICIAL_ALLOWED_MEMBER_OPENIDS?: string;
  QQ_BOT_ENABLED?: string;
  QQ_BOT_API_BASE?: string;
  QQ_BOT_ACCESS_TOKEN?: string;
  QQ_ALLOWED_GROUP_IDS?: string;
  QQ_ALLOWED_USER_IDS?: string;
}

interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

type ScheduledAnalysisType = 'midday' | 'lateSession' | 'close';

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface FundBackupPayload {
  version: number;
  exportDate: string;
  funds: BackupFund[];
  watchlists?: BackupWatchlistItem[];
  investmentProfile?: InvestmentProfileSnapshot;
}

interface InvestmentProfileSnapshot {
  riskTolerance?: string;
  investmentHorizon?: string;
  externalAssets?: string;
  notes?: string;
}

interface BackupFund {
  code: string;
  name: string;
  platform: string;
  holdingShares: number;
  costPrice: number;
  currentNav: number;
  lastUpdate: string;
  dayChangePct: number;
  dayChangeVal: number;
  estimatedDayChangePct?: number;
  todayChangeIsEstimated?: boolean;
  todayChangeUnavailable?: boolean;
  todayChangePreOpen?: boolean;
  buyDate?: string;
  buyTime?: 'before15' | 'after15';
  settlementDays?: number;
}

interface BackupWatchlistItem {
  code: string;
  name: string;
  type: 'fund' | 'index';
  platform?: string;
  anchorPrice: number;
  anchorDate: string;
  currentPrice: number;
  dayChangePct: number;
  lastUpdate: string;
}

interface BuildCandidateSnapshotItem {
  code: string;
  name: string;
  platform?: string;
  source: 'watchlist' | 'fundFlowFallback';
  matchedFlowTheme?: string;
  reason?: string;
  currentPrice: number;
  dayChangePct: number;
  anchorPrice: number;
  anchorDate: string;
  lastUpdate: string;
  anchorChangePct: number;
}

interface FundHoldingsApiResponse {
  data?: {
    portfolioDate?: string;
    equityHoldings?: Array<{
      ticker?: string;
      name?: string;
      weight?: number;
      sector?: string;
    }>;
  };
}

interface EastMoneyLatestNavSnapshot {
  nav: number;
  navDate: string;
  navChangePercent: number;
  previousNav?: number;
}

interface FundHistoricalNavPoint {
  nav: number;
  navDate: string;
}

interface FundQuantSignalSnapshot {
  dataStatus: 'available' | 'insufficient' | 'failed';
  score: number;
  signal: '积极' | '偏积极' | '观望' | '偏谨慎' | '谨慎';
  momentumScore?: number;
  riskScore?: number;
  valuationScore?: number;
  valuationStatus: 'missing';
  return20d?: number;
  return60d?: number;
  return120d?: number;
  volatility60d?: number;
  maxDrawdown120d?: number;
  sampleSize: number;
  reason: string;
}

interface FundHoldingsEnrichmentSnapshot {
  status: 'available' | 'missing' | 'failed';
  portfolioDate?: string;
  topEquityHoldings?: HoldingEquitySnapshot[];
}

interface SnapshotBuildOptions {
  holdingsTimeoutMs?: number;
  quantMode?: 'cachedOnly' | 'full';
}

interface IntradayProfitFundSnapshot {
  code: string;
  name: string;
  holdingShares: number;
  marketValue: number;
  dayChangePct: number;
  dayChangeVal: number;
  source: '盘中估算' | '官方净值' | '估值不可用' | '盘前未估算';
  navDate?: string;
  coveragePct?: number;
}

interface HoldingEquitySnapshot {
  ticker: string;
  name: string;
  weight: number;
  sector?: string;
}

interface EquityOverlapItem {
  ticker: string;
  name: string;
  fundCount: number;
  funds: string[];
  maxWeight: number;
  totalWeight: number;
}

interface UnderlyingExposureItem {
  theme: string;
  marketValue: number;
  portfolioPct: number;
  topHoldings: Array<{
    ticker: string;
    name: string;
    exposure: number;
    portfolioPct: number;
    funds: string[];
  }>;
}

interface PortfolioRiskRadarItem {
  key: 'concentration' | 'overlap' | 'themeExposure' | 'quantWeakness' | 'volatility';
  label: string;
  level: 'low' | 'medium' | 'high';
  score: number;
  detail: string;
}

interface HoldingsDataCoverage {
  topEquityHoldings: 'available' | 'partial' | 'missing';
  industryDistribution: 'available' | 'partial' | 'missing';
  managerChanges: 'missing';
  externalAssets: 'available' | 'missing';
  riskProfile: 'available' | 'missing';
  investmentHorizon: 'available' | 'missing';
}

interface HoldingSnapshotItem {
  code: string;
  name: string;
  platform: string;
  holdingShares: number;
  costPrice: number;
  currentNav: number;
  marketValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPct: number;
  dayChangePct: number;
  dayChangeVal: number;
  lastUpdate: string;
  buyDate?: string;
  buyTime?: 'before15' | 'after15';
  settlementDays?: number;
  topEquityHoldings?: HoldingEquitySnapshot[];
  holdingsDataStatus?: 'available' | 'missing' | 'failed';
  holdingsDataDate?: string;
  quantSignal?: FundQuantSignalSnapshot;
}

interface HoldingsSnapshot {
  asOf: string;
  currency: string;
  totalAssets: number;
  totalDayGain: number;
  totalDayGainPct: number;
  holdingGain: number;
  holdingGainPct: number;
  holdings: HoldingSnapshotItem[];
  buildCandidates: BuildCandidateSnapshotItem[];
  fallbackBuildCandidates: BuildCandidateSnapshotItem[];
  heldFundCodes: string[];
  equityOverlap: EquityOverlapItem[];
  underlyingExposures: UnderlyingExposureItem[];
  quantSignals: FundQuantSignalSnapshot[];
  riskRadar: PortfolioRiskRadarItem[];
  dataCoverage: HoldingsDataCoverage;
  investmentProfile?: InvestmentProfileSnapshot;
}

interface MarketIndexSnapshot {
  code: string;
  name: string;
  price: number;
  changePct: number;
  change?: number;
  updateTime?: string;
}

interface MarketSnapshot {
  asOf: string;
  indices: MarketIndexSnapshot[];
  dataStatus: 'available' | 'partial' | 'missing';
}

interface NewsItemSnapshot {
  title: string;
  source?: string;
  url?: string;
  publishedAt?: string;
  language?: string;
}

interface NewsSnapshot {
  asOf: string;
  provider: 'eastmoney' | 'sina' | 'mixed';
  keywords: string[];
  lookbackHours: number;
  items: NewsItemSnapshot[];
  dataStatus: 'available' | 'missing' | 'failed';
  failedSources?: string[];
}

interface EastMoneyFundFlowResponse {
  data?: {
    diff?: Array<{
      f12?: string;
      f14?: string;
      f3?: number | string;
      f62?: number | string;
      f184?: number | string;
    }>;
  };
}

interface FundFlowItemSnapshot {
  code?: string;
  name: string;
  category: 'sector' | 'concept';
  netInflow: number;
  netInflowRank: number;
  changePct?: number;
  mainNetInflowPct?: number;
}

interface FundFlowSnapshot {
  asOf: string;
  provider: 'eastmoney';
  items: FundFlowItemSnapshot[];
  dataStatus: 'available' | 'partial' | 'missing' | 'failed';
  unavailableReason?: 'preMarketOrOffHours' | 'empty' | 'requestFailed';
  failedSources?: string[];
}

interface AnalysisContextSnapshot {
  holdings: HoldingsSnapshot;
  marketSnapshot?: MarketSnapshot;
  newsSnapshot?: NewsSnapshot;
  fundFlowSnapshot?: FundFlowSnapshot;
}

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
    };
  };
}

interface QqOfficialPayload {
  id?: string;
  op?: number;
  t?: string;
  d?: unknown;
}

interface QqOfficialValidationPayload {
  plain_token?: string;
  event_ts?: string;
}

interface QqOfficialGroupAtMessage {
  id?: string;
  content?: string;
  group_openid?: string;
  author?: {
    member_openid?: string;
  };
}

interface QqOfficialAccessTokenResponse {
  access_token?: string;
  expires_in?: string | number;
}

interface OneBotMessageEvent {
  post_type?: string;
  message_type?: string;
  group_id?: number | string;
  user_id?: number | string;
  raw_message?: string;
  message?: string | Array<unknown>;
}

interface GithubGistResponse {
  files?: Record<
    string,
    {
      content?: string;
      raw_url?: string;
    }
  >;
}

const GITHUB_API_VERSION = '2022-11-28';
const DEFAULT_GIST_FILENAME = 'fund-manager-sync.json';
const TELEGRAM_MESSAGE_LIMIT = 3900;
const MORNINGSTAR_API_BASE = 'https://www.morningstar.cn/cn-api';
const TENCENT_QUOTE_API = 'https://qt.gtimg.cn/q=';
const EASTMONEY_NEWS_API = 'https://np-listapi.eastmoney.com/comm/web/getNewsByColumns';
const EASTMONEY_FUND_FLOW_API = 'https://push2.eastmoney.com/api/qt/clist/get';
const SINA_FINANCE_ROLL_API = 'https://feed.mix.sina.com.cn/api/roll/get';
const QQ_OFFICIAL_API_BASE = 'https://api.sgroup.qq.com';
const QQ_OFFICIAL_ACCESS_TOKEN_API = 'https://bots.qq.com/app/getAppAccessToken';
const DEFAULT_NEWS_QUERY_TIMEOUT_MS = 5000;
const DEFAULT_FUND_FLOW_QUERY_TIMEOUT_MS = 3000;
const DEFAULT_FUND_HOLDINGS_TIMEOUT_MS = 5000;
const FAST_ANALYSIS_FUND_HOLDINGS_TIMEOUT_MS = 3000;
const FUND_HOLDINGS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_AI_QUESTION =
  '请基于当前持仓、A 股市场指数、市场情绪、中文财经新闻和投资画像，重点判断当前是否适合加仓、是否需要减仓、是否达到清仓条件。请给出明确但条件化的结论、依据、触发条件和观察点；收盘后才写明日观察点，收盘前写今日观察点。';
const SHORT_ANALYSIS_QUESTION =
  '请输出简短但全面的 Telegram/QQ 短版分析，控制在 500 字以内，最多 6 行或 6 个短段，不展开长篇推理，不解释计算过程。必须按固定结构输出：结论、加仓、减仓/清仓、建仓主题、风险、数据。结论先用一句话说明当前是否适合追涨或加仓。加仓只能从当前已持有基金中判断；如果没有合适候选，写“今日暂无适合加仓的基金”。建仓主题只推荐主题方向，不输出具体基金名称或基金代码；如果没有明确主题，写“今日暂无明确建仓主题，仅做观察”。风险只列 1-2 个最大风险。数据行简要标注市场、资金流、新闻、量化、底层持仓是否可用和数据时间；缺失数据必须说明，不得编造。最终回复不得出现 buildCandidates、fallbackBuildCandidates、fundFlowSnapshot、holdings 等内部字段名。';
const DETAILED_ANALYSIS_QUESTION = DEFAULT_AI_QUESTION;
const MIDDAY_ANALYSIS_QUESTION =
  '请输出午盘休息分析，控制在 1000 字以内。重点总结上午市场情绪、A 股指数强弱、资金流入最强方向、中文财经新闻利好/风险，并判断下午是否适合观察、低吸、小额试探或暂不操作。建仓主题观察只推荐主题方向，不输出具体基金名称或基金代码；主题可以和已有持仓重合。如果没有明确主题，必须输出“午盘建仓主题观察”，给出 1-3 个下午观察方向和触发条件，不得硬写买入建议。午盘不做激进操作建议，不要建议清仓。最终回复不得出现 buildCandidates、fallbackBuildCandidates、fundFlowSnapshot、holdings 等内部字段名。';
const LATE_SESSION_ACTION_QUESTION =
  '请输出尾盘半小时操作提醒，控制在 1000 字以内。重点服务 14:50 前是否加仓、是否减仓、是否有建仓主题观察方向。必须结合 A 股市场情绪、资金流入最强方向、中文财经新闻利好/风险、当前持仓涨跌和投资画像。结论要明确但条件化，例如“只适合小额加仓/暂不加仓/需要小幅减仓/继续观察”。建仓主题观察只推荐主题方向，不输出具体基金名称或基金代码；主题可以和已有持仓重合。不轻易建议清仓；如果没有明确建仓主题，必须输出“尾盘建仓主题观察”，给出观察方向、触发条件和放弃条件，不得硬写买入建议。最终回复不得出现 buildCandidates、fallbackBuildCandidates、fundFlowSnapshot、holdings 等内部字段名。';
const CLOSE_ANALYSIS_QUESTION =
  '请输出收盘分析，控制在 1200 字以内。总结全天市场情绪、资金流入最强方向、中文财经新闻影响、持仓表现、今日建仓主题观察/加仓/减仓判断和后续观察点。收盘分析重点是复盘和明日触发条件，不要编造缺失数据。建仓主题观察只推荐主题方向，不输出具体基金名称或基金代码；主题可以和已有持仓重合。如果没有明确主题，必须输出“明日建仓主题观察”，给出 1-3 个观察方向、触发条件和放弃条件，不得硬写买入建议。最终回复不得出现 buildCandidates、fallbackBuildCandidates、fundFlowSnapshot、holdings 等内部字段名。';
const SCHEDULED_ANALYSIS_CONFIG: Record<
  ScheduledAnalysisType,
  { title: string; question: string; maxLength?: number }
> = {
  midday: {
    title: '养基AI午盘休息分析',
    question: MIDDAY_ANALYSIS_QUESTION,
    maxLength: 1400,
  },
  lateSession: {
    title: '养基AI尾盘操作提醒',
    question: LATE_SESSION_ACTION_QUESTION,
    maxLength: 1400,
  },
  close: {
    title: '养基AI收盘分析',
    question: CLOSE_ANALYSIS_QUESTION,
    maxLength: 1600,
  },
};
const COMMAND_QUESTION_MAP: Record<string, { question: string; maxLength?: number }> = {
  分析: { question: SHORT_ANALYSIS_QUESTION, maxLength: 900 },
  市场分析: { question: SHORT_ANALYSIS_QUESTION, maxLength: 900 },
  详细分析: { question: DETAILED_ANALYSIS_QUESTION },
  加仓: {
    question:
      '请只回答当前是否适合加仓，控制在 1000 字以内。加仓候选只能从 holdings 当前已持有基金中选择，不能从 buildCandidates 中选择。请结合 A 股市场、中文财经新闻、持仓盈亏、仓位集中度、底层重合度和投资画像，给出结论、依据、触发条件和不适合加仓的风险。如果没有合适加仓候选，明确写“今日暂无适合加仓的基金”。',
    maxLength: 1200,
  },
  建仓: {
    question:
      '请只回答今天哪个主题方向最值得建仓观察，控制在 1000 字以内。建仓观察只推荐主题方向，不输出具体基金名称或基金代码；主题可以和已有持仓重合，因为这是主题强弱判断，不是具体基金推荐。必须先判断市场情绪，再提取今日利好方向和风险方向，并结合资金流入最强方向；如果资金流数据缺失或失败，必须说明“资金流数据暂不可用，本次仅基于市场情绪和新闻利好判断”，不得编造资金流。如果没有满足建仓观察条件的主题，必须输出“今日暂无明确建仓主题，仅做观察”。请按“市场情绪、今日利好方向、资金流入最强方向、今日建仓主题观察、观察方式、放弃观察条件”输出，不得把主题观察写成现在立即买入，最终回复不得出现 buildCandidates、fallbackBuildCandidates、fundFlowSnapshot、holdings、heldFundCodes 等内部字段名。',
    maxLength: 1200,
  },
  减仓: {
    question:
      '请只回答当前是否需要减仓，控制在 1000 字以内。必须结合 A 股市场、中文财经新闻、持仓盈亏、重合度和投资画像，给出结论、依据、触发条件和暂不减仓的条件。',
    maxLength: 1200,
  },
  清仓: {
    question:
      '请只回答当前是否达到清仓条件，控制在 1000 字以内。清仓判断必须严格，不能只因为单日涨跌；必须结合长期逻辑失效、风格偏离、风险画像冲突、重合度过高或明确止盈止损条件。',
    maxLength: 1200,
  },
};
const TELEGRAM_ANALYSIS_COMMANDS = Object.keys(COMMAND_QUESTION_MAP);
const PROFIT_COMMANDS = ['今日盈利', '今日收益'];
const INTRADAY_PROFIT_COMMANDS = ['今日盘中实时收益', '盘中实时收益', '盘中收益', '实时收益'];
const DETAILED_INTRADAY_PROFIT_COMMANDS = ['详细盘中收益', '详细实时收益'];
const QUANT_ANALYSIS_COMMANDS = ['量化分析', '量化信号', '基金量化'];
const TELEGRAM_HELP_TEXT =
  '发送“分析”获取短版判断；发送“量化分析”获取客观量化信号；发送“详细分析”获取完整分析；也可发送“建仓”“加仓”“减仓”“清仓”获取专项判断。';
const TELEGRAM_ANALYSIS_PENDING_TEXT = '收到，正在结合市场情绪、资金流和持仓分析...';
const QUANT_SIGNAL_CACHE_TTL_MS = 60 * 60 * 1000;
const QUANT_NAV_PAGE_SIZE = 20;
const QUANT_NAV_TARGET_SIZE = 140;
const QUANT_NAV_MAX_PAGES = 8;
const quantSignalCache = new Map<string, { expiresAt: number; signal: FundQuantSignalSnapshot }>();
const fundHoldingsCache = new Map<string, { expiresAt: number; enrichment: FundHoldingsEnrichmentSnapshot }>();
const DEFAULT_MARKET_INDEX_CODES = [
  'sh000001',
  'sz399001',
  'sz399006',
  'sh000300',
  'sh000016',
  'sh000905',
  'sh000852',
  'sh000688',
];
const MARKET_INDEX_NAMES: Record<string, string> = {
  sh000001: '上证指数',
  sz399001: '深证成指',
  sz399006: '创业板指',
  sh000300: '沪深300',
  sh000016: '上证50',
  sh000905: '中证500',
  sh000852: '中证1000',
  sh000688: '科创50',
};
const FUND_FLOW_FALLBACK_CANDIDATES: Array<{
  keywords: string[];
  code: string;
  name: string;
  reason: string;
}> = [
  {
    keywords: ['人工智能', 'ai', '软件', '计算机', '数字', '芯片', '半导体', '电子', '元件', 'pcb', '印制电路板'],
    code: '017811',
    name: '东方人工智能主题混合C',
    reason: '匹配 AI/计算机/半导体方向资金流',
  },
  {
    keywords: ['半导体', '芯片', '电子', '元件', 'pcb', '印制电路板', '集成电路'],
    code: '012969',
    name: '国泰中证半导体材料设备主题ETF联接C',
    reason: '匹配半导体设备与电子产业链资金流',
  },
  {
    keywords: ['新能源', '电池', '光伏', '锂电', '储能', '低碳', '电力设备'],
    code: '012103',
    name: '国寿安保低碳经济混合C',
    reason: '匹配新能源/低碳方向资金流',
  },
  {
    keywords: ['创新', '创业板', '科创', '成长', '自动化设备', '机器人', '高端制造'],
    code: '501205',
    name: '鹏华创新未来混合(LOF)C',
    reason: '匹配科技成长与高端制造方向资金流',
  },
  {
    keywords: ['消费', '食品饮料', '白酒', '医药', '医疗'],
    code: '012414',
    name: '招商中证白酒指数C',
    reason: '匹配消费/食品饮料方向资金流',
  },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const requireEnv = (env: Env, key: keyof Env): string => {
  const value = env[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`缺少环境变量 ${key}`);
  }
  return value.trim();
};

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const isEnabled = (value: string | undefined, defaultValue = true) => {
  if (value === undefined) return defaultValue;
  return value.trim().toLowerCase() !== 'false';
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseCsvSet = (value: string | undefined) =>
  new Set(
    (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

const getChinaMarketPhase = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  const minutes = hour * 60 + minute;

  if (minutes < 9 * 60 + 30) return 'preMarket';
  if (minutes < 11 * 60 + 30) return 'morningSession';
  if (minutes < 13 * 60) return 'middayBreak';
  if (minutes < 15 * 60) return 'afternoonSession';
  return 'postClose';
};

const CHINA_MARKET_PHASE_LABELS: Record<ReturnType<typeof getChinaMarketPhase>, string> = {
  preMarket: '盘前',
  morningSession: '上午交易中',
  middayBreak: '午间休市',
  afternoonSession: '下午交易中',
  postClose: '收盘后',
};

const textEncoder = new TextEncoder();

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const hexToBytes = (hex: string) => {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error('无效的十六进制字符串');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const fetchText = async (url: string, init: RequestInit, label: string): Promise<string> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${label} 请求失败: ${response.status} ${text}`.trim());
  }
  return response.text();
};

const fetchTextWithTimeout = async (
  url: string,
  init: RequestInit,
  label: string,
  timeoutMs: number,
): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchText(url, { ...init, signal: controller.signal }, label);
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJson = async <T>(url: string, init: RequestInit, label: string): Promise<T> => {
  const text = await fetchText(url, init, label);
  return JSON.parse(text) as T;
};

const fetchJsonWithTimeout = async <T>(
  url: string,
  init: RequestInit,
  label: string,
  timeoutMs: number,
): Promise<T> => {
  const text = await fetchTextWithTimeout(url, init, label, timeoutMs);
  return JSON.parse(text) as T;
};

const logStepDuration = (label: string, startedAt: number) => {
  console.info(`${label} 耗时 ${Date.now() - startedAt}ms`);
};

const buildQqOfficialSeed = (secret: string) => {
  let seed = secret;
  while (seed.length < 32) seed += seed;
  return textEncoder.encode(seed.slice(0, 32));
};

const signQqOfficialMessage = async (secret: string, message: string) => {
  return bytesToHex(await ed.sign(textEncoder.encode(message), buildQqOfficialSeed(secret)));
};

const verifyQqOfficialSignature = async (env: Env, rawBody: string, request: Request) => {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  if (!signature || !timestamp) return false;
  try {
    const secret = requireEnv(env, 'QQ_OFFICIAL_APP_SECRET');
    const publicKey = await ed.getPublicKey(buildQqOfficialSeed(secret));
    return await ed.verify(hexToBytes(signature), textEncoder.encode(`${timestamp}${rawBody}`), publicKey);
  } catch {
    return false;
  }
};

const buildQqOfficialValidationResponse = async (env: Env, data: QqOfficialValidationPayload) => {
  const plainToken = data.plain_token?.trim();
  const eventTs = data.event_ts?.trim();
  if (!plainToken || !eventTs) throw new Error('QQ 回调验证参数缺失');
  const signature = await signQqOfficialMessage(
    requireEnv(env, 'QQ_OFFICIAL_APP_SECRET'),
    `${eventTs}${plainToken}`,
  );
  return { plain_token: plainToken, signature };
};

const fetchQqOfficialAccessToken = async (env: Env) => {
  const response = await fetchJson<QqOfficialAccessTokenResponse>(
    QQ_OFFICIAL_ACCESS_TOKEN_API,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: requireEnv(env, 'QQ_OFFICIAL_APP_ID'),
        clientSecret: requireEnv(env, 'QQ_OFFICIAL_APP_SECRET'),
      }),
    },
    '获取 QQ 官方 access_token',
  );
  if (!response.access_token) throw new Error('QQ 官方 access_token 为空');
  return response.access_token;
};

const sendQqOfficialGroupMessage = async (params: {
  env: Env;
  groupOpenid: string;
  content: string;
  msgId: string;
  msgSeq: number;
}) => {
  const accessToken = await fetchQqOfficialAccessToken(params.env);
  await fetchJson<unknown>(
    `${QQ_OFFICIAL_API_BASE}/v2/groups/${params.groupOpenid}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `QQBot ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: params.content,
        msg_type: 0,
        msg_id: params.msgId,
        msg_seq: params.msgSeq,
      }),
    },
    '发送 QQ 官方群消息',
  );
  return 1;
};

const sendQqOfficialGroupTextChunks = async (params: {
  env: Env;
  groupOpenid: string;
  text: string;
  msgId: string;
  startSeq: number;
}) => {
  const chunks = splitTelegramMessage(params.text);
  let sentMessages = 0;
  for (const [index, chunk] of chunks.entries()) {
    sentMessages += await sendQqOfficialGroupMessage({
      env: params.env,
      groupOpenid: params.groupOpenid,
      content: chunk,
      msgId: params.msgId,
      msgSeq: params.startSeq + index,
    });
  }
  return sentMessages;
};

const getOneBotAuthHeaders = (env: Env) => {
  const token = env.QQ_BOT_ACCESS_TOKEN?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const sendOneBotGroupMessage = async (env: Env, groupId: string, message: string) => {
  const apiBase = requireEnv(env, 'QQ_BOT_API_BASE').replace(/\/$/, '');
  await fetchJson<unknown>(
    `${apiBase}/send_group_msg`,
    {
      method: 'POST',
      headers: {
        ...getOneBotAuthHeaders(env),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ group_id: Number.isFinite(Number(groupId)) ? Number(groupId) : groupId, message }),
    },
    '发送 QQ 群消息',
  );
  return 1;
};

const sendOneBotGroupTextChunks = async (env: Env, groupId: string, text: string) => {
  const chunks = splitTelegramMessage(text);
  let sentMessages = 0;
  for (const chunk of chunks) {
    sentMessages += await sendOneBotGroupMessage(env, groupId, chunk);
  }
  return sentMessages;
};

const readGistBackup = async (env: Env): Promise<FundBackupPayload> => {
  const token = requireEnv(env, 'GITHUB_TOKEN');
  const gistId = requireEnv(env, 'GIST_ID');
  const filename = env.GIST_FILENAME?.trim() || DEFAULT_GIST_FILENAME;

  const gist = await fetchJson<GithubGistResponse>(
    `https://api.github.com/gists/${gistId}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
        'User-Agent': 'fund-manager-telegram-ai-reminder',
      },
    },
    '读取 Gist',
  );

  const file = gist.files?.[filename];
  if (!file) {
    throw new Error(`Gist 中未找到 ${filename}`);
  }

  const content =
    typeof file.content === 'string'
      ? file.content
      : file.raw_url
        ? await fetchText(
            file.raw_url,
            {
              cache: 'no-store',
              headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${token}`,
                'X-GitHub-Api-Version': GITHUB_API_VERSION,
                'User-Agent': 'fund-manager-telegram-ai-reminder',
              },
            },
            '读取 Gist raw 文件',
          )
        : '';
  if (!content) {
    throw new Error(`Gist 文件 ${filename} 内容为空`);
  }

  const payload = JSON.parse(content) as Partial<FundBackupPayload>;
  if (payload.version !== 1 || !Array.isArray(payload.funds)) {
    throw new Error('Gist 内容不是有效的 fund-manager 备份');
  }

  return payload as FundBackupPayload;
};

const fetchFundHoldings = async (
  fundCode: string,
  timeoutMs = DEFAULT_FUND_HOLDINGS_TIMEOUT_MS,
): Promise<FundHoldingsApiResponse | null> => {
  try {
    return await fetchJsonWithTimeout<FundHoldingsApiResponse>(
      `${MORNINGSTAR_API_BASE}/v2/funds/${fundCode}/holdings`,
      { headers: { Accept: 'application/json' } },
      `读取基金 ${fundCode} 持仓`,
      timeoutMs,
    );
  } catch (error) {
    console.warn(`读取基金 ${fundCode} 前十大持仓失败`, error);
    return null;
  }
};

const fetchFundHoldingsEnrichment = async (
  fundCode: string,
  timeoutMs = DEFAULT_FUND_HOLDINGS_TIMEOUT_MS,
): Promise<FundHoldingsEnrichmentSnapshot> => {
  const cached = fundHoldingsCache.get(fundCode);
  if (cached && cached.expiresAt > Date.now()) return cached.enrichment;

  const response = await fetchFundHoldings(fundCode, timeoutMs);
  const equities = response?.data?.equityHoldings ?? [];
  if (!response) return { status: 'failed' as const };
  if (equities.length === 0) return { status: 'missing' as const };

  const enrichment = {
    status: 'available' as const,
    portfolioDate: response.data?.portfolioDate,
    topEquityHoldings: equities.slice(0, 10).map((holding) => ({
      ticker: holding.ticker || '',
      name: holding.name || holding.ticker || '',
      weight: round(Number(holding.weight || 0), 4),
      sector: holding.sector,
    })),
  };
  fundHoldingsCache.set(fundCode, { expiresAt: Date.now() + FUND_HOLDINGS_CACHE_TTL_MS, enrichment });
  return enrichment;
};

const getChinaDateString = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

const fetchEastMoneyLatestNavForWorker = async (
  fundCode: string,
): Promise<EastMoneyLatestNavSnapshot | null> => {
  try {
    const text = await fetchText(
      `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=${fundCode}&page=1&per=2&rt=${Date.now()}`,
      { headers: { Accept: '*/*' } },
      `读取基金 ${fundCode} 最新净值`,
    );
    const rowRegex =
      /<tr>\s*<td>(\d{4}-\d{2}-\d{2})<\/td>\s*<td[^>]*>([\d.]+)<\/td>\s*<td[^>]*>[\d.]+<\/td>\s*<td[^>]*>([-\d.]+)%?<\/td>/g;
    const rows = Array.from(text.matchAll(rowRegex));
    const latestRow = rows[0];
    if (!latestRow) return null;
    const previousRow = rows[1];

    return {
      navDate: latestRow[1],
      nav: Number.parseFloat(latestRow[2]),
      navChangePercent: Number.parseFloat(latestRow[3]) || 0,
      previousNav: previousRow?.[2] ? Number.parseFloat(previousRow[2]) : undefined,
    };
  } catch (error) {
    console.warn(`读取基金 ${fundCode} 最新净值失败`, error);
    return null;
  }
};

const parseEastMoneyHistoricalNavRows = (text: string): FundHistoricalNavPoint[] => {
  const rowRegex =
    /<tr>\s*<td>(\d{4}-\d{2}-\d{2})<\/td>\s*<td[^>]*>([\d.]+)<\/td>\s*<td[^>]*>[\d.]+<\/td>\s*<td[^>]*>[-\d.]+%?<\/td>/g;
  return Array.from(text.matchAll(rowRegex))
    .map<FundHistoricalNavPoint | null>((row) => {
      const nav = Number.parseFloat(row[2]);
      if (!Number.isFinite(nav) || nav <= 0) return null;
      return { navDate: row[1], nav };
    })
    .filter((item): item is FundHistoricalNavPoint => Boolean(item));
};

const fetchFundHistoricalNavForQuant = async (fundCode: string): Promise<FundHistoricalNavPoint[]> => {
  const navs: FundHistoricalNavPoint[] = [];
  const seenDates = new Set<string>();

  try {
    for (let page = 1; page <= QUANT_NAV_MAX_PAGES && navs.length < QUANT_NAV_TARGET_SIZE; page += 1) {
      const text = await fetchText(
        `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=${fundCode}&page=${page}&per=${QUANT_NAV_PAGE_SIZE}&rt=${Date.now()}`,
        { headers: { Accept: '*/*' } },
        `读取基金 ${fundCode} 历史净值第 ${page} 页`,
      );
      const rows = parseEastMoneyHistoricalNavRows(text);
      if (rows.length === 0) break;

      rows.forEach((point) => {
        if (seenDates.has(point.navDate) || navs.length >= QUANT_NAV_TARGET_SIZE) return;
        seenDates.add(point.navDate);
        navs.push(point);
      });
    }

    return navs;
  } catch (error) {
    console.warn(`读取基金 ${fundCode} 历史净值失败`, error);
    return navs;
  }
};

const calculatePeriodReturnPct = (navs: FundHistoricalNavPoint[], days: number) => {
  const latest = navs[0];
  const base = navs[days];
  if (!latest || !base || base.nav <= 0) return undefined;
  return round(((latest.nav / base.nav) - 1) * 100);
};

const calculateAnnualizedVolatilityPct = (navs: FundHistoricalNavPoint[], days: number) => {
  const window = navs.slice(0, days + 1);
  if (window.length < 21) return undefined;

  const returns = window.slice(0, -1).map((point, index) => {
    const previous = window[index + 1];
    return previous.nav > 0 ? point.nav / previous.nav - 1 : 0;
  });
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(252) * 100);
};

const calculateMaxDrawdownPct = (navs: FundHistoricalNavPoint[], days: number) => {
  const ordered = navs.slice(0, days).reverse();
  if (ordered.length < 21) return undefined;

  let peak = ordered[0].nav;
  let maxDrawdown = 0;
  ordered.forEach((point) => {
    peak = Math.max(peak, point.nav);
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, point.nav / peak - 1);
  });
  return round(maxDrawdown * 100);
};

const scoreMomentum = (return20d?: number, return60d?: number, return120d?: number) => {
  const weightedReturn =
    (return20d ?? 0) * 0.5 + (return60d ?? return20d ?? 0) * 0.3 + (return120d ?? return60d ?? 0) * 0.2;
  return round(clamp(weightedReturn / 8, -2, 2));
};

const scoreRisk = (volatility60d?: number, maxDrawdown120d?: number) => {
  let score = 0;
  if (volatility60d !== undefined) {
    if (volatility60d <= 12) score += 1;
    else if (volatility60d <= 20) score += 0.5;
    else if (volatility60d <= 30) score += 0;
    else if (volatility60d <= 45) score -= 0.8;
    else score -= 1.2;
  }

  if (maxDrawdown120d !== undefined) {
    const drawdown = Math.abs(maxDrawdown120d);
    if (drawdown <= 8) score += 0.8;
    else if (drawdown <= 15) score += 0.3;
    else if (drawdown <= 25) score -= 0.5;
    else score -= 1;
  }

  return round(clamp(score, -2, 2));
};

const getQuantSignalLabel = (score: number): FundQuantSignalSnapshot['signal'] => {
  if (score >= 1.2) return '积极';
  if (score >= 0.4) return '偏积极';
  if (score <= -1.2) return '谨慎';
  if (score <= -0.4) return '偏谨慎';
  return '观望';
};

const buildFundQuantSignal = (navs: FundHistoricalNavPoint[]): FundQuantSignalSnapshot => {
  if (navs.length < 21) {
    return {
      dataStatus: navs.length === 0 ? 'failed' : 'insufficient',
      score: 0,
      signal: '观望',
      valuationStatus: 'missing',
      sampleSize: navs.length,
      reason: '历史净值样本少于 21 条，暂不生成量化加减仓信号',
    };
  }

  const return20d = calculatePeriodReturnPct(navs, 20);
  const return60d = calculatePeriodReturnPct(navs, 60);
  const return120d = calculatePeriodReturnPct(navs, 120);
  const volatility60d = navs.length >= 61 ? calculateAnnualizedVolatilityPct(navs, 60) : undefined;
  const maxDrawdown120d = calculateMaxDrawdownPct(navs, Math.min(120, navs.length));
  const momentumScore = scoreMomentum(return20d, return60d, return120d);
  const riskScore = scoreRisk(volatility60d, maxDrawdown120d);
  const score = round(momentumScore * 0.6 + riskScore * 0.4);

  return {
    dataStatus: 'available',
    score,
    signal: getQuantSignalLabel(score),
    momentumScore,
    riskScore,
    valuationStatus: 'missing',
    return20d,
    return60d,
    return120d,
    volatility60d,
    maxDrawdown120d,
    sampleSize: navs.length,
    reason:
      navs.length >= 121
        ? '基于基金历史净值计算动量、波动率和最大回撤；估值因子缺失，未纳入评分'
        : '历史净值样本不足 121 条，已生成部分量化信号；估值因子缺失，未纳入评分',
  };
};

const buildCachedOnlyQuantSignal = (): FundQuantSignalSnapshot => ({
  dataStatus: 'insufficient',
  score: 0,
  signal: '观望',
  valuationStatus: 'missing',
  sampleSize: 0,
  reason: '快速分析未现场拉取历史净值，发送“量化分析”可获取完整量化信号',
});

const getFundQuantSignal = async (
  fundCode: string,
  options?: { cachedOnly?: boolean },
): Promise<FundQuantSignalSnapshot> => {
  const cached = quantSignalCache.get(fundCode);
  if (cached && cached.expiresAt > Date.now()) return cached.signal;
  if (options?.cachedOnly) return buildCachedOnlyQuantSignal();

  const historicalNavs = await fetchFundHistoricalNavForQuant(fundCode);
  const signal = buildFundQuantSignal(historicalNavs);
  quantSignalCache.set(fundCode, { expiresAt: Date.now() + QUANT_SIGNAL_CACHE_TTL_MS, signal });
  return signal;
};

const normalizeTicker = (ticker?: string) => {
  if (!ticker) return '';
  const digits = ticker.replace(/\D/g, '');
  return digits || ticker;
};

const buildTencentStockCode = (ticker?: string) => {
  const digits = normalizeTicker(ticker);
  if (digits.length === 5) return `hk${digits}`;
  if (digits.length !== 6) return null;
  if (digits.startsWith('6')) return `sh${digits}`;
  if (digits.startsWith('0') || digits.startsWith('3')) return `sz${digits}`;
  if (digits.startsWith('83') || digits.startsWith('87') || digits.startsWith('43')) return `bj${digits}`;
  return null;
};

const fetchTencentStockPctMap = async (codes: string[]) => {
  const uniqueCodes = Array.from(new Set(codes));
  if (uniqueCodes.length === 0) return {} as Record<string, number>;
  const text = await fetchText(
    `${TENCENT_QUOTE_API}${uniqueCodes.map((code) => `s_${code}`).join(',')}`,
    { headers: { Accept: '*/*' } },
    '读取腾讯实时股票行情',
  );
  const pctMap: Record<string, number> = {};
  text.split(';').forEach((line) => {
    if (!line.includes('=')) return;
    const rightSide = line.split('=')[1]?.replace(/"/g, '') ?? '';
    const parts = rightSide.split('~');
    const ticker = parts[2];
    const pct = Number.parseFloat(parts[5] || '');
    const key = normalizeTicker(ticker);
    if (key && Number.isFinite(pct)) pctMap[key] = pct;
  });
  return pctMap;
};

const estimateFundIntradayPct = async (fundCode: string) => {
  const response = await fetchFundHoldings(fundCode);
  const holdings = response?.data?.equityHoldings?.slice(0, 10) ?? [];
  const codes = holdings
    .map((holding) => buildTencentStockCode(holding.ticker))
    .filter((code): code is string => Boolean(code));
  if (holdings.length === 0 || codes.length === 0) return null;

  const pctMap = await fetchTencentStockPctMap(codes);
  let weightedPctSum = 0;
  let totalWeight = 0;
  holdings.forEach((holding) => {
    const key = normalizeTicker(holding.ticker);
    const pct = pctMap[key];
    const weight = Number(holding.weight || 0);
    if (Number.isFinite(pct) && weight > 0) {
      weightedPctSum += (weight / 100) * pct;
      totalWeight += weight;
    }
  });

  if (totalWeight <= 0) return null;
  return {
    pct: weightedPctSum / (totalWeight / 100),
    coveragePct: totalWeight,
  };
};

const parseTencentMarketLine = (line: string): MarketIndexSnapshot | null => {
  if (!line.includes('=')) return null;
  const [leftSide, rawRightSide] = line.split('=');
  const code = leftSide?.match(/v_(.+)/)?.[1];
  if (!code || !rawRightSide) return null;

  const parts = rawRightSide.replace(/"/g, '').split('~');
  const name = parts[1] || MARKET_INDEX_NAMES[code] || code;
  const price = Number.parseFloat(parts[3] || '');
  const changePct = Number.parseFloat(parts[32] || '');
  const change = Number.parseFloat(parts[31] || '');
  const updateTime = parts[30];
  if (!Number.isFinite(price) || !Number.isFinite(changePct)) return null;

  return {
    code,
    name,
    price: round(price, 2),
    changePct: round(changePct, 2),
    change: Number.isFinite(change) ? round(change, 2) : undefined,
    updateTime,
  };
};

const fetchMarketSnapshot = async (env: Env): Promise<MarketSnapshot | undefined> => {
  if (!isEnabled(env.MARKET_ANALYSIS_ENABLED, true)) return undefined;
  const codes = (env.MARKET_INDEX_CODES || DEFAULT_MARKET_INDEX_CODES.join(','))
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
  if (codes.length === 0) return undefined;

  try {
    const text = await fetchText(`${TENCENT_QUOTE_API}${codes.join(',')}`, {}, '读取 A 股市场指数');
    const indices = text
      .split(';')
      .map(parseTencentMarketLine)
      .filter((item): item is MarketIndexSnapshot => Boolean(item));
    const status =
      indices.length === 0 ? 'missing' : indices.length === codes.length ? 'available' : 'partial';
    return {
      asOf: new Date().toISOString(),
      indices,
      dataStatus: status,
    };
  } catch (error) {
    console.warn('读取 A 股市场指数失败', error);
    return {
      asOf: new Date().toISOString(),
      indices: [],
      dataStatus: 'missing',
    };
  }
};

const hasUnavailableEastMoneyFundFlowValues = (response: EastMoneyFundFlowResponse) => {
  return (response.data?.diff || []).some((item) => item.f62 === '-' || item.f184 === '-');
};

const fetchEastMoneyFundFlowResult = async (
  category: FundFlowItemSnapshot['category'],
  fs: string,
  maxItems: number,
  timeoutMs: number,
): Promise<{ items: FundFlowItemSnapshot[]; unavailableValues: boolean }> => {
  const url = new URL(EASTMONEY_FUND_FLOW_API);
  url.searchParams.set('pn', '1');
  url.searchParams.set('pz', String(maxItems));
  url.searchParams.set('po', '1');
  url.searchParams.set('np', '1');
  url.searchParams.set('ut', 'bd1d9ddb04089700cf9c27f6f7426281');
  url.searchParams.set('fltt', '2');
  url.searchParams.set('invt', '2');
  url.searchParams.set('fid', 'f62');
  url.searchParams.set('fs', fs);
  url.searchParams.set('fields', 'f12,f14,f3,f62,f184');
  const response = await fetchJsonWithTimeout<EastMoneyFundFlowResponse>(
    url.toString(),
    { headers: { Accept: 'application/json' } },
    `读取东方财富${category === 'sector' ? '行业板块' : '概念板块'}资金流`,
    timeoutMs,
  );

  const items = (response.data?.diff || [])
    .map<FundFlowItemSnapshot | null>((item, index) => {
      const name = item.f14?.trim();
      const netInflow = Number(item.f62);
      if (!name || !Number.isFinite(netInflow)) return null;
      const changePct = Number(item.f3);
      const mainNetInflowPct = Number(item.f184);

      return {
        code: item.f12,
        name,
        category,
        netInflow: round(netInflow, 2),
        netInflowRank: index + 1,
        changePct: Number.isFinite(changePct) ? round(changePct, 2) : undefined,
        mainNetInflowPct: Number.isFinite(mainNetInflowPct) ? round(mainNetInflowPct, 2) : undefined,
      };
    })
    .filter((item): item is FundFlowItemSnapshot => Boolean(item));

  return { items, unavailableValues: hasUnavailableEastMoneyFundFlowValues(response) };
};

const fetchFundFlowSnapshot = async (env: Env): Promise<FundFlowSnapshot | undefined> => {
  if (!isEnabled(env.MARKET_ANALYSIS_ENABLED, true)) return undefined;
  const timeoutMs = Math.min(
    parsePositiveInt(env.NEWS_QUERY_TIMEOUT_MS, DEFAULT_FUND_FLOW_QUERY_TIMEOUT_MS),
    5000,
  );
  const failedSources: string[] = [];
  const items: FundFlowItemSnapshot[] = [];
  let hasUnavailableValues = false;

  try {
    const result = await fetchEastMoneyFundFlowResult('sector', 'm:90+t:2', 10, timeoutMs);
    items.push(...result.items);
    hasUnavailableValues ||= result.unavailableValues;
  } catch {
    failedSources.push('eastmoney-sector-flow');
  }

  try {
    const result = await fetchEastMoneyFundFlowResult('concept', 'm:90+t:3', 10, timeoutMs);
    items.push(...result.items);
    hasUnavailableValues ||= result.unavailableValues;
  } catch {
    failedSources.push('eastmoney-concept-flow');
  }

  const rankedItems = items
    .sort((a, b) => b.netInflow - a.netInflow)
    .slice(0, 12)
    .map((item, index) => ({ ...item, netInflowRank: index + 1 }));

  if (rankedItems.length === 0 && failedSources.length > 0) {
    return {
      asOf: new Date().toISOString(),
      provider: 'eastmoney',
      items: [],
      dataStatus: 'failed',
      unavailableReason: 'requestFailed',
      failedSources,
    };
  }

  if (rankedItems.length === 0) {
    return {
      asOf: new Date().toISOString(),
      provider: 'eastmoney',
      items: [],
      dataStatus: 'missing',
      unavailableReason: hasUnavailableValues ? 'preMarketOrOffHours' : 'empty',
      failedSources: failedSources.length > 0 ? failedSources : undefined,
    };
  }

  return {
    asOf: new Date().toISOString(),
    provider: 'eastmoney',
    items: rankedItems,
    dataStatus: failedSources.length > 0 ? 'partial' : 'available',
    failedSources: failedSources.length > 0 ? failedSources : undefined,
  };
};

const buildNewsKeywords = (holdings: HoldingsSnapshot) => {
  const keywords = new Set<string>([
    'A股',
    '政策',
    '财报',
    '公告',
    '业绩预告',
    '人工智能',
    '低碳',
    '新能源',
  ]);
  holdings.holdings.slice(0, 5).forEach((fund) => keywords.add(fund.name));
  holdings.holdings.forEach((fund) => {
    fund.topEquityHoldings?.slice(0, 5).forEach((equity) => {
      if (equity.name.trim()) keywords.add(equity.name.trim());
      if (equity.sector?.trim()) keywords.add(equity.sector.trim());
    });
  });
  return Array.from(keywords).slice(0, 18);
};

interface EastMoneyNewsItem {
  title?: string;
  mediaName?: string;
  showTime?: string;
  url?: string;
  uniqueUrl?: string;
}

interface EastMoneyNewsResponse {
  data?: {
    list?: EastMoneyNewsItem[];
  };
}

interface SinaNewsItem {
  title?: string;
  url?: string;
  ctime?: string;
  media_name?: string;
  source?: string;
}

interface SinaNewsResponse {
  result?: {
    data?: SinaNewsItem[];
  };
}

const isNewsWithinLookback = (publishedAt: string | undefined, lookbackHours: number) => {
  if (!publishedAt) return true;
  const normalized = /^\d+$/.test(publishedAt)
    ? Number.parseInt(publishedAt, 10) * 1000
    : Date.parse(publishedAt.replace(/-/g, '/'));
  if (!Number.isFinite(normalized)) return true;
  return Date.now() - normalized <= lookbackHours * 60 * 60 * 1000;
};

const dedupeNewsItems = (items: NewsItemSnapshot[], maxItems: number) => {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = item.url || item.title;
      if (!item.title || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
};

const fetchEastMoneyNews = async (
  maxItems: number,
  lookbackHours: number,
  timeoutMs: number,
): Promise<NewsItemSnapshot[]> => {
  const url = new URL(EASTMONEY_NEWS_API);
  url.searchParams.set('client', 'web');
  url.searchParams.set('biz', 'web_news_col');
  url.searchParams.set('column', '345');
  url.searchParams.set('order', '1');
  url.searchParams.set('needInteractData', '0');
  url.searchParams.set('page_index', '1');
  url.searchParams.set('page_size', String(maxItems));
  url.searchParams.set('req_trace', String(Date.now()));
  const response = await fetchJsonWithTimeout<EastMoneyNewsResponse>(
    url.toString(),
    { headers: { Accept: 'application/json' } },
    '读取东方财富新闻',
    timeoutMs,
  );

  return (response.data?.list || [])
    .map<NewsItemSnapshot | null>((item) => {
      const title = item.title?.trim();
      if (!title) return null;
      return {
        title,
        source: item.mediaName || '东方财富',
        url: item.url || item.uniqueUrl,
        publishedAt: item.showTime,
        language: 'zh-CN',
      };
    })
    .filter((item): item is NewsItemSnapshot => Boolean(item))
    .filter((item) => isNewsWithinLookback(item.publishedAt, lookbackHours));
};

const fetchSinaNews = async (
  maxItems: number,
  lookbackHours: number,
  timeoutMs: number,
): Promise<NewsItemSnapshot[]> => {
  const url = new URL(SINA_FINANCE_ROLL_API);
  url.searchParams.set('pageid', '153');
  url.searchParams.set('lid', '2510');
  url.searchParams.set('k', '');
  url.searchParams.set('num', String(maxItems));
  url.searchParams.set('page', '1');
  url.searchParams.set('r', String(Date.now()));
  const response = await fetchJsonWithTimeout<SinaNewsResponse>(
    url.toString(),
    { headers: { Accept: 'application/json' } },
    '读取新浪财经新闻',
    timeoutMs,
  );

  return (response.result?.data || [])
    .map<NewsItemSnapshot | null>((item) => {
      const title = item.title?.trim();
      if (!title) return null;
      return {
        title,
        source: item.media_name || item.source || '新浪财经',
        url: item.url,
        publishedAt: item.ctime,
        language: 'zh-CN',
      };
    })
    .filter((item): item is NewsItemSnapshot => Boolean(item))
    .filter((item) => isNewsWithinLookback(item.publishedAt, lookbackHours));
};

const fetchNewsSnapshot = async (
  env: Env,
  holdings: HoldingsSnapshot,
): Promise<NewsSnapshot | undefined> => {
  if (!isEnabled(env.NEWS_ANALYSIS_ENABLED, true)) return undefined;
  const configuredProvider = env.NEWS_PROVIDER || 'mixed';
  const provider =
    configuredProvider === 'eastmoney' || configuredProvider === 'sina' || configuredProvider === 'mixed'
      ? configuredProvider
      : 'mixed';

  const lookbackHours = parsePositiveInt(env.NEWS_LOOKBACK_HOURS, 72);
  const maxItems = Math.min(parsePositiveInt(env.NEWS_MAX_ITEMS, 12), 25);
  const timeoutMs = Math.min(
    parsePositiveInt(env.NEWS_QUERY_TIMEOUT_MS, DEFAULT_NEWS_QUERY_TIMEOUT_MS),
    10000,
  );
  const keywords = buildNewsKeywords(holdings);
  const items: NewsItemSnapshot[] = [];
  const failedSources: string[] = [];

  if (provider === 'eastmoney' || provider === 'mixed') {
    try {
      items.push(...(await fetchEastMoneyNews(maxItems, lookbackHours, timeoutMs)));
    } catch {
      failedSources.push('eastmoney');
    }
  }

  if ((provider === 'sina' || provider === 'mixed') && items.length < maxItems) {
    try {
      items.push(...(await fetchSinaNews(maxItems, lookbackHours, timeoutMs)));
    } catch {
      failedSources.push('sina');
    }
  }

  const uniqueItems = dedupeNewsItems(items, maxItems);
  const expectedSources = provider === 'mixed' ? 2 : 1;
  if (failedSources.length >= expectedSources && uniqueItems.length === 0) {
    return {
      asOf: new Date().toISOString(),
      provider,
      keywords,
      lookbackHours,
      items: [],
      dataStatus: 'failed',
      failedSources,
    };
  }

  return {
    asOf: new Date().toISOString(),
    provider,
    keywords,
    lookbackHours,
    items: uniqueItems,
    dataStatus: uniqueItems.length > 0 ? 'available' : 'missing',
    failedSources: failedSources.length > 0 ? failedSources : undefined,
  };
};

const buildEquityOverlap = (holdings: HoldingSnapshotItem[]): EquityOverlapItem[] => {
  const byTicker = new Map<
    string,
    { name: string; fundWeights: Map<string, number>; totalWeight: number; maxWeight: number }
  >();

  holdings.forEach((fund) => {
    fund.topEquityHoldings?.forEach((equity) => {
      const ticker = equity.ticker.trim();
      if (!ticker) return;
      const current = byTicker.get(ticker) ?? {
        name: equity.name || ticker,
        fundWeights: new Map<string, number>(),
        totalWeight: 0,
        maxWeight: 0,
      };
      current.fundWeights.set(fund.name, equity.weight);
      current.totalWeight += equity.weight;
      current.maxWeight = Math.max(current.maxWeight, equity.weight);
      byTicker.set(ticker, current);
    });
  });

  return Array.from(byTicker.entries())
    .map(([ticker, item]) => ({
      ticker,
      name: item.name,
      fundCount: item.fundWeights.size,
      funds: Array.from(item.fundWeights.keys()),
      maxWeight: round(item.maxWeight),
      totalWeight: round(item.totalWeight),
    }))
    .filter((item) => item.fundCount > 1)
    .sort((a, b) => b.fundCount - a.fundCount || b.totalWeight - a.totalWeight)
    .slice(0, 20);
};

const buildUnderlyingExposures = (holdings: HoldingSnapshotItem[], totalAssets: number) => {
  const exposureByTheme = new Map<
    string,
    {
      marketValue: number;
      holdings: Map<string, { ticker: string; name: string; exposure: number; funds: Set<string> }>;
    }
  >();

  holdings.forEach((fund) => {
    const fundMarketValue = fund.marketValue;
    fund.topEquityHoldings?.forEach((equity) => {
      const theme = equity.sector?.trim();
      const ticker = equity.ticker.trim();
      if (!theme || !ticker || equity.weight <= 0) return;
      const exposure = fundMarketValue * (equity.weight / 100);
      const currentTheme = exposureByTheme.get(theme) ?? {
        marketValue: 0,
        holdings: new Map<string, { ticker: string; name: string; exposure: number; funds: Set<string> }>(),
      };
      currentTheme.marketValue += exposure;

      const currentHolding = currentTheme.holdings.get(ticker) ?? {
        ticker,
        name: equity.name || ticker,
        exposure: 0,
        funds: new Set<string>(),
      };
      currentHolding.exposure += exposure;
      currentHolding.funds.add(fund.name);
      currentTheme.holdings.set(ticker, currentHolding);
      exposureByTheme.set(theme, currentTheme);
    });
  });

  return Array.from(exposureByTheme.entries())
    .map<UnderlyingExposureItem>(([theme, item]) => ({
      theme,
      marketValue: round(item.marketValue),
      portfolioPct: totalAssets > 0 ? round((item.marketValue / totalAssets) * 100) : 0,
      topHoldings: Array.from(item.holdings.values())
        .sort((a, b) => b.exposure - a.exposure)
        .slice(0, 5)
        .map((holding) => ({
          ticker: holding.ticker,
          name: holding.name,
          exposure: round(holding.exposure),
          portfolioPct: totalAssets > 0 ? round((holding.exposure / totalAssets) * 100) : 0,
          funds: Array.from(holding.funds),
        })),
    }))
    .filter((item) => item.marketValue > 0)
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 12);
};

const buildHoldingsDataCoverage = (
  holdings: HoldingSnapshotItem[],
  investmentProfile?: InvestmentProfileSnapshot,
): HoldingsDataCoverage => {
  const availableCount = holdings.filter((item) => item.topEquityHoldings?.length).length;
  const sectorAvailableCount = holdings.filter((item) =>
    item.topEquityHoldings?.some((equity) => equity.sector?.trim()),
  ).length;
  const resolveCoverage = (count: number) => {
    if (holdings.length === 0 || count === 0) return 'missing';
    return count === holdings.length ? 'available' : 'partial';
  };

  return {
    topEquityHoldings: resolveCoverage(availableCount),
    industryDistribution: resolveCoverage(sectorAvailableCount),
    managerChanges: 'missing',
    externalAssets: investmentProfile?.externalAssets?.trim() ? 'available' : 'missing',
    riskProfile: investmentProfile?.riskTolerance?.trim() ? 'available' : 'missing',
    investmentHorizon: investmentProfile?.investmentHorizon?.trim() ? 'available' : 'missing',
  };
};

const buildBuildCandidates = (
  watchlists: BackupWatchlistItem[] | undefined,
  heldFundCodes: Set<string>,
): BuildCandidateSnapshotItem[] => {
  return (watchlists || [])
    .filter((item) => item.type === 'fund' && !heldFundCodes.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      platform: item.platform,
      source: 'watchlist',
      currentPrice: round(item.currentPrice, 4),
      dayChangePct: round(item.dayChangePct),
      anchorPrice: round(item.anchorPrice, 4),
      anchorDate: item.anchorDate,
      lastUpdate: item.lastUpdate,
      anchorChangePct:
        item.anchorPrice > 0 ? round(((item.currentPrice - item.anchorPrice) / item.anchorPrice) * 100) : 0,
    }))
    .sort((a, b) => a.dayChangePct - b.dayChangePct || a.anchorChangePct - b.anchorChangePct)
    .slice(0, 20);
};

const buildFallbackBuildCandidates = (
  fundFlowSnapshot: FundFlowSnapshot | undefined,
  heldFundCodes: Set<string>,
): BuildCandidateSnapshotItem[] => {
  if (!fundFlowSnapshot?.items.length) return [];
  const flowThemes = fundFlowSnapshot.items.slice(0, 6).map((item) => item.name.toLowerCase());
  const seen = new Set<string>();

  return FUND_FLOW_FALLBACK_CANDIDATES.filter((candidate) => !heldFundCodes.has(candidate.code))
    .map<BuildCandidateSnapshotItem | null>((candidate) => {
      const matchedTheme = flowThemes.find((theme) =>
        candidate.keywords.some((keyword) => theme.includes(keyword.toLowerCase())),
      );
      if (!matchedTheme || seen.has(candidate.code)) return null;
      seen.add(candidate.code);

      return {
        code: candidate.code,
        name: candidate.name,
        source: 'fundFlowFallback',
        matchedFlowTheme: matchedTheme,
        reason: candidate.reason,
        currentPrice: 0,
        dayChangePct: 0,
        anchorPrice: 0,
        anchorDate: '',
        lastUpdate: fundFlowSnapshot.asOf,
        anchorChangePct: 0,
      };
    })
    .filter((item): item is BuildCandidateSnapshotItem => Boolean(item))
    .slice(0, 5);
};

const buildHoldingsSnapshot = async (
  payload: FundBackupPayload,
  options?: SnapshotBuildOptions,
): Promise<HoldingsSnapshot> => {
  const validFunds = payload.funds.filter((fund) => fund.holdingShares > 0 && fund.currentNav > 0);
  const heldFundCodeSet = new Set(validFunds.map((fund) => fund.code));
  const holdingsTimeoutMs = options?.holdingsTimeoutMs ?? DEFAULT_FUND_HOLDINGS_TIMEOUT_MS;
  const quantCachedOnly = options?.quantMode === 'cachedOnly';
  const enrichments = await Promise.all(
    validFunds.map(async (fund) => [fund.code, await fetchFundHoldingsEnrichment(fund.code, holdingsTimeoutMs)] as const),
  );
  const quantSignals = await Promise.all(
    validFunds.map(async (fund) => {
      return [fund.code, await getFundQuantSignal(fund.code, { cachedOnly: quantCachedOnly })] as const;
    }),
  );
  const enrichmentMap = new Map(enrichments);
  const quantSignalMap = new Map(quantSignals);
  const holdings = validFunds.map<HoldingSnapshotItem>((fund) => {
      const marketValue = fund.holdingShares * fund.currentNav;
      const totalCost = fund.holdingShares * fund.costPrice;
      const totalGain = marketValue - totalCost;
      const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
      const enrichment = enrichmentMap.get(fund.code);

      return {
        code: fund.code,
        name: fund.name,
        platform: fund.platform,
        holdingShares: round(fund.holdingShares, 4),
        costPrice: round(fund.costPrice, 4),
        currentNav: round(fund.currentNav, 4),
        marketValue: round(marketValue),
        totalCost: round(totalCost),
        totalGain: round(totalGain),
        totalGainPct: round(totalGainPct),
        dayChangePct: round(fund.dayChangePct),
        dayChangeVal: round(fund.dayChangeVal),
        lastUpdate: fund.lastUpdate,
        buyDate: fund.buyDate,
        buyTime: fund.buyTime,
        settlementDays: fund.settlementDays,
        topEquityHoldings: enrichment?.topEquityHoldings,
        holdingsDataStatus: enrichment?.status ?? 'missing',
        holdingsDataDate: enrichment?.portfolioDate,
        quantSignal: quantSignalMap.get(fund.code),
      };
    });

  const totalAssets = holdings.reduce((sum, item) => sum + item.marketValue, 0);
  const totalDayGain = holdings.reduce((sum, item) => sum + item.dayChangeVal, 0);
  const totalCost = holdings.reduce((sum, item) => sum + item.totalCost, 0);
  const holdingGain = holdings.reduce((sum, item) => sum + item.totalGain, 0);
  const underlyingExposures = buildUnderlyingExposures(holdings, totalAssets);
  const riskRadar = buildPortfolioRiskRadar(holdings, totalAssets);

  return {
    asOf: payload.exportDate || new Date().toISOString(),
    currency: 'CNY',
    totalAssets: round(totalAssets),
    totalDayGain: round(totalDayGain),
    totalDayGainPct: totalAssets - totalDayGain > 0 ? round((totalDayGain / (totalAssets - totalDayGain)) * 100) : 0,
    holdingGain: round(holdingGain),
    holdingGainPct: totalCost > 0 ? round((holdingGain / totalCost) * 100) : 0,
    holdings,
    buildCandidates: buildBuildCandidates(payload.watchlists, heldFundCodeSet),
    fallbackBuildCandidates: [],
    heldFundCodes: Array.from(heldFundCodeSet),
    equityOverlap: buildEquityOverlap(holdings),
    underlyingExposures,
    quantSignals: holdings.map((item) => item.quantSignal).filter((item): item is FundQuantSignalSnapshot => Boolean(item)),
    riskRadar,
    dataCoverage: buildHoldingsDataCoverage(holdings, payload.investmentProfile),
    investmentProfile: payload.investmentProfile,
  };
};

const buildPortfolioQuantSummary = (holdings: HoldingSnapshotItem[], totalAssets: number) => {
  const available = holdings.filter((item) => item.quantSignal?.dataStatus === 'available');
  if (available.length === 0 || totalAssets <= 0) {
    return {
      status: 'missing' as const,
      score: 0,
      signal: '观望' as FundQuantSignalSnapshot['signal'],
      availableCount: available.length,
      totalCount: holdings.length,
    };
  }

  const weightedScore = available.reduce((sum, item) => {
    const weight = item.marketValue / totalAssets;
    return sum + (item.quantSignal?.score ?? 0) * weight;
  }, 0);

  return {
    status: available.length === holdings.length ? ('available' as const) : ('partial' as const),
    score: round(weightedScore),
    signal: getQuantSignalLabel(weightedScore),
    availableCount: available.length,
    totalCount: holdings.length,
  };
};

const getRiskLevel = (score: number): PortfolioRiskRadarItem['level'] => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const buildPortfolioRiskRadar = (holdings: HoldingSnapshotItem[], totalAssets: number): PortfolioRiskRadarItem[] => {
  if (holdings.length === 0 || totalAssets <= 0) return [];

  const sortedByValue = [...holdings].sort((a, b) => b.marketValue - a.marketValue);
  const top3Pct = (sortedByValue.slice(0, 3).reduce((sum, item) => sum + item.marketValue, 0) / totalAssets) * 100;
  const maxFundPct = (sortedByValue[0].marketValue / totalAssets) * 100;
  const overlapItems = buildEquityOverlap(holdings);
  const highOverlapCount = overlapItems.filter((item) => item.fundCount >= 2).length;
  const underlyingExposures = buildUnderlyingExposures(holdings, totalAssets);
  const topTheme = underlyingExposures[0];
  const weakQuantCount = holdings.filter((item) => {
    const score = item.quantSignal?.score;
    return score !== undefined && score <= -0.4;
  }).length;
  const availableVolatility = holdings
    .map((item) => item.quantSignal?.volatility60d)
    .filter((value): value is number => value !== undefined);
  const avgVolatility =
    availableVolatility.length > 0
      ? availableVolatility.reduce((sum, value) => sum + value, 0) / availableVolatility.length
      : 0;

  const concentrationScore = clamp(Math.max(top3Pct - 45, maxFundPct - 25) * 1.6, 0, 100);
  const overlapScore = clamp(highOverlapCount * 18, 0, 100);
  const themeScore = clamp(((topTheme?.portfolioPct ?? 0) - 20) * 2.4, 0, 100);
  const quantWeaknessScore = clamp((weakQuantCount / holdings.length) * 100, 0, 100);
  const volatilityScore = clamp((avgVolatility - 18) * 3.2, 0, 100);

  return [
    {
      key: 'concentration',
      label: '仓位集中度',
      level: getRiskLevel(concentrationScore),
      score: round(concentrationScore),
      detail: `前三大仓位 ${round(top3Pct)}%，最大单基金 ${round(maxFundPct)}%`,
    },
    {
      key: 'overlap',
      label: '底层重合度',
      level: getRiskLevel(overlapScore),
      score: round(overlapScore),
      detail: highOverlapCount > 0 ? `${highOverlapCount} 个底层股票被多只基金共同持有` : '暂未发现明显底层股票重合',
    },
    {
      key: 'themeExposure',
      label: '主题暴露',
      level: getRiskLevel(themeScore),
      score: round(themeScore),
      detail: topTheme ? `最大主题 ${topTheme.theme}，组合暴露 ${topTheme.portfolioPct}%` : '底层行业/主题数据不足',
    },
    {
      key: 'quantWeakness',
      label: '量化转弱',
      level: getRiskLevel(quantWeaknessScore),
      score: round(quantWeaknessScore),
      detail: `${weakQuantCount}/${holdings.length} 只基金量化信号偏谨慎或谨慎`,
    },
    {
      key: 'volatility',
      label: '波动风险',
      level: getRiskLevel(volatilityScore),
      score: round(volatilityScore),
      detail: availableVolatility.length > 0 ? `可计算基金平均 60 日年化波动率 ${round(avgVolatility)}%` : '波动率样本不足',
    },
  ];
};

const buildHoldingsAnalysisPrompt = (context: AnalysisContextSnapshot, mode: string) => {
  const { holdings, marketSnapshot, newsSnapshot, fundFlowSnapshot } = context;
  const sortedByGain = [...holdings.holdings].sort((a, b) => b.totalGainPct - a.totalGainPct);
  const sortedByValue = [...holdings.holdings].sort((a, b) => b.marketValue - a.marketValue);
  const topGain = sortedByGain[0];
  const topLoss = sortedByGain.at(-1);
  const concentration =
    holdings.totalAssets > 0
      ? sortedByValue.slice(0, 3).reduce((sum, item) => sum + item.marketValue, 0) /
        holdings.totalAssets
      : 0;
  const marketPhase = getChinaMarketPhase();
  const observationTitle = marketPhase === 'postClose' ? '明日观察点' : '今日观察点';
  const quantSummary = buildPortfolioQuantSummary(holdings.holdings, holdings.totalAssets);

  const modeInstruction =
    mode === 'risk'
      ? '你是一位专注风险评估的基金持仓分析助手，请优先识别回撤、集中度、单市场暴露与组合脆弱点。'
      : mode === 'quick'
        ? '你是一位基金持仓分析助手，请用快速诊断方式先给关键结论，再补充依据。'
        : '你是一位资深基金投顾，请从收益、配置、集中度、风险、改进建议等多个维度做深度分析。';

  const summary = [
    `总资产: ${holdings.totalAssets}`,
    `持仓数量: ${holdings.holdings.length}`,
    `总收益: ${holdings.holdingGain} (${holdings.holdingGainPct}%)`,
    `日收益: ${holdings.totalDayGain} (${holdings.totalDayGainPct}%)`,
    topGain ? `收益最佳: ${topGain.name} (${topGain.totalGainPct}%)` : '',
    topLoss ? `收益最弱: ${topLoss.name} (${topLoss.totalGainPct}%)` : '',
    `前三大仓位集中度: ${(concentration * 100).toFixed(1)}%`,
    `前十大重仓股数据: ${holdings.dataCoverage.topEquityHoldings}`,
    `真实行业分布数据: ${holdings.dataCoverage.industryDistribution}`,
    `基金经理最新调仓数据: ${holdings.dataCoverage.managerChanges}`,
    `账户外资产数据: ${holdings.dataCoverage.externalAssets}`,
    `风险承受能力: ${holdings.dataCoverage.riskProfile}`,
    `投资期限: ${holdings.dataCoverage.investmentHorizon}`,
    `底层股票重合项数量: ${holdings.equityOverlap.length}`,
    `底层行业/主题暴露数量: ${holdings.underlyingExposures.length}`,
    holdings.underlyingExposures[0]
      ? `底层最大暴露: ${holdings.underlyingExposures[0].theme} (${holdings.underlyingExposures[0].portfolioPct}%)`
      : '',
    `量化信号数据: ${quantSummary.status}`,
    `量化信号覆盖: ${quantSummary.availableCount}/${quantSummary.totalCount}`,
    `组合量化评分: ${quantSummary.score}`,
    `组合量化信号: ${quantSummary.signal}`,
    `组合风险雷达高风险项: ${holdings.riskRadar.filter((item) => item.level === 'high').map((item) => item.label).join('、') || '无'}`,
    `组合风险雷达中风险项: ${holdings.riskRadar.filter((item) => item.level === 'medium').map((item) => item.label).join('、') || '无'}`,
    `未持有自选建仓候选数量: ${holdings.buildCandidates.length}`,
    `资金流兜底建仓候选数量: ${holdings.fallbackBuildCandidates.length}`,
    `当前A股阶段: ${CHINA_MARKET_PHASE_LABELS[marketPhase]} (${marketPhase})`,
    `A股市场数据: ${marketSnapshot?.dataStatus ?? 'missing'}`,
    `消息面/财报/公告数据: ${newsSnapshot?.dataStatus ?? 'missing'}`,
    `资金流数据: ${fundFlowSnapshot?.dataStatus ?? 'missing'}`,
    fundFlowSnapshot?.items[0]
      ? `资金流入最强方向: ${fundFlowSnapshot.items[0].name} (${fundFlowSnapshot.items[0].netInflow})`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `${modeInstruction}\n要求：\n1) 使用简体中文回答。\n2) 只基于给定 JSON 数据推理，不要编造不存在的数据。\n3) 如果前十大重仓股、真实行业分布、基金经理调仓、账户外资产、风险承受能力或投资期限在 dataCoverage 中标记为 missing/partial，必须明确说明“当前数据缺失/不完整”，不能当作已知事实分析。\n4) 如果 marketSnapshot 缺失或 dataStatus 为 missing/partial，必须说明“A 股市场数据缺失/不完整”，不得假设指数涨跌。\n5) 如果 newsSnapshot 缺失或 dataStatus 为 failed，必须说明“中文财经新闻接口失败，消息面/财报/公告暂不可用”，不得说成近 72 小时无新闻。\n6) 如果 newsSnapshot.dataStatus 为 missing，才可以说明“最近 ${newsSnapshot?.lookbackHours ?? 72} 小时未抓到可用中文财经新闻项”。\n7) 如果 fundFlowSnapshot 缺失、dataStatus 为 failed，必须说明“资金流数据接口失败，暂不可用”，不得编造资金流入方向或金额；如果 fundFlowSnapshot.dataStatus 为 missing 且 unavailableReason 为 preMarketOrOffHours，必须说明“资金流数据暂未形成，可能因当前处于盘前/非交易时段，东方财富暂未返回有效主力净流入数据”；如果 fundFlowSnapshot.dataStatus 为 missing 且不是上述原因，必须说明“资金流数据暂不可用”；如果 partial，必须说明资金流数据不完整。\n8) 不得编造新闻标题、财报数据、公告内容或资金流数据，不得把未确认传闻当事实。\n9) 主题、行业、风格暴露必须优先基于 underlyingExposures、topEquityHoldings 和 equityOverlap；严禁仅凭基金名称判断当前组合持有什么主题。没有底层持仓数据时，必须说明“底层持仓数据缺失，无法确认该主题暴露”。\n10) 如果提到某个主题是当前组合已有暴露，必须引用底层持仓、行业/主题暴露或代表股票作为依据；如果只是市场资金流主题，必须明确是“市场观察主题”，不能说成当前组合已持有该主题。\n11) 最终回复不得出现 buildCandidates、fallbackBuildCandidates、fundFlowSnapshot、newsSnapshot、marketSnapshot、holdings、heldFundCodes、topEquityHoldings、equityOverlap、underlyingExposures、dataCoverage 等内部字段名；必须转成自然语言，例如“自选未持有基金”“资金流方向兜底候选”“当前持仓”“底层持仓暴露”。\n12) 必须分开输出“今日建仓主题观察”“今日加仓候选”“是否需要减仓”“是否达到清仓条件”四段，结论只能是条件判断，例如“暂不适合/只适合小额分批/等待确认/未达到清仓条件”。\n13) 今日建仓主题观察只推荐主题方向，不输出具体基金名称或基金代码；主题可以和已有持仓重合，因为这是主题强弱判断，不是具体基金推荐。建仓主题判断必须同时考虑 A 股市场情绪、中文财经新闻利好/风险、资金流入最强方向和投资画像。\n14) 如果没有满足建仓观察条件的主题，不能硬选基金，必须明确写“今日暂无明确建仓主题，仅做观察”。\n15) 今日加仓候选只能从当前已持有基金中选择；如果没有合适加仓候选，必须明确写“今日暂无适合加仓的基金”。\n16) 加仓、减仓、清仓建议必须同时给出依据和触发条件；清仓不能只因为单日涨跌，必须基于长期逻辑失效、风格偏离、风险画像冲突、重合度过高或明确止盈止损条件。\n17) 如果当前A股阶段为 preMarket，必须明确这是盘前分析；持仓日收益只能表述为上次同步数据或最近一次净值数据，不能说成今日盘中已涨跌；建仓主题和加仓只能给开盘后确认条件，不能写成现在立即买入。\n18) 观察点标题必须按当前A股阶段选择：收盘后写“明日观察点”，收盘前写“今日观察点”，不要在盘前、盘中或午间休市时写“明日观察点”。\n19) 输出适合 Telegram/QQ 阅读，标题清晰，重点用短句。\n\n请按以下结构输出：\n一、A 股市场环境\n二、持仓表现\n三、消息面/财报/公告影响\n四、资金流入最强方向\n五、今日建仓主题观察\n六、今日加仓候选\n七、是否需要减仓\n八、是否达到清仓条件\n九、${observationTitle}\n\n组合摘要：\n${summary}\n\n以下是分析上下文(JSON)：\n${JSON.stringify(context, null, 2)}`;
};

const resolveAiEndpoint = (env: Env) => {
  const provider = env.AI_PROVIDER || 'customOpenAi';
  if (provider === 'gemini') {
    return { provider, baseUrl: 'https://generativelanguage.googleapis.com/v1beta' };
  }
  if (provider === 'deepseek') {
    return { provider, baseUrl: 'https://api.deepseek.com/v1' };
  }
  if (provider === 'openai') {
    return { provider, baseUrl: 'https://api.openai.com/v1' };
  }
  return { provider, baseUrl: requireEnv(env, 'AI_BASE_URL') };
};

const analyzeWithOpenAiCompatible = async (params: {
  env: Env;
  baseUrl: string;
  systemPrompt: string;
  question: string;
}) => {
  const apiKey = requireEnv(params.env, 'AI_API_KEY');
  const model = requireEnv(params.env, 'AI_MODEL');
  const response = await fetchJson<{
    choices?: Array<{ message?: { content?: string } }>;
  }>(
    `${params.baseUrl.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.question },
        ],
        temperature: 0.2,
      }),
    },
    '调用 AI',
  );

  const content = response.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('AI 返回内容为空');
  return content;
};

const analyzeWithGemini = async (params: { env: Env; systemPrompt: string; question: string }) => {
  const apiKey = requireEnv(params.env, 'AI_API_KEY');
  const model = requireEnv(params.env, 'AI_MODEL');
  const response = await fetchJson<{
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }>(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: params.question }] }],
        generationConfig: { temperature: 0.2 },
      }),
    },
    '调用 Gemini',
  );

  const content = response.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!content) throw new Error('Gemini 返回内容为空');
  return content;
};

const analyzeHoldings = async (
  env: Env,
  context: AnalysisContextSnapshot,
  questionOverride?: string,
) => {
  if (context.holdings.holdings.length === 0) {
    return '当前 Gist 备份中没有有效持仓，未生成 AI 分析。';
  }

  const mode = env.AI_MODE || 'deep';
  const question = questionOverride || env.AI_QUESTION || DEFAULT_AI_QUESTION;
  const systemPrompt = buildHoldingsAnalysisPrompt(context, mode);
  const endpoint = resolveAiEndpoint(env);

  if (endpoint.provider === 'gemini') {
    return analyzeWithGemini({ env, systemPrompt, question });
  }

  return analyzeWithOpenAiCompatible({ env, baseUrl: endpoint.baseUrl, systemPrompt, question });
};

const splitTelegramMessage = (text: string) => {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > TELEGRAM_MESSAGE_LIMIT) {
    let cut = rest.lastIndexOf('\n', TELEGRAM_MESSAGE_LIMIT);
    if (cut < 1000) cut = TELEGRAM_MESSAGE_LIMIT;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
};

const sendTelegramMessage = async (env: Env, text: string, chatId = requireEnv(env, 'TELEGRAM_CHAT_ID')) => {
  const token = requireEnv(env, 'TELEGRAM_BOT_TOKEN');
  const chunks = splitTelegramMessage(text);

  for (const chunk of chunks) {
    await fetchText(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          disable_web_page_preview: true,
        }),
      },
      '发送 Telegram 消息',
    );
  }

  return chunks.length;
};

const truncateForTelegram = (text: string, maxLength?: number) => {
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}\n\n已截断，发送“详细分析”查看完整版本。`;
};

const formatMoney = (value: number) => `${value >= 0 ? '+' : ''}${round(value).toFixed(2)} 元`;

const formatPct = (value: number) => `${value >= 0 ? '+' : ''}${round(value).toFixed(2)}%`;

const buildOfficialDayChangeVal = (fund: BackupFund, nav: number, navChangePercent: number, previousNav?: number) => {
  if (previousNav !== undefined) return fund.holdingShares * (nav - previousNav);
  const marketValue = fund.holdingShares * nav;
  return (marketValue * (navChangePercent / 100)) / (1 + navChangePercent / 100);
};

const buildIntradayProfitFunds = async (funds: BackupFund[]): Promise<IntradayProfitFundSnapshot[]> => {
  const todayStr = getChinaDateString();
  const marketPhase = getChinaMarketPhase();

  return Promise.all(
    funds.map(async (fund) => {
      const latestNav = await fetchEastMoneyLatestNavForWorker(fund.code);
      const nav = latestNav?.nav ?? fund.currentNav;
      const navDate = latestNav?.navDate ?? fund.lastUpdate;
      const marketValue = fund.holdingShares * nav;

      if (latestNav?.navDate === todayStr) {
        const dayChangeVal = buildOfficialDayChangeVal(
          fund,
          latestNav.nav,
          latestNav.navChangePercent,
          latestNav.previousNav,
        );
        return {
          code: fund.code,
          name: fund.name,
          holdingShares: fund.holdingShares,
          marketValue,
          dayChangePct: latestNav.navChangePercent,
          dayChangeVal,
          source: '官方净值',
          navDate,
        };
      }

      if (marketPhase === 'preMarket') {
        return {
          code: fund.code,
          name: fund.name,
          holdingShares: fund.holdingShares,
          marketValue,
          dayChangePct: 0,
          dayChangeVal: 0,
          source: '盘前未估算',
          navDate,
        };
      }

      const estimate = await estimateFundIntradayPct(fund.code).catch(() => null);
      if (!estimate) {
        return {
          code: fund.code,
          name: fund.name,
          holdingShares: fund.holdingShares,
          marketValue,
          dayChangePct: 0,
          dayChangeVal: 0,
          source: '估值不可用',
          navDate,
        };
      }

      return {
        code: fund.code,
        name: fund.name,
        holdingShares: fund.holdingShares,
        marketValue,
        dayChangePct: estimate.pct,
        dayChangeVal: marketValue * (estimate.pct / 100),
        source: '盘中估算',
        navDate,
        coveragePct: estimate.coveragePct,
      };
    }),
  );
};

const buildTodayProfitMessage = async (env: Env, options?: { intraday?: boolean; detailed?: boolean }) => {
  const payload = await readGistBackup(env);
  const funds = payload.funds.filter((fund) => fund.holdingShares > 0 && fund.currentNav > 0);
  const useIntraday = Boolean(options?.intraday);
  const profitFunds = useIntraday
    ? await buildIntradayProfitFunds(funds)
    : funds.map<IntradayProfitFundSnapshot>((fund) => ({
        code: fund.code,
        name: fund.name,
        holdingShares: fund.holdingShares,
        marketValue: fund.holdingShares * fund.currentNav,
        dayChangePct: fund.dayChangePct,
        dayChangeVal: fund.dayChangeVal,
        source: '官方净值',
        navDate: fund.lastUpdate,
      }));
  const totalAssets = profitFunds.reduce((sum, fund) => sum + fund.marketValue, 0);
  const totalDayGain = profitFunds.reduce((sum, fund) => sum + fund.dayChangeVal, 0);
  const totalDayGainPct = totalAssets - totalDayGain > 0 ? (totalDayGain / (totalAssets - totalDayGain)) * 100 : 0;
  const sortedFunds = [...profitFunds].sort((a, b) => b.dayChangeVal - a.dayChangeVal);
  const topGain = sortedFunds[0];
  const topLoss = sortedFunds.at(-1);
  const marketPhase = getChinaMarketPhase();
  const phaseLabel = CHINA_MARKET_PHASE_LABELS[marketPhase];
  const estimatedCount = profitFunds.filter((fund) => fund.source === '盘中估算').length;
  const unavailableCount = profitFunds.filter((fund) => fund.source === '估值不可用').length;
  const detailed = Boolean(options?.detailed);
  const dataHint = useIntraday
    ? `以下为 Worker 实时拉取公开前十大持仓和腾讯行情后的盘中估算，不是基金官方净值。盘中估算 ${estimatedCount}/${funds.length} 只。`
    : marketPhase === 'preMarket'
      ? '当前为盘前，以下为上次同步数据或最近一次净值数据，不代表今日盘中实时收益。'
      : '以下基于当前 Gist 最新同步数据。';
  const fundLines = sortedFunds.map(
    (fund) =>
      `- ${fund.name}: ${formatMoney(fund.dayChangeVal)} (${formatPct(fund.dayChangePct)})，${useIntraday ? fund.source : '最新同步'}${fund.coveragePct ? `，覆盖权重 ${round(fund.coveragePct).toFixed(2)}%` : ''}，市值 ${round(fund.marketValue).toFixed(2)} 元`,
  );
  const title = `${useIntraday ? '养基AI盘中实时收益' : '养基AI今日盈利'}\n时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

  if (useIntraday && !detailed) {
    const contributionLines = sortedFunds.map((fund, index) => {
      if (fund.source === '估值不可用' || fund.source === '盘前未估算') {
        return `${index + 1}. ${fund.name} ${fund.source}`;
      }
      return `${index + 1}. ${fund.name} ${formatMoney(fund.dayChangeVal)} (${formatPct(fund.dayChangePct)})`;
    });

    return [
      '盘中收益',
      `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
      '',
      `盘中估算：${formatMoney(totalDayGain)}（${formatPct(totalDayGainPct)}）`,
      `可估算：${estimatedCount}/${funds.length} 只`,
      '',
      '贡献：',
      ...contributionLines,
    ].join('\n');
  }

  return [
    title,
    '',
    `当前A股阶段：${phaseLabel}`,
    dataHint,
    '',
    `今日总盈亏：${formatMoney(totalDayGain)}`,
    `今日收益率：${formatPct(totalDayGainPct)}`,
    `当前总资产：${round(totalAssets).toFixed(2)} 元`,
    useIntraday && unavailableCount > 0 ? `盘中估值不可用：${unavailableCount} 只` : '',
    '',
    '持仓明细：',
    ...fundLines,
    '',
    topGain ? `贡献最高：${topGain.name} ${formatMoney(topGain.dayChangeVal)}` : '',
    topLoss && topLoss !== topGain ? `拖累最大：${topLoss.name} ${formatMoney(topLoss.dayChangeVal)}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
};

const formatQuantMetric = (value: number | undefined, suffix = '%') => {
  if (value === undefined) return '缺失';
  return `${value >= 0 ? '+' : ''}${round(value).toFixed(2)}${suffix}`;
};

const buildQuantAnalysisMessage = async (env: Env) => {
  const payload = await readGistBackup(env);
  const funds = payload.funds.filter((fund) => fund.holdingShares > 0 && fund.currentNav > 0);
  const signals = await Promise.all(
    funds.map(async (fund) => ({
      fund,
      marketValue: fund.holdingShares * fund.currentNav,
      signal: await getFundQuantSignal(fund.code),
    })),
  );
  const totalAssets = signals.reduce((sum, item) => sum + item.marketValue, 0);
  const available = signals.filter((item) => item.signal.dataStatus === 'available');
  const portfolioScore =
    totalAssets > 0
      ? available.reduce((sum, item) => sum + item.signal.score * (item.marketValue / totalAssets), 0)
      : 0;
  const sorted = [...signals].sort((a, b) => b.signal.score - a.signal.score);

  const fundLines = sorted.map((item, index) => {
    const { fund, signal } = item;
    if (signal.dataStatus !== 'available') {
      return `${index + 1}. ${fund.name}：观望，${signal.reason}`;
    }

    return `${index + 1}. ${fund.name}：${signal.signal}，评分 ${formatQuantMetric(signal.score, '')}，20日 ${formatQuantMetric(signal.return20d)}，60日 ${formatQuantMetric(signal.return60d)}，回撤 ${formatQuantMetric(signal.maxDrawdown120d)}`;
  });

  return [
    '养基AI量化分析',
    `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    '',
    `组合量化信号：${getQuantSignalLabel(portfolioScore)}`,
    `组合量化评分：${round(portfolioScore).toFixed(2)}`,
    `覆盖：${available.length}/${funds.length} 只`,
    '说明：评分只基于历史净值动量、波动率和最大回撤；估值因子暂缺，不代表基金便宜或昂贵。',
    '',
    '基金明细：',
    ...fundLines,
  ].join('\n');
};

const buildAnalysisMessage = async (
  env: Env,
  options?: { question?: string; maxLength?: number; title?: string },
) => {
  const startedAt = Date.now();
  const payload = await readGistBackup(env);
  logStepDuration('读取 Gist', startedAt);

  const isShortAnalysis = options?.question === SHORT_ANALYSIS_QUESTION;
  const snapshotStartedAt = Date.now();
  const snapshot = await buildHoldingsSnapshot(payload, {
    holdingsTimeoutMs: isShortAnalysis ? FAST_ANALYSIS_FUND_HOLDINGS_TIMEOUT_MS : DEFAULT_FUND_HOLDINGS_TIMEOUT_MS,
    quantMode: isShortAnalysis ? 'cachedOnly' : 'full',
  });
  logStepDuration('构建持仓快照', snapshotStartedAt);

  const externalStartedAt = Date.now();
  const [marketSnapshot, newsSnapshot, fundFlowSnapshot] = await Promise.all([
    fetchMarketSnapshot(env),
    fetchNewsSnapshot(env, snapshot),
    fetchFundFlowSnapshot(env),
  ]);
  logStepDuration('读取市场/新闻/资金流', externalStartedAt);
  const heldFundCodeSet = new Set(snapshot.heldFundCodes);
  const snapshotWithFallback: HoldingsSnapshot = {
    ...snapshot,
    fallbackBuildCandidates: buildFallbackBuildCandidates(fundFlowSnapshot, heldFundCodeSet),
  };
  const aiStartedAt = Date.now();
  const analysis = await analyzeHoldings(
    env,
    { holdings: snapshotWithFallback, marketSnapshot, newsSnapshot, fundFlowSnapshot },
    options?.question,
  );
  logStepDuration('AI 分析', aiStartedAt);
  logStepDuration('完整分析流程', startedAt);
  const title = `${options?.title || '养基AI持仓分析'}\n时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
  const body = truncateForTelegram(analysis, options?.maxLength);
  const text = `${title}\n${body}`;
  return {
    text,
    holdings: snapshot.holdings.length,
    totalAssets: snapshot.totalAssets,
  };
};

const runReminder = async (env: Env) => {
  const analysisMessage = await buildAnalysisMessage(env);
  const sentMessages = await sendTelegramMessage(env, analysisMessage.text);

  return {
    ok: true,
    holdings: analysisMessage.holdings,
    totalAssets: analysisMessage.totalAssets,
    sentMessages,
  };
};

const resolveScheduledAnalysisType = (cron: string): ScheduledAnalysisType => {
  if (cron === '35 3 * * 1-5') return 'midday';
  if (cron === '30 6 * * 1-5') return 'lateSession';
  return 'close';
};

const runScheduledReminder = async (env: Env, analysisType: ScheduledAnalysisType) => {
  const config = SCHEDULED_ANALYSIS_CONFIG[analysisType];
  const analysisMessage = await buildAnalysisMessage(env, config);
  const sentMessages = await sendTelegramMessage(env, analysisMessage.text);

  return {
    ok: true,
    analysisType,
    holdings: analysisMessage.holdings,
    totalAssets: analysisMessage.totalAssets,
    sentMessages,
  };
};

const isAuthorizedManualRun = (request: Request, env: Env) => {
  if (!env.CRON_SECRET) return true;
  return request.headers.get('Authorization') === `Bearer ${env.CRON_SECRET}`;
};

const isAuthorizedTelegramWebhook = (request: Request, env: Env) => {
  if (!env.TELEGRAM_WEBHOOK_SECRET) return true;
  return request.headers.get('X-Telegram-Bot-Api-Secret-Token') === env.TELEGRAM_WEBHOOK_SECRET;
};

const resolveTelegramCommandConfig = (text: string) => {
  const normalized = text.trim().replace(/^\//, '').toLowerCase();
  const command = TELEGRAM_ANALYSIS_COMMANDS.find((item) => item.toLowerCase() === normalized);
  return command ? COMMAND_QUESTION_MAP[command] : null;
};

const isProfitCommand = (text: string) => {
  const normalized = text.trim().replace(/^\//, '').toLowerCase();
  return PROFIT_COMMANDS.some((command) => command.toLowerCase() === normalized);
};

const isIntradayProfitCommand = (text: string) => {
  const normalized = text.trim().replace(/^\//, '').toLowerCase();
  return INTRADAY_PROFIT_COMMANDS.some((command) => command.toLowerCase() === normalized);
};

const isDetailedIntradayProfitCommand = (text: string) => {
  const normalized = text.trim().replace(/^\//, '').toLowerCase();
  return DETAILED_INTRADAY_PROFIT_COMMANDS.some((command) => command.toLowerCase() === normalized);
};

const isQuantAnalysisCommand = (text: string) => {
  const normalized = text.trim().replace(/^\//, '').toLowerCase();
  return QUANT_ANALYSIS_COMMANDS.some((command) => command.toLowerCase() === normalized);
};

const handleTelegramWebhook = async (request: Request, env: Env) => {
  if (!isAuthorizedTelegramWebhook(request, env)) {
    return json({ ok: false, error: '未授权' }, 401);
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text?.trim() || '';
  if (!chatId) return json({ ok: true, ignored: true });

  const chatIdStr = String(chatId);
  if (chatIdStr !== requireEnv(env, 'TELEGRAM_CHAT_ID')) {
    return json({ ok: true, ignored: true });
  }

  if (isProfitCommand(text) || isIntradayProfitCommand(text) || isDetailedIntradayProfitCommand(text)) {
    const profitMessage = await buildTodayProfitMessage(env, {
      intraday: isIntradayProfitCommand(text) || isDetailedIntradayProfitCommand(text),
      detailed: isDetailedIntradayProfitCommand(text),
    });
    const sentMessages = await sendTelegramMessage(env, profitMessage, chatIdStr);
    return json({ ok: true, handled: 'todayProfit', sentMessages });
  }

  if (isQuantAnalysisCommand(text)) {
    const quantMessage = await buildQuantAnalysisMessage(env);
    const sentMessages = await sendTelegramMessage(env, quantMessage, chatIdStr);
    return json({ ok: true, handled: 'quantAnalysis', sentMessages });
  }

  const commandConfig = resolveTelegramCommandConfig(text);
  if (!commandConfig) {
    const sentMessages = await sendTelegramMessage(env, TELEGRAM_HELP_TEXT, chatIdStr);
    return json({ ok: true, handled: 'help', sentMessages });
  }

  const pendingMessages = await sendTelegramMessage(env, TELEGRAM_ANALYSIS_PENDING_TEXT, chatIdStr);
  try {
    const analysisMessage = await buildAnalysisMessage(env, commandConfig);
    const analysisMessages = await sendTelegramMessage(env, analysisMessage.text, chatIdStr);
    return json({
      ok: true,
      handled: 'analysis',
      holdings: analysisMessage.holdings,
      totalAssets: analysisMessage.totalAssets,
      sentMessages: pendingMessages + analysisMessages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    const failureMessages = await sendTelegramMessage(env, `分析失败：${message}`, chatIdStr);
    return json(
      { ok: false, handled: 'analysis', error: message, sentMessages: pendingMessages + failureMessages },
      500,
    );
  }
};

const extractQqOfficialCommandText = (content: string | undefined) => {
  return (content || '')
    .replace(/<@![^>]+>/g, '')
    .replace(/<@[^>]+>/g, '')
    .trim();
};

const isAuthorizedQqOfficialMessage = (env: Env, message: QqOfficialGroupAtMessage) => {
  const allowedGroups = parseCsvSet(env.QQ_OFFICIAL_ALLOWED_GROUP_OPENIDS);
  const allowedMembers = parseCsvSet(env.QQ_OFFICIAL_ALLOWED_MEMBER_OPENIDS);
  const groupOpenid = message.group_openid || '';
  const memberOpenid = message.author?.member_openid || '';
  const allowedGroup = allowedGroups.size > 0 && allowedGroups.has(groupOpenid);
  const allowedMember = allowedMembers.size > 0 && allowedMembers.has(memberOpenid);
  if (!allowedGroup || !allowedMember) {
    console.warn('忽略未授权 QQ 官方机器人消息', { groupOpenid, memberOpenid });
  }
  return allowedGroup && allowedMember;
};

const handleQqOfficialWebhook = async (request: Request, env: Env) => {
  if (!isEnabled(env.QQ_OFFICIAL_ENABLED, false)) {
    return json({ ok: false, error: 'QQ 官方机器人未启用' }, 404);
  }

  const rawBody = await request.text();
  const payload = JSON.parse(rawBody) as QqOfficialPayload;

  if (payload.op === 13) {
    return json(await buildQqOfficialValidationResponse(env, payload.d as QqOfficialValidationPayload));
  }

  const hasSignatureHeaders =
    request.headers.has('X-Signature-Ed25519') || request.headers.has('X-Signature-Timestamp');
  if (hasSignatureHeaders && !(await verifyQqOfficialSignature(env, rawBody, request))) {
    return json({ ok: false, error: 'QQ 官方回调签名无效' }, 401);
  }

  if (payload.t !== 'GROUP_AT_MESSAGE_CREATE') {
    return json({ ok: true, ignored: true });
  }

  const message = payload.d as QqOfficialGroupAtMessage;
  if (!message.group_openid || !message.id) {
    return json({ ok: true, ignored: true });
  }

  if (!isAuthorizedQqOfficialMessage(env, message)) {
    return json({ ok: true, ignored: true });
  }

  const commandText = extractQqOfficialCommandText(message.content);
  if (
    isProfitCommand(commandText) ||
    isIntradayProfitCommand(commandText) ||
    isDetailedIntradayProfitCommand(commandText)
  ) {
    const profitMessage = await buildTodayProfitMessage(env, {
      intraday: isIntradayProfitCommand(commandText) || isDetailedIntradayProfitCommand(commandText),
      detailed: isDetailedIntradayProfitCommand(commandText),
    });
    const sentMessages = await sendQqOfficialGroupTextChunks({
      env,
      groupOpenid: message.group_openid,
      text: profitMessage,
      msgId: message.id,
      startSeq: 1,
    });
    return json({ ok: true, handled: 'todayProfit', sentMessages });
  }

  if (isQuantAnalysisCommand(commandText)) {
    const quantMessage = await buildQuantAnalysisMessage(env);
    const sentMessages = await sendQqOfficialGroupTextChunks({
      env,
      groupOpenid: message.group_openid,
      text: quantMessage,
      msgId: message.id,
      startSeq: 1,
    });
    return json({ ok: true, handled: 'quantAnalysis', sentMessages });
  }

  const commandConfig = resolveTelegramCommandConfig(commandText);
  if (!commandConfig) {
    return json({ ok: true, handled: 'help' });
  }

  const pendingMessages = await sendQqOfficialGroupTextChunks({
    env,
    groupOpenid: message.group_openid,
    text: TELEGRAM_ANALYSIS_PENDING_TEXT,
    msgId: message.id,
    startSeq: 1,
  });

  try {
    const analysisMessage = await buildAnalysisMessage(env, commandConfig);
    const analysisMessages = await sendQqOfficialGroupTextChunks({
      env,
      groupOpenid: message.group_openid,
      text: analysisMessage.text,
      msgId: message.id,
      startSeq: 2,
    });

    return json({
      ok: true,
      handled: 'analysis',
      holdings: analysisMessage.holdings,
      totalAssets: analysisMessage.totalAssets,
      sentMessages: pendingMessages + analysisMessages,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const failureMessages = await sendQqOfficialGroupTextChunks({
      env,
      groupOpenid: message.group_openid,
      text: `分析失败：${errorMessage}`,
      msgId: message.id,
      startSeq: 2,
    });
    return json(
      {
        ok: false,
        handled: 'analysis',
        error: errorMessage,
        sentMessages: pendingMessages + failureMessages,
      },
      500,
    );
  }
};

const extractOneBotCommandText = (event: OneBotMessageEvent) => {
  const text = typeof event.raw_message === 'string' ? event.raw_message : typeof event.message === 'string' ? event.message : '';
  return text
    .replace(/\[CQ:at,[^\]]+\]/g, '')
    .replace(/\[CQ:[^\]]+\]/g, '')
    .trim();
};

const isAuthorizedOneBotMessage = (env: Env, event: OneBotMessageEvent) => {
  const allowedGroups = parseCsvSet(env.QQ_ALLOWED_GROUP_IDS);
  const allowedUsers = parseCsvSet(env.QQ_ALLOWED_USER_IDS);
  const groupId = String(event.group_id || '');
  const userId = String(event.user_id || '');
  const allowedGroup = allowedGroups.size > 0 && allowedGroups.has(groupId);
  const allowedUser = allowedUsers.size > 0 && allowedUsers.has(userId);
  if (!allowedGroup || !allowedUser) {
    console.warn('忽略未授权 OneBot 消息', { groupId, userId });
  }
  return allowedGroup && allowedUser;
};

const handleOneBotWebhook = async (request: Request, env: Env) => {
  if (!isEnabled(env.QQ_BOT_ENABLED, false)) {
    return json({ ok: false, error: 'QQ OneBot 未启用' }, 404);
  }

  const event = (await request.json().catch(() => null)) as OneBotMessageEvent | null;
  if (!event || event.post_type !== 'message' || event.message_type !== 'group') {
    return json({ ok: true, ignored: true });
  }

  const groupId = String(event.group_id || '');
  if (!groupId || !event.user_id) return json({ ok: true, ignored: true });

  if (!isAuthorizedOneBotMessage(env, event)) {
    return json({ ok: true, ignored: true });
  }

  const commandText = extractOneBotCommandText(event);
  if (
    isProfitCommand(commandText) ||
    isIntradayProfitCommand(commandText) ||
    isDetailedIntradayProfitCommand(commandText)
  ) {
    const profitMessage = await buildTodayProfitMessage(env, {
      intraday: isIntradayProfitCommand(commandText) || isDetailedIntradayProfitCommand(commandText),
      detailed: isDetailedIntradayProfitCommand(commandText),
    });
    const sentMessages = await sendOneBotGroupTextChunks(env, groupId, profitMessage);
    return json({ ok: true, handled: 'todayProfit', sentMessages });
  }

  if (isQuantAnalysisCommand(commandText)) {
    const quantMessage = await buildQuantAnalysisMessage(env);
    const sentMessages = await sendOneBotGroupTextChunks(env, groupId, quantMessage);
    return json({ ok: true, handled: 'quantAnalysis', sentMessages });
  }

  const commandConfig = resolveTelegramCommandConfig(commandText);
  if (!commandConfig) {
    return json({ ok: true, ignored: true });
  }

  const pendingMessages = await sendOneBotGroupTextChunks(env, groupId, TELEGRAM_ANALYSIS_PENDING_TEXT);
  try {
    const analysisMessage = await buildAnalysisMessage(env, commandConfig);
    const analysisMessages = await sendOneBotGroupTextChunks(env, groupId, analysisMessage.text);
    return json({
      ok: true,
      handled: 'analysis',
      holdings: analysisMessage.holdings,
      totalAssets: analysisMessage.totalAssets,
      sentMessages: pendingMessages + analysisMessages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    const failureMessages = await sendOneBotGroupTextChunks(env, groupId, `分析失败：${message}`);
    return json(
      { ok: false, handled: 'analysis', error: message, sentMessages: pendingMessages + failureMessages },
      500,
    );
  }
};

const setupTelegramWebhook = async (request: Request, env: Env) => {
  if (!isAuthorizedManualRun(request, env)) {
    return json({ ok: false, error: '未授权' }, 401);
  }
  const secretToken = requireEnv(env, 'TELEGRAM_WEBHOOK_SECRET');
  const token = requireEnv(env, 'TELEGRAM_BOT_TOKEN');
  const url = new URL(request.url);
  const webhookUrl = `${url.origin}/telegram`;
  const result = await fetchJson<unknown>(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, secret_token: secretToken }),
    },
    '设置 Telegram webhook',
  );

  return json({ ok: true, webhookUrl, result });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json({ ok: true, service: 'telegram-ai-reminder' });
    }

    if (url.pathname === '/telegram' && request.method === 'POST') {
      try {
        return await handleTelegramWebhook(request, env);
      } catch (error) {
        return json(
          { ok: false, error: error instanceof Error ? error.message : '未知错误' },
          500,
        );
      }
    }

    if (url.pathname === '/qq-official' && request.method === 'POST') {
      try {
        return await handleQqOfficialWebhook(request, env);
      } catch (error) {
        return json(
          { ok: false, error: error instanceof Error ? error.message : '未知错误' },
          500,
        );
      }
    }

    if (url.pathname === '/qq' && request.method === 'POST') {
      try {
        return await handleOneBotWebhook(request, env);
      } catch (error) {
        return json(
          { ok: false, error: error instanceof Error ? error.message : '未知错误' },
          500,
        );
      }
    }

    if (url.pathname === '/setup-telegram-webhook' && request.method === 'POST') {
      try {
        return await setupTelegramWebhook(request, env);
      } catch (error) {
        return json(
          { ok: false, error: error instanceof Error ? error.message : '未知错误' },
          500,
        );
      }
    }

    if (url.pathname === '/run' && request.method === 'POST') {
      if (!isAuthorizedManualRun(request, env)) {
        return json({ ok: false, error: '未授权' }, 401);
      }

      try {
        return json(await runReminder(env));
      } catch (error) {
        return json(
          { ok: false, error: error instanceof Error ? error.message : '未知错误' },
          500,
        );
      }
    }

    return json({ ok: false, error: 'Not Found' }, 404);
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const analysisType = resolveScheduledAnalysisType(event.cron);
    ctx.waitUntil(
      runScheduledReminder(env, analysisType).catch(async (error) => {
        const message = error instanceof Error ? error.message : '未知错误';
        await sendTelegramMessage(env, `${SCHEDULED_ANALYSIS_CONFIG[analysisType].title}定时任务失败：${message}`).catch(
          () => undefined,
        );
      }),
    );
  },
};
