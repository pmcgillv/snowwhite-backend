import type { FastifyInstance } from 'fastify';
import type { ReportSummary, WealthSnapshot } from '@money-max/shared';
import { seedAccounts, seedIncomeStreams, seedBudgets } from '../data/seed.js';

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/reports/wealth', async (_req, reply) => {
    const report = buildWealthReport();
    return reply.send(report);
  });
}

function buildWealthReport(): ReportSummary {
  const accounts = seedAccounts;

  const totalAssets = accounts
    .filter((a) => a.balance > 0)
    .reduce((s, a) => s + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.balance < 0)
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalLiabilities;

  // Build 12-month wealth trajectory (simplified linear projection)
  const wealthTrajectory: WealthSnapshot[] = [];
  const monthlyDebtPaydown = 2_000; // rough estimate of all debt payments
  const monthlyAssetGrowth = 500;   // savings + 401k contributions

  for (let m = 0; m <= 12; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    const projectedLiabilities = Math.max(0, totalLiabilities - monthlyDebtPaydown * m);
    const projectedAssets = totalAssets + monthlyAssetGrowth * m;
    wealthTrajectory.push({
      date: d.toISOString().split('T')[0] as string,
      assets: Math.round(projectedAssets * 100) / 100,
      liabilities: Math.round(projectedLiabilities * 100) / 100,
      netWorth: Math.round((projectedAssets - projectedLiabilities) * 100) / 100,
    });
  }

  const monthlyIncome = seedIncomeStreams.reduce((s, i) => {
    const multiplier = i.frequency === 'bi-weekly' ? 26 / 12 : 1;
    return s + i.netAmount * multiplier;
  }, 0);

  const monthlyExpenses = seedBudgets.reduce(
    (s, b) => s + b.allocatedMonthly, 0,
  );

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  const nonMortgageDebt = accounts
    .filter((a) => ['credit', 'loan', 'heloc'].includes(a.type) && a.balance < 0)
    .reduce((s, a) => s + Math.abs(a.balance), 0);

  const originalEstimatedDebt = 25_000; // seed total at inception
  const debtPayoffProgress = Math.min(
    100,
    Math.max(0, ((originalEstimatedDebt - nonMortgageDebt) / originalEstimatedDebt) * 100),
  );

  const report: ReportSummary = {
    period: 'last-12-months',
    totalInterestPaid: 2_847.32,  // seed estimate
    totalPrincipalPaid: 14_231.00,
    wealthTrajectory,
    savingsRate: Math.round(savingsRate * 10) / 10,
    debtPayoffProgress: Math.round(debtPayoffProgress * 10) / 10,
  };

  return report;
}
