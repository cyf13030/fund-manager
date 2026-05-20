import {
  clearFundValuationSeries,
  getAllFundValuationSeries,
  getFundValuationSeries,
  recordFundValuationSeries,
} from '../fundValuationTimeseries';

describe('fundValuationTimeseries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('保存同日分时估值并按时间去重覆盖', () => {
    recordFundValuationSeries(
      '000001',
      [
        { time: '09:31', estimatedNav: 1.00123456 },
        { time: '09:32', estimatedNav: 1.002 },
      ],
      '2026-05-20',
    );

    const result = recordFundValuationSeries(
      '000001',
      [
        { time: '09:32', estimatedNav: 1.003 },
        { time: '09:33', estimatedNav: 1.004 },
      ],
      '2026-05-20',
    );

    expect(result).toEqual([
      { date: '2026-05-20', time: '09:31', estimatedNav: 1.001235 },
      { date: '2026-05-20', time: '09:32', estimatedNav: 1.003 },
      { date: '2026-05-20', time: '09:33', estimatedNav: 1.004 },
    ]);
  });

  it('新交易日会清理旧日分时估值', () => {
    recordFundValuationSeries('000001', [{ time: '14:59', estimatedNav: 1.1 }], '2026-05-19');
    recordFundValuationSeries('000001', [{ time: '09:31', estimatedNav: 1.2 }], '2026-05-20');

    expect(getFundValuationSeries('000001')).toEqual([
      { date: '2026-05-20', time: '09:31', estimatedNav: 1.2 },
    ]);
  });

  it('支持读取全部和清理单只基金', () => {
    recordFundValuationSeries('000001', [{ time: '09:31', estimatedNav: 1.1 }], '2026-05-20');
    recordFundValuationSeries('000002', [{ time: '09:31', estimatedNav: 2.1 }], '2026-05-20');

    expect(Object.keys(getAllFundValuationSeries()).sort()).toEqual(['000001', '000002']);
    clearFundValuationSeries('000001');
    expect(getAllFundValuationSeries()).toEqual({
      '000002': [{ date: '2026-05-20', time: '09:31', estimatedNav: 2.1 }],
    });
  });
});
