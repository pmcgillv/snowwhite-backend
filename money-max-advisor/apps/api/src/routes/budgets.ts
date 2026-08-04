import type { FastifyInstance } from 'fastify';
import { seedBudgets, seedBills, seedIncomeStreams } from '../data/seed.js';

export async function budgetRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/budgets', async (_req, reply) => {
    const monthLabel = new Date().toLocaleString('en-US', { month: 'long' });
    const income = seedIncomeStreams.map((stream) => {
      const monthlyBudget =
        stream.frequency === 'bi-weekly'
          ? Math.round(stream.netAmount * (26 / 12) * 100) / 100
          : stream.netAmount;
      // Demo: assume roughly half the month received so progress bars show mid-cycle
      const received = Math.round(monthlyBudget * 0.45 * 100) / 100;
      return {
        id: stream.id,
        name: stream.name,
        frequency: stream.frequency,
        budgeted: monthlyBudget,
        received,
        monthLabel,
      };
    });

    return reply.send({
      budgets: seedBudgets,
      bills: seedBills,
      income,
    });
  });
}
