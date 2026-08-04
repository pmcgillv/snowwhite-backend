import type { FastifyInstance } from 'fastify';
import type { CashflowPoint } from '@money-max/shared';
import { seedIncomeStreams, seedBills, seedAccounts } from '../data/seed.js';

type RangeParam = '30d' | '60d' | '90d' | '180d' | '365d';

function rangeToDays(range: string): number {
  const map: Record<RangeParam, number> = {
    '30d': 30,
    '60d': 60,
    '90d': 90,
    '180d': 180,
    '365d': 365,
  };
  return map[range as RangeParam] ?? 90;
}

export async function cashflowRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { range?: string } }>(
    '/api/cashflow',
    async (req, reply) => {
      const days = rangeToDays(req.query.range ?? '90d');
      const points = buildCashflowSeries(days);
      return reply.send({ range: req.query.range ?? '90d', points });
    },
  );
}

function buildCashflowSeries(days: number): CashflowPoint[] {
  const checking = seedAccounts.find((a) => a.type === 'checking');
  let runningBalance = checking?.balance ?? 0;
  const points: CashflowPoint[] = [];

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const isoDate = date.toISOString().split('T')[0] as string;
    const dom = date.getDate(); // day of month

    let inflow = 0;
    let outflow = 0;
    const labels: string[] = [];

    // Income events (bi-weekly Fridays)
    for (const inc of seedIncomeStreams) {
      if (inc.frequency === 'bi-weekly' && date.getDay() === 5) {
        // Every other Friday; simplify by using week parity
        const weekNum = Math.floor(d / 7);
        if (weekNum % 2 === 0) {
          const toChecking = inc.destinationAccountIds.find(
            (x) => x.accountId === 'acc-boa-checking',
          );
          if (toChecking) {
            inflow += toChecking.amount;
            labels.push(inc.name);
          }
        }
      } else if (inc.frequency === 'monthly' && dom === 1) {
        const toChecking = inc.destinationAccountIds.find(
          (x) => x.accountId === 'acc-boa-checking',
        );
        if (toChecking) {
          inflow += toChecking.amount;
          labels.push(inc.name);
        }
      }
    }

    // Bill events
    for (const bill of seedBills) {
      if (bill.accountId === 'acc-boa-checking' && dom === bill.dueDay) {
        outflow += bill.amount;
        labels.push(bill.name);
      }
    }

    runningBalance = runningBalance + inflow - outflow;

    if (inflow > 0 || outflow > 0) {
      points.push({
        date: isoDate,
        inflow: Math.round(inflow * 100) / 100,
        outflow: Math.round(outflow * 100) / 100,
        balance: Math.round(runningBalance * 100) / 100,
        label: labels.join(', '),
      });
    }
  }

  return points;
}
