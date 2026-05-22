import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QuantAnalysisCard } from '../QuantAnalysisCard';

const fetchQuantAnalysisMock = vi.fn();
const interpretQuantAnalysisMock = vi.fn();

vi.mock('../../services/quantAnalysis', () => ({
  getCachedQuantAnalysis: () => null,
  fetchQuantAnalysis: (...args: unknown[]) => fetchQuantAnalysisMock(...args),
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
});
