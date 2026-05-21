/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearNewsSummaryCache, fetchNewsSummary, getCachedNewsSummary } from '../newsSummary';

const STORAGE_KEY = 'fundManager.newsSummaryCache.v2';

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
    expect(init.headers).toMatchObject({ 'Cache-Control': 'no-cache' });
  });
});
