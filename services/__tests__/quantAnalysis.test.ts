import { clearQuantAnalysisCache, fetchQuantAnalysis } from '../quantAnalysis';

describe('quantAnalysis service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearQuantAnalysisCache();
    localStorage.clear();
  });

  it('fetches and normalizes structured quant analysis', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          generatedAt: '2026-05-22T10:00:00.000Z',
          portfolio: {
            signal: '偏积极',
            score: 0.8,
            availableCount: 1,
            totalCount: 1,
            coveragePct: 100,
            riskReturn: { volatility60d: 12.3, maxDrawdown120d: -4.5, sharpe120dProxy: 1.2 },
          },
          groups: [
            {
              title: '强势持有',
              items: [
                {
                  code: '000001',
                  name: '测试基金',
                  categoryLabel: 'DOMESTIC',
                  marketLabel: 'CN',
                  signal: '偏积极',
                  score: 0.8,
                  dataStatus: 'available',
                  reason: '样本充足',
                  trendLabel: '均线偏强',
                  valuationLabel: '估值中性',
                  benchmarkText: '基准: 缺失',
                  metrics: { volatility60d: 12.3, sharpe120dProxy: 1.2 },
                },
              ],
            },
          ],
          note: '估值不是 PE/PB',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchQuantAnalysis(true);

    expect(result?.portfolio.signal).toBe('偏积极');
    expect(result?.portfolio.riskReturn.sharpe120dProxy).toBe(1.2);
    expect(result?.groups[0].items[0].metrics.volatility60d).toBe(12.3);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/quant-analysis'), expect.any(Object));
  });

  it('returns null for invalid response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })));

    await expect(fetchQuantAnalysis(true)).resolves.toBeNull();
  });
});
