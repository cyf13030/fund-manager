/// <reference types="vitest/globals" />
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

import worker, { __resetTelegramAiReminderStateForTests } from './index';

ed.hashes.sha512 = (...messages) => sha512(ed.etc.concatBytes(...messages));

const backupPayload = {
  version: 1,
  exportDate: '2026-05-18T10:00:00.000Z',
  investmentProfile: {
    riskTolerance: '稳健',
    investmentHorizon: '3-5年',
    externalAssets: '现金 5 万',
  },
  availableAssets: 5000,
  fundDailyEarnings: {
    all: {
      '000001': [
        { date: '2026-05-16', earnings: 0.9, rate: 0.75 },
        { date: '2026-05-17', earnings: 1.2, rate: 1 },
        { date: '2026-05-18', earnings: 1.8, rate: 1.52 },
      ],
    },
  },
  funds: [
    {
      code: '000001',
      name: '测试基金A',
      platform: '默认账户',
      holdingShares: 100,
      costPrice: 1,
      currentNav: 1.2,
      lastUpdate: '2026-05-18',
      dayChangePct: 1.5,
      dayChangeVal: 1.8,
      settlementDays: 1,
      pendingTransactions: [
        {
          id: 'pending-buy-1',
          type: 'buy',
          date: '2026-05-21',
          time: 'after15',
          amount: 1000,
          settlementDate: '2099-01-02',
          settled: false,
        },
        {
          id: 'pending-sell-1',
          type: 'sell',
          date: '2026-05-21',
          time: 'before15',
          amount: 10,
          grossAmount: 120,
          netOutAmount: 119,
          settlementDate: '2099-01-02',
          settled: false,
        },
      ],
    },
  ],
  watchlists: [
    {
      code: '000001',
      name: '测试基金A',
      type: 'fund',
      platform: '默认账户',
      anchorPrice: 1.1,
      anchorDate: '2026-05-01',
      currentPrice: 1.2,
      dayChangePct: 1.5,
      lastUpdate: '2026-05-18',
    },
    {
      code: '000002',
      name: '未持有基金B',
      type: 'fund',
      platform: '默认账户',
      anchorPrice: 1.5,
      anchorDate: '2026-05-01',
      currentPrice: 1.35,
      dayChangePct: -0.8,
      lastUpdate: '2026-05-18',
    },
    {
      code: 'sh000300',
      name: '沪深300',
      type: 'index',
      anchorPrice: 4000,
      anchorDate: '2026-05-01',
      currentPrice: 4100,
      dayChangePct: 0.3,
      lastUpdate: '2026-05-18',
    },
  ],
};

const backupPayloadWithoutBuildCandidates = {
  ...backupPayload,
  watchlists: backupPayload.watchlists.filter((item) => item.code !== '000002'),
};

const holdingsPayload = {
  data: {
    portfolioDate: '2026-03-31',
    equityHoldings: [
      { ticker: '600519', name: '贵州茅台', weight: 8.5, sector: '消费' },
      { ticker: '300750', name: '宁德时代', weight: 5.2, sector: '新能源' },
    ],
  },
};

const marketText =
  'v_sh000001="1~上证指数~000001~3050.12~~~~~~~~~~~~~~~~~~~~~~~~~~~20260518150000~12.34~0.41";\n' +
  'v_sz399006="51~创业板指~399006~2200.50~~~~~~~~~~~~~~~~~~~~~~~~~~~20260518150000~-8.80~-0.40";';
const yahooChartPayload = {
  chart: {
    result: [
      {
        meta: {
          symbol: '^GSPC',
          shortName: 'S&P 500',
          regularMarketPrice: 5100,
          chartPreviousClose: 5000,
          regularMarketTime: 1779397704,
        },
        timestamp: [1779283800, 1779370200],
        indicators: { quote: [{ close: [5000, 5100] }] },
      },
    ],
    error: null,
  },
};
const stockQuoteText =
  'v_s_sh600519="1~贵州茅台~600519~100.00~0.00~3.00";\n' +
  'v_s_sz300750="1~宁德时代~300750~100.00~0.00~1.00";';
const eastMoneyLatestNavText =
  'var apidata={content:"<table><tr><td>2026-05-18</td><td>1.2000</td><td>1.2000</td><td>1.50%</td></tr><tr><td>2026-05-15</td><td>1.1800</td><td>1.1800</td><td>0.20%</td></tr></table>"};';
const buildEastMoneyHistoricalNavText = (length: number, startIndex = 0) =>
  `var apidata={content:"<table>${Array.from({ length }, (_, index) => {
    const navIndex = startIndex + index;
    const month = String(Math.floor(navIndex / 28) + 1).padStart(2, '0');
    const day = String((navIndex % 28) + 1).padStart(2, '0');
    const nav = (1.4 - navIndex * 0.002).toFixed(4);
    return `<tr><td>2026-${month}-${day}</td><td>${nav}</td><td>${nav}</td><td>0.10%</td></tr>`;
  }).join('')}</table>"};`;
const eastMoneyHistoricalNavText = `var apidata={content:"<table>${Array.from({ length: 130 }, (_, index) => {
  const month = String(Math.floor(index / 28) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');
  const nav = (1.4 - index * 0.002).toFixed(4);
  return `<tr><td>2026-${month}-${day}</td><td>${nav}</td><td>${nav}</td><td>0.10%</td></tr>`;
}).join('')}</table>"};`;

const eastMoneyNewsPayload = {
  data: {
    list: [
      {
        title: 'A股人工智能板块午后走强',
        mediaName: '东方财富',
        url: 'https://finance.eastmoney.com/a/test.html',
        showTime: '2026-05-18 12:00:00',
      },
    ],
  },
};

const sinaNewsPayload = {
  result: {
    data: [
      {
        title: '新能源板块震荡回升',
        source: '新浪财经',
        url: 'https://finance.sina.com.cn/test.html',
        ctime: String(Math.floor(Date.now() / 1000)),
      },
      {
        title: '锂电池产业链订单改善',
        source: '新浪财经',
        url: 'https://finance.sina.com.cn/lithium.html',
        ctime: String(Math.floor(Date.now() / 1000)),
      },
    ],
  },
};
const holdingsPayloadWithoutSector = {
  data: {
    portfolioDate: '2026-03-31',
    equityHoldings: [
      { ticker: '002475', name: '立讯精密', weight: 8.5 },
      { ticker: '300308', name: '中际旭创', weight: 5.2 },
    ],
  },
};

const emptyEastMoneyNewsPayload = { data: { list: [] } };
const emptySinaNewsPayload = { result: { data: [] } };
const eastMoneyFundFlowPayload = {
  data: {
    diff: [
      { f12: 'BK0800', f14: '人工智能', f3: 2.1, f62: 3200000000, f184: 4.5 },
      { f12: 'BK0428', f14: '新能源', f3: 1.2, f62: 1800000000, f184: 2.8 },
    ],
  },
};
const eastMoneyElectronicsFundFlowPayload = {
  data: {
    diff: [
      { f12: 'BK1201', f14: '电子', f3: 3.5, f62: 25491000000, f184: 8.8 },
      { f12: 'BK1215', f14: '通信', f3: 2.2, f62: 6786000000, f184: 4.2 },
    ],
  },
};
const eastMoneyMarketBreadthPayload = {
  data: {
    total: 4,
    diff: [
      { f12: '000001', f14: '平安银行', f37: 1.2, f38: 1000000000 },
      { f12: '000002', f14: '万科A', f37: -0.8, f38: 800000000 },
      { f12: '000003', f14: '样本上涨', f37: 10.1, f38: 300000000 },
      { f12: '000004', f14: '样本下跌', f37: -10.2, f38: 200000000 },
    ],
  },
};
const eastMoneyNorthboundPayload = {
  data: {
    hk2sh: { dayNetAmtIn: 1200000000, date2: '2026-05-18' },
    hk2sz: { dayNetAmtIn: 800000000, date2: '2026-05-18' },
    sz2hk: { dayNetAmtIn: 300000000, date2: '2026-05-18' },
  },
};
const unavailableEastMoneyFundFlowPayload = {
  data: {
    diff: [
      { f12: 'BK0800', f14: '人工智能', f3: '-', f62: '-', f184: '-' },
      { f12: 'BK0428', f14: '新能源', f3: '-', f62: '-', f184: '-' },
    ],
  },
};
const emptyEastMoneyFundFlowPayload = {
  data: {
    diff: [],
  },
};

const env = {
  TELEGRAM_BOT_TOKEN: 'telegram-token',
  TELEGRAM_CHAT_ID: '123456',
  GITHUB_TOKEN: 'github-token',
  GIST_ID: 'gist-id',
  GIST_FILENAME: 'fund-manager-sync.json',
  AI_PROVIDER: 'customOpenAi',
  AI_API_KEY: 'ai-token',
  AI_MODEL: 'test-model',
  AI_BASE_URL: 'https://example.com/v1',
  AI_MODE: 'deep',
  AI_QUESTION:
    '请基于当前持仓、A 股市场指数、市场情绪、中文财经新闻和投资画像，重点判断当前是否适合加仓、是否需要减仓、是否达到清仓条件。',
};

const qqEnv = {
  ...env,
  QQ_OFFICIAL_ENABLED: 'true',
  QQ_OFFICIAL_APP_ID: '1903963785',
  QQ_OFFICIAL_APP_SECRET: 'test-secret',
  QQ_OFFICIAL_ALLOWED_GROUP_OPENIDS: 'group-openid',
  QQ_OFFICIAL_ALLOWED_MEMBER_OPENIDS: 'member-openid',
};

const oneBotEnv = {
  ...env,
  QQ_BOT_ENABLED: 'true',
  QQ_BOT_API_BASE: 'https://onebot.example',
  QQ_BOT_ACCESS_TOKEN: 'onebot-token',
  QQ_ALLOWED_GROUP_IDS: '123456789',
  QQ_ALLOWED_USER_IDS: '987654321',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const mockBaseSuccessfulFetches = (
  fetchMock: ReturnType<typeof vi.fn>,
  eastMoneyNews = eastMoneyNewsPayload,
  sinaNews = sinaNewsPayload,
) => {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('api.github.com/gists')) {
      return Promise.resolve(
        jsonResponse({
          files: {
            'fund-manager-sync.json': {
              content: JSON.stringify(backupPayload),
            },
          },
        }),
      );
    }
    if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
    if (url.includes('fundf10.eastmoney.com')) return Promise.resolve(new Response(eastMoneyHistoricalNavText));
    if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
    if (url.includes('query1.finance.yahoo.com')) return Promise.resolve(jsonResponse(yahooChartPayload));
    if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNews));
    if (url.includes('push2.eastmoney.com/api/qt/kamt/get')) {
      return Promise.resolve(jsonResponse(eastMoneyNorthboundPayload));
    }
    if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
      if (url.includes('f37') || url.includes('f38')) {
        return Promise.resolve(jsonResponse(eastMoneyMarketBreadthPayload));
      }
      return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
    }
    if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNews));
    if (url.includes('chat/completions')) {
      return Promise.resolve(jsonResponse({ choices: [{ message: { content: '组合整体表现良好。' } }] }));
    }
    if (url.includes('generativelanguage.googleapis.com')) {
      return Promise.resolve(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'Gemini 分析' }] } }] }),
      );
    }
    if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
    return Promise.resolve(jsonResponse({}));
  });
};

const findAiRequestBody = (fetchMock: ReturnType<typeof vi.fn>) => {
  const call = fetchMock.mock.calls.find((item) => String(item[0]).includes('/chat/completions'));
  if (!call) throw new Error('AI request not found');
  return JSON.parse(call[1].body as string) as { messages: Array<{ role: string; content: string }> };
};

const waitForScheduledTasks = async (tasks: Promise<unknown>[]) => {
  await Promise.all(tasks);
};

const buildQqRequest = (body: unknown, headers?: HeadersInit) =>
  new Request('https://worker.example/qq-official', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const buildOneBotRequest = (body: unknown) =>
  new Request('https://worker.example/qq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const buildQqSeed = (secret: string) => {
  let seed = secret;
  while (seed.length < 32) seed += seed;
  return new TextEncoder().encode(seed.slice(0, 32));
};

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const buildSignedQqRequest = async (body: unknown, secret = qqEnv.QQ_OFFICIAL_APP_SECRET) => {
  const rawBody = JSON.stringify(body);
  const timestamp = '1725442341';
  const signature = bytesToHex(
    await ed.sign(new TextEncoder().encode(`${timestamp}${rawBody}`), buildQqSeed(secret)),
  );
  return new Request('https://worker.example/qq-official', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-Ed25519': signature,
      'X-Signature-Timestamp': timestamp,
    },
    body: rawBody,
  });
};

describe('telegram ai reminder worker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetTelegramAiReminderStateForTests();
  });

  it('news-summary endpoint returns structured public insight data', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(new Request('https://worker.example/news-summary'), env);
    const body = (await response.json()) as {
      ok: boolean;
      summaryLine: string;
      cards: Array<{ title: string; value: string }>;
      sections: Array<{
        title: string;
        items: Array<{
          title: string;
          time: string;
          url?: string;
          relatedToPortfolio?: boolean;
          relationReason?: string;
        }>;
      }>;
      sourceStatus: Array<{ label: string; value: string }>;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(body.ok).toBe(true);
    expect(body.summaryLine).toContain('上证指数');
    expect(body.cards[0].title).toBe('市场温度');
    expect(body.cards.some((card) => card.title === '资金流')).toBe(true);
    expect(body.cards.some((card) => card.title === '市场宽度' && card.value.includes('涨'))).toBe(true);
    expect(body.cards.some((card) => card.title === '行业轮动')).toBe(true);
    expect(body.cards.some((card) => card.title === '成交量')).toBe(true);
    expect(body.cards.some((card) => card.title === '资金面')).toBe(true);
    expect(body.cards.some((card) => card.title === '持仓匹配' && card.value === '低')).toBe(true);
    expect(body.sections.some((section) => section.title === '盘后消息')).toBe(true);
    expect(body.sections.find((section) => section.title === 'A 股指数')?.items[0].time).toBe('15:00');
    expect(body.sections.find((section) => section.title === '资金流')?.items[0].title).toBe(
      '人工智能 +32.00 亿',
    );
    expect(body.sections.find((section) => section.title === '资金流')?.items[0].time).toMatch(
      /^\d{2}:\d{2}$/,
    );
    const portfolioNews = body.sections
      .find((section) => section.title === '盘后消息')
      ?.items.find((item) => item.title.includes('新能源'));
    expect(portfolioNews?.url).toBe('https://finance.sina.com.cn/test.html');
    expect(portfolioNews?.relatedToPortfolio).toBe(true);
    expect(portfolioNews?.relationReason).toContain('新能源');
    const synonymNews = body.sections
      .find((section) => section.title === '盘后消息')
      ?.items.find((item) => item.title.includes('锂电池'));
    expect(synonymNews?.relatedToPortfolio).toBe(true);
    expect(synonymNews?.relationReason).toContain('来源：新能源');
    expect(body.sourceStatus.some((item) => item.label === '盘后消息')).toBe(true);
    expect(body.sourceStatus.some((item) => item.label === '北向资金')).toBe(true);
    expect(body.sourceStatus.some((item) => item.label === '市场宽度')).toBe(true);
  });

  it('持仓缺少 sector 时会用重仓股关键词弱匹配资金主线', async () => {
    const fetchMock = vi.fn();
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({
            files: {
              'fund-manager-sync.json': {
                content: JSON.stringify(backupPayload),
              },
            },
          }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayloadWithoutSector));
      if (url.includes('fundf10.eastmoney.com')) return Promise.resolve(new Response(eastMoneyHistoricalNavText));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('query1.finance.yahoo.com')) return Promise.resolve(jsonResponse(yahooChartPayload));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/kamt/get')) {
        return Promise.resolve(jsonResponse(eastMoneyNorthboundPayload));
      }
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        if (url.includes('f37') || url.includes('f38')) {
          return Promise.resolve(jsonResponse(eastMoneyMarketBreadthPayload));
        }
        return Promise.resolve(jsonResponse(eastMoneyElectronicsFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(new Request('https://worker.example/news-summary'), env);
    const body = (await response.json()) as {
      cards: Array<{ title: string; value: string; note: string }>;
    };

    const fitCard = body.cards.find((card) => card.title === '持仓匹配');
    expect(fitCard?.value).toBe('弱匹配');
    expect(fitCard?.note).toContain('弱匹配命中');
    expect(fitCard?.note).toContain('不等同于真实行业字段');
  });

  it('资金流空数据时会沿用最近可用主力方向', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    await worker.fetch(new Request('https://worker.example/news-summary'), env);

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({
            files: {
              'fund-manager-sync.json': {
                content: JSON.stringify(backupPayload),
              },
            },
          }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('fundf10.eastmoney.com')) return Promise.resolve(new Response(eastMoneyHistoricalNavText));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('query1.finance.yahoo.com')) return Promise.resolve(jsonResponse(yahooChartPayload));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/kamt/get')) {
        return Promise.resolve(jsonResponse(eastMoneyNorthboundPayload));
      }
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        if (url.includes('f37') || url.includes('f38')) {
          return Promise.resolve(jsonResponse(eastMoneyMarketBreadthPayload));
        }
        return Promise.resolve(jsonResponse(emptyEastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '组合整体表现良好。' } }] }));
      }
      if (url.includes('generativelanguage.googleapis.com')) {
        return Promise.resolve(jsonResponse({ candidates: [{ content: { parts: [{ text: 'Gemini 分析' }] } }] }));
      }
      return Promise.reject(new Error(`Unexpected fetch ${url}`));
    });

    const response = await worker.fetch(new Request('https://worker.example/news-summary'), env);
    const body = (await response.json()) as {
      cards: Array<{ title: string; value: string; note: string }>;
      sourceStatus: Array<{ label: string; value: string }>;
    };

    const fundFlowCard = body.cards.find((card) => card.title === '资金流');
    expect(fundFlowCard?.value).not.toBe('暂无数据');
    expect(fundFlowCard?.note).toContain('沿用最近可用主力方向');
    expect(body.sourceStatus.find((item) => item.label === '资金流')?.value).toBe('cached');
  });

  it('读取 Gist 持仓、调用 AI 并发送 Telegram', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      env,
    );
    const body = (await response.json()) as {
      ok: boolean;
      holdings: number;
      totalAssets: number;
      sentMessages: number;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, holdings: 1, totalAssets: 120, sentMessages: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/gists/gist-id',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer github-token' }) }),
    );
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('https://qt.gtimg.cn/q='))).toBe(true);
    expect(
      fetchMock.mock.calls.some((call) => String(call[0]).includes('https://np-listapi.eastmoney.com')),
    ).toBe(true);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('测试基金A');
    expect(aiBody.messages[0].content).toContain('贵州茅台');
    expect(aiBody.messages[0].content).toContain('dataCoverage');
    expect(aiBody.messages[0].content).toContain('稳健');
    expect(aiBody.messages[0].content).toContain('风险承受能力: available');
    expect(aiBody.messages[0].content).toContain('marketSnapshot');
    expect(aiBody.messages[0].content).toContain('newsSnapshot');
    expect(aiBody.messages[0].content).toContain('fundFlowSnapshot');
    expect(aiBody.messages[0].content).toContain('underlyingExposures');
    expect(aiBody.messages[0].content).toContain('底层行业/主题暴露数量: 2');
    expect(aiBody.messages[0].content).toContain('底层最大暴露: 消费');
    expect(aiBody.messages[0].content).toContain('贵州茅台');
    expect(aiBody.messages[0].content).toContain('量化信号数据: available');
    expect(aiBody.messages[0].content).toContain('量化信号覆盖: 1/1');
    expect(aiBody.messages[0].content).toContain('组合量化信号:');
    expect(aiBody.messages[0].content).toContain('quantSignal');
    expect(aiBody.messages[0].content).toContain('valuationStatus');
    expect(aiBody.messages[0].content).toContain('riskRadar');
    expect(aiBody.messages[0].content).toContain('组合风险雷达');
    expect(aiBody.messages[0].content).toContain('严禁仅凭基金名称判断当前组合持有什么主题');
    expect(aiBody.messages[0].content).toContain('如果只是市场资金流主题，必须明确是“市场观察主题”');
    expect(aiBody.messages[0].content).toContain('上证指数');
    expect(aiBody.messages[0].content).toContain('资金流入最强方向: 人工智能');
    expect(aiBody.messages[0].content).toContain('资金流数据: available');
    expect(aiBody.messages[0].content).toContain('市场宽度: 中性');
    expect(aiBody.messages[0].content).toContain('市场宽度说明: 指数样本 2 个');
    expect(aiBody.messages[0].content).toContain('持仓匹配度: 低');
    expect(aiBody.messages[0].content).toContain('匹配的持仓主题: 新能源->新能源');
    expect(aiBody.messages[0].content).toContain('可用资产: 5000');
    expect(aiBody.messages[0].content).toContain('交易确认规则: 普通场外基金按 T+1');
    expect(aiBody.messages[0].content).toContain('待确认交易数量: 2');
    expect(aiBody.messages[0].content).toContain('待确认买入金额: 1000');
    expect(aiBody.messages[0].content).toContain('待到账/待确认卖出资金: 119');
    expect(aiBody.messages[0].content).toContain('T+1 交易确认口径');
    expect(aiBody.messages[0].content).toContain('近3日每日收益: 2026-05-18 +1.80 元');
    expect(aiBody.messages[0].content).toContain('今日加仓候选');
    expect(aiBody.messages[0].content).toContain('不得编造新闻标题、财报数据、公告内容或资金流数据');
    expect(aiBody.messages[0].content).toContain('不要编造不存在的数据');
    expect(aiBody.messages[0].content).toContain('buildCandidates');
    expect(aiBody.messages[0].content).toContain('未持有基金B');
    expect(aiBody.messages[0].content).toContain('未持有自选建仓候选数量: 1');
    expect(aiBody.messages[0].content).toContain('资金流兜底建仓候选数量:');
    expect(aiBody.messages[0].content).toContain('当前A股阶段:');
    expect(aiBody.messages[0].content).toContain('收盘后写“明日观察点”，收盘前写“今日观察点”');
    expect(aiBody.messages[1].content).toContain('是否适合加仓');

    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    expect(telegramCall).toBeTruthy();
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as {
      chat_id: string;
      text: string;
    };
    expect(telegramCall?.[0]).toBe('https://api.telegram.org/bottelegram-token/sendMessage');
    expect(telegramBody.chat_id).toBe('123456');
    expect(telegramBody.text).toContain('养基AI持仓分析');
    expect(telegramBody.text).toContain('组合整体表现良好。');
  });

  it('Telegram 发送“量化分析”只返回客观量化信号且不调用 AI', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '量化分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/chat/completions'))).toBe(false);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('morningstar.cn'))).toBe(false);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    expect(telegramCalls[0]?.[1].body).toContain('正在结合市场情绪');
    const telegramBody = JSON.parse(telegramCalls.at(-1)?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI量化分析');
    expect(telegramBody.text).toContain('组合量化信号');
    expect(telegramBody.text).toContain('估值');
    expect(telegramBody.text).toContain('强势持有');
    expect(telegramBody.text).toContain('MA20');
    expect(telegramBody.text).toContain('测试基金A');
    expect(telegramBody.text).toContain('历史位置');
  });

  it('量化分析会分页读取历史净值且样本够 21 条时输出部分信号', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({
            files: {
              'fund-manager-sync.json': {
                content: JSON.stringify({
                  ...backupPayload,
                  funds: [{ ...backupPayload.funds[0], code: '000003', name: '部分样本基金C' }],
                }),
              },
            },
          }),
        );
      }
      if (url.includes('fundf10.eastmoney.com') && url.includes('page=1')) {
        return Promise.resolve(new Response(buildEastMoneyHistoricalNavText(20, 0)));
      }
      if (url.includes('fundf10.eastmoney.com') && url.includes('page=2')) {
        return Promise.resolve(new Response(buildEastMoneyHistoricalNavText(1, 20)));
      }
      if (url.includes('fundf10.eastmoney.com')) {
        return Promise.resolve(new Response('var apidata={content:"<table></table>"};'));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '量化分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('page=2'))).toBe(true);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCalls.at(-1)?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('覆盖：1/1 只');
    expect(telegramBody.text).toContain('部分样本基金C');
    expect(telegramBody.text).toContain('20日');
    expect(telegramBody.text).not.toContain('历史净值样本少于 21 条');
  });

  it('量化分析组合评分只按有量化数据的资产加权', async () => {
    const payload = {
      ...backupPayload,
      funds: [
        { ...backupPayload.funds[0], code: '000005', name: '强势样本基金' },
        {
          ...backupPayload.funds[0],
          code: '000006',
          name: '无数据大仓位基金',
          holdingShares: 10000,
          currentNav: 10,
        },
      ],
    };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(payload) } } }),
        );
      }
      if (url.includes('code=000005')) return Promise.resolve(new Response(eastMoneyHistoricalNavText));
      if (url.includes('fundf10.eastmoney.com')) {
        return Promise.resolve(new Response('var apidata={content:"<table></table>"};'));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '量化分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCalls.at(-1)?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('组合量化信号：偏积极');
    expect(telegramBody.text).toContain('覆盖：1/2 只');
    expect(telegramBody.text).toContain('资产覆盖 +0.12%');
    expect(telegramBody.text).toContain('强势持有');
    expect(telegramBody.text).toContain('数据不足');
    expect(telegramBody.text).toContain('无数据大仓位基金');
    expect(telegramBody.text).toContain('历史净值位置估值 proxy');
  });

  it('量化分析会为 ETF 联接基金显示母 ETF 基准', async () => {
    const payload = {
      ...backupPayload,
      funds: [
        {
          ...backupPayload.funds[0],
          code: '015310',
          name: '华泰柏瑞南方东英恒生科技ETF联接(QDII)A',
        },
      ],
    };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(payload) } } }),
        );
      }
      if (url.includes('fundf10.eastmoney.com')) return Promise.resolve(new Response(eastMoneyHistoricalNavText));
      if (url.includes('qt.gtimg.cn') && url.includes('sh513180')) {
        return Promise.resolve(new Response('v_s_sh513180="1~恒生科技ETF~513180~1.00~0.00~1.23";'));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '量化分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCalls.at(-1)?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('ETF_LINK/HK');
    expect(telegramBody.text).toContain('基准: 华泰柏瑞南方东英恒生科技ETF +1.23%');
  });

  it('配置 CRON_SECRET 后拒绝未授权手动触发', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      { ...env, CRON_SECRET: 'secret' },
    );
    const body = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: '未授权' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('长分析结果会拆分为多条 Telegram 消息', async () => {
    const longText = '分析'.repeat(2500);
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock, emptyEastMoneyNewsPayload, emptySinaNewsPayload);
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: longText } }] }));
      }
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(emptyEastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(emptySinaNewsPayload));
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      env,
    );
    const body = (await response.json()) as { sentMessages: number };

    expect(response.status).toBe(200);
    expect(body.sentMessages).toBeGreaterThan(1);
    const telegramCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('api.telegram.org'),
    );
    expect(telegramCalls).toHaveLength(body.sentMessages);
  });

  it('DeepSeek provider 使用内置 OpenAI 兼容地址', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      { ...env, AI_PROVIDER: 'deepseek', AI_BASE_URL: undefined },
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls.some((call) => call[0] === 'https://api.deepseek.com/v1/chat/completions')).toBe(true);
  });

  it('Gemini provider 使用 Gemini REST API', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      { ...env, AI_PROVIDER: 'gemini', AI_MODEL: 'gemini-1.5-flash', AI_BASE_URL: undefined },
    );

    expect(response.status).toBe(200);
    expect(
      fetchMock.mock.calls.some(
        (call) =>
          call[0] ===
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=ai-token',
      ),
    ).toBe(true);
  });

  it('东方财富失败但新浪成功时标记为 available', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse({}, 500));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '部分失败分析' } }] }));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('消息面/财报/公告数据: available');
    expect(aiBody.messages[0].content).toContain('failedSources');
    expect(aiBody.messages[0].content).toContain('新能源板块震荡回升');
  });

  it('新闻为空时在 prompt 中标记消息面缺失', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock, emptyEastMoneyNewsPayload, emptySinaNewsPayload);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('消息面/财报/公告数据: missing');
    expect(aiBody.messages[0].content).toContain('可用中文财经新闻项');
  });

  it('所有中文财经新闻源失败时标记为 failed 且不等同于无新闻', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse({}, 500));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse({}, 429));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '失败分析' } }] }));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('消息面/财报/公告数据: failed');
    expect(aiBody.messages[0].content).toContain('中文财经新闻接口失败，消息面/财报/公告暂不可用');
    expect(aiBody.messages[0].content).toContain('不得说成近 72 小时无新闻');
  });

  it('资金流失败时要求降级且不编造资金流', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse({}, 500));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '资金流失败分析' } }] }));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '建仓', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('专项操作摘要');
    expect(aiBody.messages[0].content).toContain('"dataStatus":"failed"');
    expect(aiBody.messages[0].content).toContain('如果市场、新闻、资金流、底层持仓或量化数据缺失，必须明确说明');
    expect(aiBody.messages[1].content).toContain('资金流数据暂不可用，本次仅基于市场情绪和新闻利好判断');
  });

  it('资金流盘前未形成时标记为 missing 且说明非接口失败', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(unavailableEastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '盘前资金流分析' } }] }));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/run', { method: 'POST' }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('资金流数据: missing');
    expect(aiBody.messages[0].content).toContain('"unavailableReason": "preMarketOrOffHours"');
    expect(aiBody.messages[0].content).toContain('资金流数据暂未形成，可能因当前处于盘前/非交易时段');
    expect(aiBody.messages[0].content).toContain('东方财富暂未返回有效主力净流入数据');
    expect(aiBody.messages[0].content).toContain('不得编造资金流入方向或金额');
    expect(aiBody.messages[0].content).not.toContain('资金流入最强方向: 人工智能');
  });

  it('Telegram 发送“分析”会触发短版分析并回复当前 chat', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        headers: { 'X-Telegram-Bot-Api-Secret-Token': 'webhook-secret' },
        body: JSON.stringify({ message: { text: '分析', chat: { id: 123456 } } }),
      }),
      { ...env, TELEGRAM_WEBHOOK_SECRET: 'webhook-secret' },
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.handled).toBe('analysis');
    expect(body.sentMessages).toBe(2);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    expect(telegramCalls).toHaveLength(2);
    const pendingBody = JSON.parse(telegramCalls[0]?.[1].body as string) as { chat_id: string; text: string };
    const telegramBody = JSON.parse(telegramCalls[1]?.[1].body as string) as { chat_id: string; text: string };
    expect(pendingBody.chat_id).toBe('123456');
    expect(pendingBody.text).toBe('收到，正在结合市场情绪、资金流和持仓分析...');
    expect(telegramBody.chat_id).toBe('123456');
    expect(telegramBody.text).toContain('养基AI持仓分析');
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('简短但全面');
    expect(aiBody.messages[1].content).toContain('500 字以内');
    expect(aiBody.messages[1].content).toContain('结论、加仓、减仓/清仓、建仓主题、风险、数据');
    expect(aiBody.messages[1].content).toContain('风险只列 1-2 个最大风险');
    expect(aiBody.messages[1].content).toContain('数据行简要标注市场、资金流、新闻、量化、底层持仓');
    expect(aiBody.messages[0].content).toContain('可用资产: 5000');
    expect(aiBody.messages[0].content).toContain('近3日每日收益');
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('fundf10.eastmoney.com'))).toBe(false);
  });

  it('Telegram 发送“市场分析”会触发独立市场分析问题', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '市场分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCalls[1]?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI市场分析');
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('请只做市场分析');
    expect(aiBody.messages[1].content).toContain('A 股市场环境、主要指数强弱');
    expect(aiBody.messages[1].content).toContain('市场情绪、指数强弱、资金流方向、消息面影响、持仓影响、今日观察主题、风险提示');
    expect(aiBody.messages[1].content).toContain('不推荐具体基金名称或基金代码');
    expect(aiBody.messages[0].content).toContain('市场分析专用摘要');
    expect(aiBody.messages[0].content).toContain('portfolioRelevance');
    expect(aiBody.messages[0].content).toContain('analysisDiagnostics');
    expect(aiBody.messages[0].content).toContain('dataQuality');
    expect(aiBody.messages[0].content).not.toContain('buildCandidates');
    expect(aiBody.messages[1].content).not.toContain('简短但全面');
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('fundf10.eastmoney.com'))).toBe(false);
  });

  it('Telegram 发送“涨跌”会触发独立涨跌归因问题', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '涨跌', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCalls[1]?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI涨跌归因');
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('今天涨跌归因分析');
    expect(aiBody.messages[1].content).toContain('结论、上涨/下跌原因、当前信号、证据、不确定项');
    expect(aiBody.messages[1].content).toContain('不能只复述数据');
    expect(aiBody.messages[0].content).toContain('今日涨跌归因摘要');
    expect(aiBody.messages[0].content).toContain('marketFit');
    expect(aiBody.messages[0].content).toContain('analysisDiagnostics');
    expect(aiBody.messages[0].content).not.toContain('buildCandidates');
    expect(aiBody.messages[1].content).not.toContain('简短但全面');
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('fundf10.eastmoney.com'))).toBe(false);
  });

  it('Telegram 发送“预测”会触发明日涨跌预测问题', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '预测', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCalls[1]?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI明日涨跌预测');
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('明日涨跌预测');
    expect(aiBody.messages[1].content).toContain('条件化概率判断');
    expect(aiBody.messages[1].content).toContain('结论、概率判断、主要依据、明天重点看什么、触发条件、失效条件、不确定项');
    expect(aiBody.messages[1].content).toContain('不得写“必涨”“必跌”“一定”');
    expect(aiBody.messages[1].content).toContain('外围市场/指数期货');
    expect(aiBody.messages[1].content).toContain('盘后消息面');
    expect(aiBody.messages[1].content).toContain('资金流连续性');
    expect(aiBody.messages[0].content).toContain('预测专用摘要');
    expect(aiBody.messages[0].content).toContain('overseasMarket');
    expect(aiBody.messages[0].content).toContain('COMEX黄金');
    expect(aiBody.messages[0].content).toContain('afterHoursNews');
    expect(aiBody.messages[0].content).toContain('fundFlow');
    expect(aiBody.messages[0].content).toContain('marketStructure');
    expect(aiBody.messages[0].content).toContain('marketFit');
    expect(aiBody.messages[0].content).toContain('analysisDiagnostics');
    expect(aiBody.messages[0].content).toContain('fundFlowHistory');
    expect(aiBody.messages[0].content).toContain('predictionRecords');
    expect(aiBody.messages[0].content).toContain('持仓匹配度必须区分');
    expect(aiBody.messages[0].content).toContain('transactionSettlement');
    expect(aiBody.messages[0].content).toContain('待确认买入不能算当前已确认持仓收益');
    expect(aiBody.messages[0].content).not.toContain('buildCandidates');
    const statePatchCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).includes('api.github.com/gists') && call[1]?.method === 'PATCH',
    );
    const statePatchBody = JSON.parse(statePatchCall?.[1].body as string) as {
      files: Record<string, { content: string }>;
    };
    const statePayload = JSON.parse(statePatchBody.files['fund-manager-ai-state.json'].content) as {
      fundFlowHistory: unknown[];
      predictionRecords: unknown[];
    };
    expect(statePayload.fundFlowHistory).toHaveLength(1);
    expect(statePayload.predictionRecords).toHaveLength(1);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('query1.finance.yahoo.com'))).toBe(true);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('fundf10.eastmoney.com'))).toBe(false);
  });

  it('Telegram 发送“明天涨跌”会触发明日涨跌预测问题', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '明天涨跌', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCalls[1]?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI明日涨跌预测');
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('明日涨跌预测');
  });

  it('会用每日收益结算历史预测并写入命中率', async () => {
    const existingState = {
      version: 1,
      updatedAt: '2026-05-17T10:00:00.000Z',
      fundFlowHistory: [],
      predictionRecords: [
        {
          id: 'prediction-1',
          createdAt: '2026-05-17T10:00:00.000Z',
          date: '2026-05-17',
          marketPhase: 'postClose',
          conclusion: '偏涨',
          confidence: '中',
          dataQualityScore: 82,
          portfolioDayGainPct: 0.5,
          topFlowThemes: ['新能源'],
          analysisPreview: '偏涨，中置信度',
        },
      ],
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({
            files: {
              'fund-manager-sync.json': { content: JSON.stringify(backupPayload) },
              'fund-manager-ai-state.json': { content: JSON.stringify(existingState) },
            },
          }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/kamt/get')) return Promise.resolve(jsonResponse(eastMoneyNorthboundPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        if (url.includes('f37') || url.includes('f38')) return Promise.resolve(jsonResponse(eastMoneyMarketBreadthPayload));
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '市场分析' } }] }));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '市场分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('hitRate');
    const statePatchCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).includes('api.github.com/gists') && call[1]?.method === 'PATCH',
    );
    const statePatchBody = JSON.parse(statePatchCall?.[1].body as string) as {
      files: Record<string, { content: string }>;
    };
    const statePayload = JSON.parse(statePatchBody.files['fund-manager-ai-state.json'].content) as {
      predictionRecords: Array<{ actualDate?: string; actualEarnings?: number; hit?: boolean }>;
    };
    expect(statePayload.predictionRecords[0]).toMatchObject({
      actualDate: '2026-05-18',
      actualEarnings: 1.8,
      hit: true,
    });
  });

  it('Telegram 短版分析会复用 Morningstar 持仓缓存', async () => {
    const customPayload = {
      ...backupPayload,
      funds: [{ ...backupPayload.funds[0], code: '999999', name: '缓存测试基金' }],
      watchlists: [],
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(customPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '组合整体表现良好。' } }] }));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    for (let index = 0; index < 2; index += 1) {
      const response = await worker.fetch(
        new Request('https://worker.example/telegram', {
          method: 'POST',
          body: JSON.stringify({ message: { text: '分析', chat: { id: 123456 } } }),
        }),
        env,
      );
      expect(response.status).toBe(200);
    }

    const morningstarCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('morningstar.cn'));
    expect(morningstarCalls).toHaveLength(1);
  });

  it('Telegram 发送“今日盈利”会直接返回收益摘要且不调用 AI', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '今日盈利', chat: { id: 123456 } } }),
      }),
      env,
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, handled: 'todayProfit', sentMessages: 1 });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('chat/completions'))).toBe(false);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('morningstar.cn'))).toBe(false);
    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as { chat_id: string; text: string };
    expect(telegramBody.chat_id).toBe('123456');
    expect(telegramBody.text).toContain('养基AI今日盈利');
    expect(telegramBody.text).toContain('今日总盈亏：+1.80 元');
    expect(telegramBody.text).toContain('今日收益率：+1.52%');
    expect(telegramBody.text).toContain('测试基金A');
    expect(telegramBody.text).toContain('贡献最高：测试基金A +1.80 元');
  });

  it('Telegram 发送“今日盘中实时收益”会显示短版盘中收益', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('fundf10.eastmoney.com')) return Promise.resolve(new Response(eastMoneyLatestNavText));
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(stockQuoteText));
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '今日盘中实时收益', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('chat/completions'))).toBe(false);
    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('盘中收益');
    expect(telegramBody.text).toContain('盘中估算：+2.69 元（+2.29%）');
    expect(telegramBody.text).toContain('可估算：1/1 只');
    expect(telegramBody.text).toContain('贡献：');
    expect(telegramBody.text).toContain('1. 测试基金A +2.69 元 (+2.24%)');
    expect(telegramBody.text).not.toContain('覆盖权重');
    expect(telegramBody.text).not.toContain('当前总资产');
  });

  it('Telegram 发送“详细盘中收益”会显示完整盘中收益', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('fundf10.eastmoney.com')) return Promise.resolve(new Response(eastMoneyLatestNavText));
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(stockQuoteText));
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '详细盘中收益', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI盘中实时收益');
    expect(telegramBody.text).toContain('今日总盈亏：+2.69 元');
    expect(telegramBody.text).toContain('覆盖权重 13.70%');
    expect(telegramBody.text).toContain('当前总资产');
  });

  it('Telegram 发送“详细分析”会触发完整分析问题', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '详细分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('请基于当前持仓');
    expect(aiBody.messages[1].content).toContain('是否适合加仓');
    expect(aiBody.messages[1].content).not.toContain('Telegram 短版分析');
  });

  it('Telegram 发送“加仓”会触发专项短答', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '加仓', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('只回答当前是否适合加仓');
    expect(aiBody.messages[1].content).toContain('加仓候选只能从当前已持有基金中选择');
    expect(aiBody.messages[1].content).not.toContain('holdings 当前');
    expect(aiBody.messages[1].content).toContain('1000 字以内');
    expect(aiBody.messages[0].content).toContain('专项操作摘要');
    expect(aiBody.messages[0].content).toContain('action');
    expect(aiBody.messages[0].content).toContain('analysisDiagnostics');
    expect(aiBody.messages[0].content).not.toContain('buildCandidates');
  });

  it('Telegram 发送“建仓”会触发建仓主题观察专项短答', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '建仓', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('今天哪个主题方向最值得建仓观察');
    expect(aiBody.messages[1].content).toContain('建仓观察只推荐主题方向');
    expect(aiBody.messages[1].content).toContain('不输出具体基金名称或基金代码');
    expect(aiBody.messages[1].content).toContain('主题可以和已有持仓重合');
    expect(aiBody.messages[1].content).toContain('资金流入最强方向');
    expect(aiBody.messages[1].content).toContain('市场情绪、今日利好方向、资金流入最强方向、今日建仓主题观察、观察方式、放弃观察条件');
    expect(aiBody.messages[1].content).toContain('今日暂无明确建仓主题，仅做观察');
    expect(aiBody.messages[1].content).toContain('不得把主题观察写成现在立即买入');
    expect(aiBody.messages[1].content).toContain('最终回复不得出现内部字段名');
    expect(aiBody.messages[1].content).not.toContain('为什么不是已有基金');
    expect(aiBody.messages[0].content).toContain('专项操作摘要');
    expect(aiBody.messages[0].content).not.toContain('未持有基金B');
    expect(aiBody.messages[0].content).not.toContain('"heldFundCodes"');
    expect(aiBody.messages[0].content).toContain('marketPhase');
  });

  it('建仓候选为空时仍只要求输出主题方向', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({
            files: {
              'fund-manager-sync.json': {
                content: JSON.stringify(backupPayloadWithoutBuildCandidates),
              },
            },
          }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '兜底建仓分析' } }] }));
      }
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '建仓', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[0].content).toContain('专项操作摘要');
    expect(aiBody.messages[0].content).not.toContain('fallbackBuildCandidates');
    expect(aiBody.messages[0].content).not.toContain('fundFlowFallback');
    expect(aiBody.messages[0].content).toContain('人工智能');
    expect(aiBody.messages[1].content).toContain('建仓观察只推荐主题方向');
    expect(aiBody.messages[1].content).toContain('不输出具体基金名称或基金代码');
    expect(aiBody.messages[1].content).not.toContain('候选来源：资金流方向兜底，非你的自选基金');
    expect(aiBody.messages[1].content).not.toContain('严禁推荐已经持有的基金');
  });

  it('Telegram 短版输出过长时会截断', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: '分析'.repeat(1200) } }] }));
      }
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '分析', chat: { id: 123456 } } }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    const pendingBody = JSON.parse(telegramCalls[0]?.[1].body as string) as { text: string };
    const telegramBody = JSON.parse(telegramCalls[1]?.[1].body as string) as { text: string };
    expect(pendingBody.text).toBe('收到，正在结合市场情绪、资金流和持仓分析...');
    expect(telegramBody.text).toContain('已截断，发送“详细分析”查看完整版本。');
  });

  it('Telegram 分析失败时会在立即回复后发送失败提示', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.github.com/gists')) return Promise.resolve(jsonResponse({}, 500));
      if (url.includes('api.telegram.org')) return Promise.resolve(jsonResponse({ ok: true }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '分析', chat: { id: 123456 } } }),
      }),
      env,
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.handled).toBe('analysis');
    expect(body.sentMessages).toBe(2);
    const telegramCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('api.telegram.org'));
    expect(telegramCalls).toHaveLength(2);
    const pendingBody = JSON.parse(telegramCalls[0]?.[1].body as string) as { text: string };
    const failureBody = JSON.parse(telegramCalls[1]?.[1].body as string) as { text: string };
    expect(pendingBody.text).toBe('收到，正在结合市场情绪、资金流和持仓分析...');
    expect(failureBody.text).toContain('分析失败：读取 Gist 请求失败');
  });

  it('午盘 scheduled cron 使用午盘休息分析', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);
    const tasks: Promise<unknown>[] = [];

    await worker.scheduled(
      { scheduledTime: Date.now(), cron: '35 3 * * 1-5' },
      env,
      { waitUntil: (promise: Promise<unknown>) => tasks.push(promise) },
    );
    await waitForScheduledTasks(tasks);

    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('午盘休息分析');
    expect(aiBody.messages[1].content).toContain('下午是否适合观察、低吸、小额试探或暂不操作');
    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI午盘休息分析');
  });

  it('尾盘 scheduled cron 使用尾盘操作提醒', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);
    const tasks: Promise<unknown>[] = [];

    await worker.scheduled(
      { scheduledTime: Date.now(), cron: '30 6 * * 1-5' },
      env,
      { waitUntil: (promise: Promise<unknown>) => tasks.push(promise) },
    );
    await waitForScheduledTasks(tasks);

    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('尾盘半小时操作提醒');
    expect(aiBody.messages[1].content).toContain('14:50 前是否加仓、是否减仓');
    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI尾盘操作提醒');
  });

  it('收盘 scheduled cron 使用收盘分析', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);
    const tasks: Promise<unknown>[] = [];

    await worker.scheduled(
      { scheduledTime: Date.now(), cron: '0 7 * * 1-5' },
      env,
      { waitUntil: (promise: Promise<unknown>) => tasks.push(promise) },
    );
    await waitForScheduledTasks(tasks);

    const aiBody = findAiRequestBody(fetchMock);
    expect(aiBody.messages[1].content).toContain('收盘分析');
    expect(aiBody.messages[1].content).toContain('明日触发条件');
    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('养基AI收盘分析');
  });

  it('QQ 官方机器人未启用时返回 404', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(buildQqRequest({ op: 0 }), env);
    const body = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(404);
    expect(body).toEqual({ ok: false, error: 'QQ 官方机器人未启用' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('QQ 官方回调地址验证返回 plain_token 和 signature', async () => {
    const response = await worker.fetch(
      buildQqRequest({ op: 13, d: { plain_token: 'plain-token', event_ts: '1725442341' } }),
      qqEnv,
    );
    const body = (await response.json()) as { plain_token: string; signature: string };

    expect(response.status).toBe(200);
    expect(body.plain_token).toBe('plain-token');
    expect(body.signature).toMatch(/^[0-9a-f]{128}$/);
  });

  it('QQ 官方普通回调签名无效时拒绝', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      buildQqRequest(
        { op: 0, t: 'GROUP_AT_MESSAGE_CREATE', d: {} },
        { 'X-Signature-Ed25519': '00', 'X-Signature-Timestamp': '1725442341' },
      ),
      qqEnv,
    );
    const body = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'QQ 官方回调签名无效' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('QQ 官方非群 @ 事件会忽略', async () => {
    const payload = { op: 0, t: 'READY', d: {} };
    const response = await worker.fetch(await buildSignedQqRequest(payload), qqEnv);
    const body = (await response.json()) as { ok: boolean; ignored: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, ignored: true });
  });

  it('QQ 官方未授权群或用户会忽略', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);
    const payload = {
      op: 0,
      t: 'GROUP_AT_MESSAGE_CREATE',
      d: {
        id: 'msg-id',
        content: '分析',
        group_openid: 'other-group',
        author: { member_openid: 'member-openid' },
      },
    };

    const response = await worker.fetch(await buildSignedQqRequest(payload), qqEnv);
    const body = (await response.json()) as { ok: boolean; ignored: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, ignored: true });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('chat/completions'))).toBe(false);
  });

  it('QQ 官方授权用户群内触发分析会两段式回复', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('bots.qq.com/app/getAppAccessToken')) {
        return Promise.resolve(jsonResponse({ access_token: 'qq-access-token', expires_in: 7200 }));
      }
      if (url.includes('api.sgroup.qq.com/v2/groups/group-openid/messages')) {
        return Promise.resolve(jsonResponse({ id: 'sent-id', timestamp: Date.now() }));
      }
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: 'QQ 分析结果' } }] }));
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);
    const payload = {
      op: 0,
      t: 'GROUP_AT_MESSAGE_CREATE',
      d: {
        id: 'msg-id',
        content: '<@!robot> 建仓',
        group_openid: 'group-openid',
        author: { member_openid: 'member-openid' },
      },
    };

    const response = await worker.fetch(await buildSignedQqRequest(payload), qqEnv);
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.handled).toBe('analysis');
    expect(body.sentMessages).toBe(2);
    const qqMessageCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('api.sgroup.qq.com/v2/groups/group-openid/messages'),
    );
    expect(qqMessageCalls).toHaveLength(2);
    const pendingBody = JSON.parse(qqMessageCalls[0]?.[1].body as string) as {
      content: string;
      msg_id: string;
      msg_seq: number;
    };
    const analysisBody = JSON.parse(qqMessageCalls[1]?.[1].body as string) as {
      content: string;
      msg_id: string;
      msg_seq: number;
    };
    expect(pendingBody).toEqual(
      expect.objectContaining({
        content: '收到，正在结合市场情绪、资金流和持仓分析...',
        msg_id: 'msg-id',
        msg_seq: 1,
      }),
    );
    expect(analysisBody.content).toContain('养基AI持仓分析');
    expect(analysisBody.content).toContain('QQ 分析结果');
    expect(analysisBody.msg_id).toBe('msg-id');
    expect(analysisBody.msg_seq).toBe(2);
    expect(
      fetchMock.mock.calls.some(
        (call) =>
          call[0] === 'https://bots.qq.com/app/getAppAccessToken' &&
          JSON.parse(call[1].body as string).appId === '1903963785',
      ),
    ).toBe(true);
  });

  it('OneBot 未启用时返回 404', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(buildOneBotRequest({ post_type: 'message' }), env);
    const body = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(404);
    expect(body).toEqual({ ok: false, error: 'QQ OneBot 未启用' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('OneBot 未授权群或用户会忽略且不调用 AI', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      buildOneBotRequest({
        post_type: 'message',
        message_type: 'group',
        group_id: 111,
        user_id: 987654321,
        raw_message: '分析',
      }),
      oneBotEnv,
    );
    const body = (await response.json()) as { ok: boolean; ignored: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, ignored: true });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('chat/completions'))).toBe(false);
  });

  it('OneBot 授权用户群内触发分析会两段式回复', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('onebot.example/send_group_msg')) return Promise.resolve(jsonResponse({ status: 'ok' }));
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: 'OneBot 分析结果' } }] }));
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      buildOneBotRequest({
        post_type: 'message',
        message_type: 'group',
        group_id: 123456789,
        user_id: 987654321,
        raw_message: '建仓',
      }),
      oneBotEnv,
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.handled).toBe('analysis');
    expect(body.sentMessages).toBe(2);
    const oneBotCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes('onebot.example/send_group_msg'));
    expect(oneBotCalls).toHaveLength(2);
    expect(oneBotCalls[0]?.[1].headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer onebot-token' }),
    );
    const pendingBody = JSON.parse(oneBotCalls[0]?.[1].body as string) as { group_id: number; message: string };
    const analysisBody = JSON.parse(oneBotCalls[1]?.[1].body as string) as { group_id: number; message: string };
    expect(pendingBody).toEqual({
      group_id: 123456789,
      message: '收到，正在结合市场情绪、资金流和持仓分析...',
    });
    expect(analysisBody.group_id).toBe(123456789);
    expect(analysisBody.message).toContain('养基AI持仓分析');
    expect(analysisBody.message).toContain('OneBot 分析结果');
  });

  it('OneBot 授权用户群内触发今日盈利会直接回复收益摘要', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('onebot.example/send_group_msg')) return Promise.resolve(jsonResponse({ status: 'ok' }));
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      buildOneBotRequest({
        post_type: 'message',
        message_type: 'group',
        group_id: 123456789,
        user_id: 987654321,
        raw_message: '[CQ:at,qq=123456] 今日盈利',
      }),
      oneBotEnv,
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, handled: 'todayProfit', sentMessages: 1 });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('chat/completions'))).toBe(false);
    const oneBotCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('onebot.example/send_group_msg'));
    const oneBotBody = JSON.parse(oneBotCall?.[1].body as string) as { group_id: number; message: string };
    expect(oneBotBody.group_id).toBe(123456789);
    expect(oneBotBody.message).toContain('养基AI今日盈利');
    expect(oneBotBody.message).toContain('今日总盈亏：+1.80 元');
  });

  it('OneBot 授权用户群内触发盘中收益会显示短版收益', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('onebot.example/send_group_msg')) return Promise.resolve(jsonResponse({ status: 'ok' }));
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('fundf10.eastmoney.com')) return Promise.resolve(new Response(eastMoneyLatestNavText));
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(stockQuoteText));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      buildOneBotRequest({
        post_type: 'message',
        message_type: 'group',
        group_id: 123456789,
        user_id: 987654321,
        raw_message: '盘中收益',
      }),
      oneBotEnv,
    );

    expect(response.status).toBe(200);
    const oneBotCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('onebot.example/send_group_msg'));
    const oneBotBody = JSON.parse(oneBotCall?.[1].body as string) as { message: string };
    expect(oneBotBody.message).toContain('盘中收益');
    expect(oneBotBody.message).toContain('盘中估算：+2.69 元（+2.29%）');
    expect(oneBotBody.message).toContain('可估算：1/1 只');
    expect(oneBotBody.message).toContain('1. 测试基金A +2.69 元 (+2.24%)');
    expect(oneBotBody.message).not.toContain('覆盖权重');
  });

  it('OneBot 授权用户群内 @ 机器人触发分析', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('onebot.example/send_group_msg')) return Promise.resolve(jsonResponse({ status: 'ok' }));
      if (url.includes('api.github.com/gists')) {
        return Promise.resolve(
          jsonResponse({ files: { 'fund-manager-sync.json': { content: JSON.stringify(backupPayload) } } }),
        );
      }
      if (url.includes('morningstar.cn')) return Promise.resolve(jsonResponse(holdingsPayload));
      if (url.includes('qt.gtimg.cn')) return Promise.resolve(new Response(marketText));
      if (url.includes('np-listapi.eastmoney.com')) return Promise.resolve(jsonResponse(eastMoneyNewsPayload));
      if (url.includes('push2.eastmoney.com/api/qt/clist/get')) {
        return Promise.resolve(jsonResponse(eastMoneyFundFlowPayload));
      }
      if (url.includes('feed.mix.sina.com.cn')) return Promise.resolve(jsonResponse(sinaNewsPayload));
      if (url.includes('chat/completions')) {
        return Promise.resolve(jsonResponse({ choices: [{ message: { content: 'OneBot @ 分析结果' } }] }));
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      buildOneBotRequest({
        post_type: 'message',
        message_type: 'group',
        group_id: 123456789,
        user_id: 987654321,
        raw_message: '[CQ:at,qq=123456] 分析',
      }),
      oneBotEnv,
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.handled).toBe('analysis');
    expect(body.sentMessages).toBe(2);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('chat/completions'))).toBe(true);
  });

  it('OneBot 未识别指令时静默忽略', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('onebot.example/send_group_msg')) return Promise.resolve(jsonResponse({ status: 'ok' }));
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      buildOneBotRequest({
        post_type: 'message',
        message_type: 'group',
        group_id: 123456789,
        user_id: 987654321,
        raw_message: '[CQ:at,qq=123456] 你好',
      }),
      oneBotEnv,
    );
    const body = (await response.json()) as { ok: boolean; ignored: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, ignored: true });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('chat/completions'))).toBe(false);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('onebot.example/send_group_msg'))).toBe(false);
  });

  it('Telegram webhook secret 不匹配时返回 401', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        headers: { 'X-Telegram-Bot-Api-Secret-Token': 'wrong' },
        body: JSON.stringify({ message: { text: '分析', chat: { id: 123456 } } }),
      }),
      { ...env, TELEGRAM_WEBHOOK_SECRET: 'webhook-secret' },
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('受保护接口可以设置 Telegram webhook', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: true }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/setup-telegram-webhook', {
        method: 'POST',
        headers: { Authorization: 'Bearer cron-secret' },
      }),
      { ...env, CRON_SECRET: 'cron-secret', TELEGRAM_WEBHOOK_SECRET: 'webhook-secret' },
    );
    const body = (await response.json()) as { ok: boolean; webhookUrl: string };

    expect(response.status).toBe(200);
    expect(body.webhookUrl).toBe('https://worker.example/telegram');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/bottelegram-token/setWebhook',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          url: 'https://worker.example/telegram',
          secret_token: 'webhook-secret',
        }),
      }),
    );
  });

  it('非本人 chat id 不触发分析', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '分析', chat: { id: 999 } } }),
      }),
      env,
    );
    const body = (await response.json()) as { ok: boolean; ignored: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, ignored: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('未识别 Telegram 指令时返回帮助文本', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '你好', chat: { id: 123456 } } }),
      }),
      env,
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, handled: 'help', sentMessages: 1 });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/chat/completions'))).toBe(false);
    const telegramCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('api.telegram.org'));
    const telegramBody = JSON.parse(telegramCall?.[1].body as string) as { text: string };
    expect(telegramBody.text).toContain('发送“分析”');
    expect(telegramBody.text).toContain('建仓');
  });

  it('Telegram 指令只做精确匹配，不把自然语言当作分析指令', async () => {
    const fetchMock = vi.fn();
    mockBaseSuccessfulFetches(fetchMock);
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://worker.example/telegram', {
        method: 'POST',
        body: JSON.stringify({ message: { text: '分析一下', chat: { id: 123456 } } }),
      }),
      env,
    );
    const body = (await response.json()) as { ok: boolean; handled: string; sentMessages: number };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, handled: 'help', sentMessages: 1 });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/chat/completions'))).toBe(false);
  });
});
