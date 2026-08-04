import type { FastifyInstance } from 'fastify';
import type { DashboardSummary } from '@money-max/shared';
import { seedIncomeStreams, seedBudgets } from '../data/seed.js';
import { generateActionPlan } from '../engine/actionPlan.js';
import { getSettings } from './settings.js';
import { getAccounts } from './accounts.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/dashboard', async (_req, reply) => {
    const accounts = getAccounts();
    const settings = getSettings();
    const { debtFreeMonths, projectedInterestSaved, actions } = generateActionPlan({
      accounts,
      mode: settings.methodMode,
    });

    const totalDebt = accounts
      .filter((a) => ['credit', 'loan', 'mortgage', 'heloc'].includes(a.type))
      .reduce((s, a) => s + Math.abs(Math.min(a.balance, 0)), 0);

    const liquidSavings = accounts
      .filter((a) => a.type === 'savings' || a.type === 'checking')
      .reduce((s, a) => s + Math.max(a.balance, 0), 0);

    const assets = accounts
      .filter((a) => a.balance > 0)
      .reduce((s, a) => s + a.balance, 0);
    const liabilities = totalDebt;
    const netWorth = assets - liabilities;

    const monthlyIncome = seedIncomeStreams.reduce((s, i) => {
      const multiplier = i.frequency === 'bi-weekly' ? 26 / 12 : 1;
      return s + i.netAmount * multiplier;
    }, 0);

    const monthlyExpenses = seedBudgets.reduce(
      (s, b) => s + b.allocatedMonthly, 0,
    );

    const discretionaryIncome = monthlyIncome - monthlyExpenses;

    const debtFreeDate =
      debtFreeMonths === 0
        ? new Date().toISOString().split('T')[0]
        : new Date(
            Date.now() + debtFreeMonths * 30 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split('T')[0];

    const summary: DashboardSummary = {
      debtFreeDate: debtFreeDate as string,
      totalDebt: Math.round(totalDebt * 100) / 100,
      interestSavedProjected: projectedInterestSaved,
      discretionaryIncome: Math.round(discretionaryIncome * 100) / 100,
      emergencyFund: Math.round(liquidSavings * 100) / 100,
      netWorth: Math.round(netWorth * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
    };

    const yearsToPayOff = Math.round((debtFreeMonths / 12) * 10) / 10;
    const next = actions.find((a) => a.status === 'pending' && (a.type === 'debt_payment' || a.type === 'sweep'));
    const principalRemaining = totalDebt;
    const principalPaidEstimate = Math.round(totalDebt * 0.08 * 100) / 100;
    const interestRemaining = Math.round(projectedInterestSaved * 4.2 * 100) / 100;

    return reply.send({
      ...summary,
      yearsToPayOff,
      interestSavedActual: 0,
      interestRemaining,
      principalPaid: principalPaidEstimate,
      principalRemaining: Math.round(principalRemaining * 100) / 100,
      nextDebtTransfer: next
        ? { date: next.suggestedDate, amount: next.amount, actionId: next.id }
        : null,
    });
  });
}
