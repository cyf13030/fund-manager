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
              title: '中长期资金入市相关表述增强',
              impact: '偏正面',
              relation: '用于筛选对市场情绪可能有影响的消息。',
              relationReason: '命中政策关键词，与组合风险偏好相关。',
              time: '16:20',
              tone: 'positive',
              url: 'https://example.com/news/1',
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
    expect(screen.getByText('资讯洞察')).toBeInTheDocument();
    expect(screen.getByText('本次 AI 依据')).toBeInTheDocument();
    expect(screen.getByText('偏强')).toBeInTheDocument();
    expect(screen.getByText('半导体 +1200 万元')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '持仓相关' }));
    expect(screen.getByText('当前筛选下暂无该类资讯。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '盘后消息' }));
    fireEvent.click(screen.getByRole('button', { name: /中长期资金入市相关表述增强/ }));
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

    expect(screen.getByText('缓存摘要')).toBeInTheDocument();
    expect(screen.getAllByText('本地缓存内容。').length).toBeGreaterThan(0);
    await waitFor(() => expect(fetchNewsSummaryMock).toHaveBeenCalledWith(true));
  });
});
