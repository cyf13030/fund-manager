import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QuantAnalysisCard } from '../QuantAnalysisCard';

const fetchQuantAnalysisMock = vi.fn();
const interpretQuantAnalysisMock = vi.fn();
let cachedQuantAnalysis: unknown = null;

vi.mock('../../services/quantAnalysis', () => ({
  getCachedQuantAnalysis: () => cachedQuantAnalysis,
  fetchQuantAnalysis: (...args: unknown[]) => fetchQuantAnalysisMock(...args),
  isQuantAnalysisComplete: (value: { portfolio?: { availableCount: number; totalCount: number } } | null) =>
    Boolean(
      value &&
        value.portfolio &&
        value.portfolio.totalCount > 0 &&
        value.portfolio.availableCount >= value.portfolio.totalCount,
    ),
}));

vi.mock('../../services/quantInterpretation', () => ({
  interpretQuantAnalysis: (...args: unknown[]) => interpretQuantAnalysisMock(...args),
}));

vi.mock('../../services/SettingsContext', () => ({
  useSettings: () => ({}),
}));

vi.mock('../../services/aiProviderConfig', () => ({
  resolveAiRuntimeConfigByBusiness: () => ({
    provider: 'customOpenAi',
    apiKey: 'test-key',
    model: 'test-model',
    baseURL: 'https://example.com/v1',
  }),
}));

vi.mock('../ModalShell', () => ({
  ModalShell: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

describe('QuantAnalysisCard', () => {
  beforeEach(() => {
    cachedQuantAnalysis = null;
    fetchQuantAnalysisMock.mockResolvedValue({
      ok: true,
      generatedAt: '2026-05-22T10:00:00.000Z',
      portfolio: {
        signal: '偏积极',
        score: 0.88,
        availableCount: 1,
        totalCount: 1,
        coveragePct: 100,
        riskReturn: {
          volatility60d: 12.3,
          maxDrawdown120d: -4.5,
          sharpe120dProxy: 1.2,
          positiveDayRate60d: 60,
        },
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
              score: 0.88,
              dataStatus: 'available',
              reason: '样本充足',
              trendLabel: '均线偏强',
              valuationLabel: '估值中性',
              benchmarkText: '基准: 缺失',
              metrics: { return20d: 1, volatility60d: 12.3, sharpe120dProxy: 1.2 },
            },
          ],
        },
      ],
      note: '估值不是 PE/PB',
    });
    interpretQuantAnalysisMock.mockResolvedValue('一、组合结论\n量化结构偏积极。');
  });

  afterEach(() => {
    fetchQuantAnalysisMock.mockReset();
    interpretQuantAnalysisMock.mockReset();
  });

  it('opens modal and renders structured quant analysis', async () => {
    render(<QuantAnalysisCard />);

    fireEvent.click(screen.getByRole('button', { name: /量化信号/ }));

    await waitFor(() => expect(screen.getAllByText('偏积极').length).toBeGreaterThan(0));
    expect(screen.getByText('组合量化分析')).toBeInTheDocument();
    expect(screen.getByText('强势持有')).toBeInTheDocument();
    expect(screen.getByText('测试基金')).toBeInTheDocument();
    expect(screen.getAllByText('夏普 proxy').length).toBeGreaterThan(0);
  });

  it('generates AI quant interpretation from structured analysis', async () => {
    render(<QuantAnalysisCard />);

    fireEvent.click(screen.getByRole('button', { name: /量化信号/ }));
    await waitFor(() => expect(screen.getByText('AI 量化解读')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '生成解读' }));

    await waitFor(() => expect(screen.getByText(/量化结构偏积极/)).toBeInTheDocument());
    expect(interpretQuantAnalysisMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes incomplete cached analysis before showing details', async () => {
    cachedQuantAnalysis = {
      ok: true,
      generatedAt: '2026-05-22T09:00:00.000Z',
      portfolio: {
        signal: '观望',
        score: 0.3,
        availableCount: 1,
        totalCount: 3,
        coveragePct: 33.33,
        riskReturn: {},
      },
      groups: [
        {
          title: '数据不足',
          items: [
            {
              code: '000002',
              name: '旧缓存基金',
              categoryLabel: 'DOMESTIC',
              marketLabel: 'CN',
              signal: '观望',
              score: 0.3,
              dataStatus: 'insufficient',
              reason: '旧缓存样本不足',
              trendLabel: '均线不足',
              valuationLabel: '估值不足',
              benchmarkText: '基准: 缺失',
              metrics: {},
            },
          ],
        },
      ],
      note: '旧缓存',
    };

    render(<QuantAnalysisCard />);

    fireEvent.click(screen.getByRole('button', { name: /量化信号/ }));

    await waitFor(() => expect(screen.getByText(/覆盖 1\/1/)).toBeInTheDocument());
    expect(screen.queryByText('旧缓存基金')).not.toBeInTheDocument();
    expect(fetchQuantAnalysisMock).toHaveBeenCalledWith(true);
  });
});
