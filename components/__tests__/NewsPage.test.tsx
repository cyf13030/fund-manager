/// <reference types="vitest/globals" />
import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NewsPage } from '../NewsPage';
import { LanguageProvider } from '../../services/i18n';

const fetchNewsSummaryMock = vi.hoisted(() => vi.fn());
const getCachedNewsSummaryMock = vi.hoisted(() => vi.fn());

vi.mock('../../services/newsSummary', () => ({
  fetchNewsSummary: fetchNewsSummaryMock,
  getCachedNewsSummary: getCachedNewsSummaryMock,
}));

describe('NewsPage', () => {
  it('renders worker-backed news summary layout', async () => {
    fetchNewsSummaryMock.mockResolvedValue({
      ok: true,
      generatedAt: '2026-05-21T09:30:00.000Z',
      marketPhase: 'postClose',
      summaryLine: '上证指数小幅收涨，外围市场中性，资金流延续半导体。',
      cards: [
        { title: '市场温度', value: '偏强', note: '上证指数 +0.32%', tone: 'positive' },
        { title: '盘后消息', value: '3 正 / 1 风险', note: '消息整体偏正面', tone: 'positive' },
        { title: '外围市场', value: '纳指 +0.80%', note: '明早开盘情绪偏稳', tone: 'info' },
        { title: '资金流', value: '半导体', note: '连续上榜 3 次', tone: 'warning' },
        { title: '行业轮动', value: '延续', note: '强势方向连续上榜', tone: 'positive' },
        { title: '市场宽度', value: '220 涨 / 67 跌', note: '样本 300 个', tone: 'positive' },
        { title: '成交量', value: '+2299.79 亿', note: '基于东财个股样本成交额汇总。', tone: 'info' },
        { title: '资金面', value: '南向占优', note: '北向+0.00 元 / 南向+420.00 万', tone: 'negative' },
        { title: '持仓匹配', value: '中', note: '与组合有一定重合', tone: 'warning' },
      ],
      sections: [
        {
          title: 'A 股指数',
          description: '主要指数的即时强弱，用来判断今天情绪底色。',
          items: [
            {
              tag: '指数',
              title: '上证指数 +0.32%',
              impact: '偏正面',
              relation: '用于判断盘面方向，不直接等于持仓涨跌。',
              time: '15:00',
              tone: 'positive',
            },
          ],
        },
        {
          title: '盘后消息',
          description: '政策、财报、公告和风险新闻，按影响方向整理。',
          items: [
            {
              tag: '政策',
              title: '证监会发布基金销售新规',
              impact: '影响高',
              relation: '用于观察基金销售合规和代销渠道影响。',
              relationReason: '命中政策关键词，与组合风险偏好相关。',
              time: '16:20',
              tone: 'positive',
              url: 'https://example.com/news/1',
            },
            {
              tag: '行业',
              title: 'ETF 规模变化引发基金行业关注',
              impact: '偏中性',
              relation: '用于观察基金行业趋势，不等同于单只基金建议。',
              time: '16:30',
              tone: 'info',
            },
            {
              tag: '竞品',
              title: '蚂蚁财富上线 AI 投顾功能',
              impact: '重要关注',
              relation: '用于观察代销渠道和竞品服务变化。',
              time: '16:40',
              tone: 'warning',
            },
          ],
        },
        {
          title: '资金流',
          description: '主题热度和连续性，用来判断资金是否延续。',
          items: [
            {
              tag: '行业',
              title: '半导体 +1200 万元',
              impact: '偏正面',
              relation: '代码 881001',
              time: '14:50',
              tone: 'warning',
            },
          ],
        },
        {
          title: '市场宽度',
          description: '上涨/下跌家数、涨跌停和成交额。',
          items: [
            {
              tag: '宽度',
              title: '220 涨 / 67 跌',
              impact: '偏正面',
              relation: '涨停 26、跌停 25。',
              time: '14:50',
              tone: 'positive',
            },
          ],
        },
        {
          title: '资金面',
          description: '北向资金与 ETF 方向 proxy。',
          items: [
            {
              tag: '南向',
              title: '南向净流入 +420.00 万',
              impact: '偏负面',
              relation: '用于观察跨境资金风险偏好。',
              time: '14:50',
              tone: 'negative',
            },
          ],
        },
        {
          title: '外围市场',
          description: '美股、港股、A50、汇率等对次日开盘的扰动。',
          items: [
            {
              tag: 'US',
              title: '纳指 +0.80%',
              impact: '偏正面',
              relation: '主要作为明早开盘情绪参考。',
              time: '22:45',
              tone: 'positive',
            },
          ],
        },
      ],
      sourceStatus: [
        { label: 'A股指数', value: 'available', tone: 'positive' },
        { label: '外围市场', value: 'available', tone: 'positive' },
        { label: '盘后消息', value: 'available', tone: 'positive' },
        { label: '资金流', value: 'partial', tone: 'warning' },
      ],
    });
    getCachedNewsSummaryMock.mockReturnValue(null);

    render(
      <LanguageProvider>
        <NewsPage />
      </LanguageProvider>,
    );

    await waitFor(() => expect(fetchNewsSummaryMock).toHaveBeenCalled());
    expect(screen.getByText('市场资讯')).toBeInTheDocument();
    expect(screen.getByText('资金流向')).toBeInTheDocument();
    expect(screen.getByText('基金行业简报')).toBeInTheDocument();
    expect(screen.getByText(/默认关注近两周/)).toBeInTheDocument();
    expect(screen.getByText('监管政策')).toBeInTheDocument();
    expect(screen.getByText('基金行业趋势')).toBeInTheDocument();
    expect(screen.getByText('竞品/渠道动态')).toBeInTheDocument();
    expect(screen.getAllByText('P0 紧急必看').length).toBeGreaterThan(0);
    expect(screen.getAllByText('P1 重要关注').length).toBeGreaterThan(0);
    expect(screen.getByText('资金榜单')).toBeInTheDocument();
    expect(screen.getAllByText('涨跌分布').length).toBeGreaterThan(0);
    expect(screen.getByText('上涨 / 下跌')).toBeInTheDocument();
    expect(screen.getByText('涨停 / 跌停')).toBeInTheDocument();
    expect(screen.getByText(/上涨占比 76.7%，多数样本上涨/)).toBeInTheDocument();
    expect(screen.getByText('涨停多于跌停，短线情绪偏强')).toBeInTheDocument();
    expect(screen.getByText(/资金解读：/)).toBeInTheDocument();
    expect(screen.queryByText('重点消息')).not.toBeInTheDocument();
    expect(screen.getByText('资讯洞察')).toBeInTheDocument();
    expect(screen.getByText('数据源状态')).toBeInTheDocument();
    expect(screen.getByText('偏强')).toBeInTheDocument();
    expect(screen.getByText('半导体 · 延续')).toBeInTheDocument();
    expect(screen.getAllByText('半导体 +1200 万元').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '持仓相关' }));
    expect(screen.getByText('当前筛选下暂无该类资讯。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '盘后消息' }));
    fireEvent.click(screen.getByRole('button', { name: /证监会发布基金销售新规/ }));
    expect(screen.getByText(/关联原因：/)).toBeInTheDocument();
    expect(screen.getByText('打开链接')).toBeInTheDocument();
  });

  it('prefers cached summary before refresh', async () => {
    const cachedSummary = {
      ok: true,
      generatedAt: '2026-05-21T08:00:00.000Z',
      marketPhase: 'postClose',
      summaryLine: '缓存摘要',
      cards: [
        { title: '市场温度', value: '缓存', note: '本地缓存内容', tone: 'neutral' },
        { title: '盘后消息', value: '缓存', note: '本地缓存内容', tone: 'neutral' },
        { title: '外围市场', value: '缓存', note: '本地缓存内容', tone: 'neutral' },
        { title: '资金流', value: '缓存', note: '本地缓存内容', tone: 'neutral' },
      ],
      sections: [
        { title: 'A 股指数', description: '本地缓存内容。', items: [] },
        { title: '盘后消息', description: '本地缓存内容。', items: [] },
        { title: '资金流', description: '本地缓存内容。', items: [] },
        { title: '外围市场', description: '本地缓存内容。', items: [] },
      ],
      sourceStatus: [
        { label: 'A股指数', value: 'available', tone: 'neutral' },
        { label: '外围市场', value: 'available', tone: 'neutral' },
        { label: '盘后消息', value: 'available', tone: 'neutral' },
        { label: '资金流', value: 'available', tone: 'neutral' },
      ],
    };

    getCachedNewsSummaryMock.mockReturnValue(cachedSummary);
    fetchNewsSummaryMock.mockResolvedValue(cachedSummary);

    render(
      <LanguageProvider>
        <NewsPage />
      </LanguageProvider>,
    );

    expect(screen.getAllByText('缓存摘要').length).toBeGreaterThan(0);
    expect(screen.getByText('缓存数据')).toBeInTheDocument();
    expect(screen.getAllByText('本地缓存内容。').length).toBeGreaterThan(0);
    await waitFor(() => expect(fetchNewsSummaryMock).toHaveBeenCalledWith(true));
  });
});
