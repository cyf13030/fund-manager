import { buildQuantInterpretationPrompt, clearQuantInterpretationCache } from '../quantInterpretation';
import type { QuantAnalysisResponse } from '../quantAnalysis';

describe('quantInterpretation service', () => {
  beforeEach(() => {
    clearQuantInterpretationCache();
  });

  it('builds a constrained prompt from quant analysis JSON', () => {
    const analysis: QuantAnalysisResponse = {
      ok: true,
      generatedAt: '2026-05-22T10:00:00.000Z',
      portfolio: {
        signal: '观望',
        score: 0.1,
        availableCount: 1,
        totalCount: 1,
        coveragePct: 100,
        riskReturn: { sharpe120dProxy: 1.2 },
      },
      groups: [
        {
          title: '中性观察',
          items: [
            {
              code: '000001',
              name: '测试基金',
              categoryLabel: 'DOMESTIC',
              marketLabel: 'CN',
              signal: '观望',
              score: 0.1,
              dataStatus: 'available',
              reason: '样本可用',
              trendLabel: '均线中性',
              valuationLabel: '估值中性',
              benchmarkText: '基准: 缺失',
              metrics: { return20d: 1.23 },
            },
          ],
        },
      ],
      note: '估值不是 PE/PB',
    };

    const prompt = buildQuantInterpretationPrompt(analysis);

    expect(prompt).toContain('不得新增、不猜测、不修正任何数值');
    expect(prompt).toContain('历史净值位置 proxy');
    expect(prompt).toContain('测试基金');
    expect(prompt).toContain('return20d');
  });
});
