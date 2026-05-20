import {
  aggregatePortfolioDailyEarnings,
  clearFundDailyEarnings,
  getAllFundDailyEarnings,
  getFundDailyEarnings,
  recordFundDailyEarnings,
} from '../fundDailyEarnings';

describe('fundDailyEarnings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('按日期记录并覆盖同日收益', () => {
    recordFundDailyEarnings({
      code: '000001',
      date: '2026-05-20',
      earnings: 12.345,
      rate: 1.23456,
      baseCostAmount: 1000.456,
    });
    const result = recordFundDailyEarnings({
      code: '000001',
      date: '2026-05-20',
      earnings: 15,
      rate: 1.5,
      baseCostAmount: 1000,
    });

    expect(result).toEqual([
      { date: '2026-05-20', earnings: 15, rate: 1.5, baseCostAmount: 1000 },
    ]);
  });

  it('组合收益按日期汇总并计算组合收益率', () => {
    recordFundDailyEarnings({
      code: '000001',
      date: '2026-05-20',
      earnings: 10,
      rate: 1,
      baseCostAmount: 1000,
    });
    recordFundDailyEarnings({
      code: '000002',
      date: '2026-05-20',
      earnings: -5,
      rate: -0.5,
      baseCostAmount: 2000,
    });

    expect(aggregatePortfolioDailyEarnings()).toEqual([
      { date: '2026-05-20', earnings: 5, rate: 0.1667, baseCostAmount: 3000 },
    ]);
  });

  it('支持读取全部和清理', () => {
    recordFundDailyEarnings({ code: '000001', date: '2026-05-20', earnings: 10 });
    recordFundDailyEarnings({ code: '000002', date: '2026-05-20', earnings: 20 });

    expect(getFundDailyEarnings('000001')).toHaveLength(1);
    expect(Object.keys(getAllFundDailyEarnings()).sort()).toEqual(['000001', '000002']);
    clearFundDailyEarnings('000001');
    expect(getAllFundDailyEarnings()).toEqual({
      '000002': [{ date: '2026-05-20', earnings: 20, rate: null, baseCostAmount: null }],
    });
  });
});
