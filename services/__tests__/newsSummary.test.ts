/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearNewsSummaryCache, fetchNewsSummary, getCachedNewsSummary } from '../newsSummary';

const STORAGE_KEY = 'fundManager.newsSummaryCache.v3';

describe('newsSummary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearNewsSummaryCache();
    localStorage.clear();
  });

  it('忽略结构不完整的本地缓存，避免资讯页崩溃', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        expiresAt: Date.now() + 60_000,
        value: {
          ok: true,
          generatedAt: '2026-05-21T09:30:00.000Z',
          cards: [{ title: '市场温度', value: '偏强', note: '测试', tone: 'positive' }],
        },
      }),
    );

    const cached = getCachedNewsSummary();

    expect(cached?.sections).toEqual([]);
    expect(cached?.sourceStatus).toEqual([]);
  });

  it('强制刷新时绕过移动端缓存并补齐缺失数组字段', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          generatedAt: '2026-05-21T09:30:00.000Z',
          cards: [{ title: '市场温度', value: '偏强', note: '测试', tone: 'positive' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const summary = await fetchNewsSummary(true);

    expect(summary?.sections).toEqual([]);
    expect(summary?.sourceStatus).toEqual([]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/news-summary?t=');
    expect(init).toMatchObject({ cache: 'no-store' });
    expect(init.headers).toMatchObject({ Accept: 'application/json' });
    expect(init.headers).not.toHaveProperty('Cache-Control');
  });

  it('不持久化资金流失败且榜单为空的短暂异常摘要', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          generatedAt: '2026-05-21T09:30:00.000Z',
          cards: [{ title: '资金流', value: '暂无数据', note: '测试', tone: 'neutral' }],
          sections: [{ title: '资金流', description: '测试', items: [] }],
          sourceStatus: [{ label: '资金流', value: 'failed', tone: 'neutral' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const summary = await fetchNewsSummary(true);

    expect(summary?.cards[0].title).toBe('资金流');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('不持久化市场宽度失败且 section 为空的短暂异常摘要', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          generatedAt: '2026-05-21T09:30:00.000Z',
          cards: [{ title: '市场宽度', value: '暂无数据', note: '测试', tone: 'neutral' }],
          sections: [{ title: '市场宽度', description: '测试', items: [] }],
          sourceStatus: [{ label: '市场宽度', value: 'failed', tone: 'negative' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const summary = await fetchNewsSummary(true);

    expect(summary?.cards[0].title).toBe('市场宽度');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('不持久化北向资金失败且资金面 section 为空的短暂异常摘要', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          generatedAt: '2026-05-21T09:30:00.000Z',
          cards: [{ title: '资金面', value: '暂无数据', note: '测试', tone: 'neutral' }],
          sections: [{ title: '资金面', description: '测试', items: [] }],
          sourceStatus: [{ label: '北向资金', value: 'failed', tone: 'negative' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const summary = await fetchNewsSummary(true);

    expect(summary?.cards[0].title).toBe('资金面');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('允许持久化 cached 摘要，保留最近有效数据', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          generatedAt: '2026-05-21T09:30:00.000Z',
          cards: [{ title: '市场宽度', value: '10 涨 / 8 跌', note: '缓存样本', tone: 'warning' }],
          sections: [
            {
              title: '市场宽度',
              description: '测试',
              items: [{ tag: '缓存宽度', title: '10 涨 / 8 跌', impact: '中性', relation: '测试', time: '09:30', tone: 'warning' }],
            },
          ],
          sourceStatus: [{ label: '市场宽度', value: 'cached', tone: 'warning' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const summary = await fetchNewsSummary(true);

    expect(summary?.sourceStatus[0].value).toBe('cached');
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});
