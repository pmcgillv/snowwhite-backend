import { describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../src/server.js';

describe('API route smoke tests', () => {
  const app = buildServer();

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { status: string; mode: string };
    expect(body.status).toBe('ok');
    expect(body.mode).toBe('demo');
  });

  it('GET /api/accounts returns accounts array', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/accounts' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { accounts: unknown[] };
    expect(Array.isArray(body.accounts)).toBe(true);
    expect(body.accounts.length).toBeGreaterThan(0);
  });

  it('POST /api/accounts creates a local account with interest-only period', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      payload: {
        kind: 'mortgage',
        name: 'New Construction Mortgage',
        institution: 'Demo Bank',
        balance: 410000,
        interestRateAPR: 6.25,
        interestOnlyPeriod: {
          active: true,
          months: 36,
          startDate: '2026-08-01',
          endDate: '2029-08-01',
        },
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body) as {
      account: {
        name: string;
        type: string;
        balance: number;
        interestOnlyPeriod?: { active: boolean; months?: number };
      };
    };
    expect(body.account.name).toBe('New Construction Mortgage');
    expect(body.account.type).toBe('mortgage');
    expect(body.account.balance).toBeLessThan(0);
    expect(body.account.interestOnlyPeriod?.active).toBe(true);
    expect(body.account.interestOnlyPeriod?.months).toBe(36);
  });

  it('GET /api/dashboard returns summary fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body).toHaveProperty('debtFreeDate');
    expect(body).toHaveProperty('totalDebt');
    expect(body).toHaveProperty('interestSavedProjected');
    expect(body).toHaveProperty('discretionaryIncome');
    expect(body).toHaveProperty('emergencyFund');
    expect(body).toHaveProperty('netWorth');
  });

  it('GET /api/budgets returns budgets and bills', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/budgets' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { budgets: unknown[]; bills: unknown[] };
    expect(Array.isArray(body.budgets)).toBe(true);
    expect(Array.isArray(body.bills)).toBe(true);
  });

  it('GET /api/actions returns actions array', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/actions' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { actions: Array<{ id: string; status: string }> };
    expect(Array.isArray(body.actions)).toBe(true);
    expect(body.actions.length).toBeGreaterThan(0);
  });

  it('POST /api/actions/:id/approve marks action as approved', async () => {
    const listRes = await app.inject({ method: 'GET', url: '/api/actions' });
    const { actions } = JSON.parse(listRes.body) as { actions: Array<{ id: string; status: string }> };
    const first = actions[0];
    expect(first).toBeDefined();

    const approveRes = await app.inject({
      method: 'POST',
      url: `/api/actions/${first!.id}/approve`,
    });
    expect(approveRes.statusCode).toBe(200);
    const updated = JSON.parse(approveRes.body) as { status: string };
    expect(updated.status).toBe('approved');
  });

  it('GET /api/actions/:id returns a single action', async () => {
    const listRes = await app.inject({ method: 'GET', url: '/api/actions' });
    const { actions } = JSON.parse(listRes.body) as { actions: Array<{ id: string }> };
    const first = actions[0];
    expect(first).toBeDefined();

    const res = await app.inject({ method: 'GET', url: `/api/actions/${first!.id}` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { action: { id: string } };
    expect(body.action.id).toBe(first!.id);
  });

  it('POST /api/actions/:id/execute marks action as executed', async () => {
    const listRes = await app.inject({ method: 'GET', url: '/api/actions' });
    const { actions } = JSON.parse(listRes.body) as { actions: Array<{ id: string; status: string }> };
    const actionToExecute = actions[1] ?? actions[0];
    expect(actionToExecute).toBeDefined();

    const execRes = await app.inject({
      method: 'POST',
      url: `/api/actions/${actionToExecute!.id}/execute`,
    });
    expect(execRes.statusCode).toBe(200);
    const updated = JSON.parse(execRes.body) as { status: string };
    expect(updated.status).toBe('executed');
  });

  it('POST /api/actions/:id/dismiss marks action as dismissed', async () => {
    const listRes = await app.inject({ method: 'GET', url: '/api/actions' });
    const { actions } = JSON.parse(listRes.body) as { actions: Array<{ id: string; status: string }> };
    const last = actions[actions.length - 1];
    expect(last).toBeDefined();

    const dismissRes = await app.inject({
      method: 'POST',
      url: `/api/actions/${last!.id}/dismiss`,
    });
    expect(dismissRes.statusCode).toBe(200);
    const updated = JSON.parse(dismissRes.body) as { status: string };
    expect(updated.status).toBe('dismissed');
  });

  it('POST /api/actions/:id/approve returns 404 for unknown id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/actions/non-existent-id/approve',
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/cashflow returns cashflow points', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/cashflow?range=30d',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { range: string; points: unknown[] };
    expect(body.range).toBe('30d');
    expect(Array.isArray(body.points)).toBe(true);
  });

  it('GET /api/reports/wealth returns wealth report', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/reports/wealth' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body).toHaveProperty('wealthTrajectory');
    expect(body).toHaveProperty('savingsRate');
    expect(body).toHaveProperty('debtPayoffProgress');
  });

  it('GET /api/setup/status returns setup steps', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/setup/status' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { completed: boolean; steps: unknown[] };
    expect(body).toHaveProperty('completed');
    expect(Array.isArray(body.steps)).toBe(true);
  });

  it('POST /api/setup/complete marks setup done', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/setup/complete' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { completed: boolean };
    expect(body.completed).toBe(true);
  });

  it('GET /api/settings returns settings', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/settings' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body).toHaveProperty('methodMode');
    expect(body).toHaveProperty('currency');
  });

  it('PATCH /api/settings updates methodMode', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: { methodMode: 'line_of_credit' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { methodMode: string };
    expect(body.methodMode).toBe('line_of_credit');
  });

  it('POST /api/advisor/chat returns a reply', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/advisor/chat',
      payload: { message: 'How do I pay off my debt faster?' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { reply: string };
    expect(typeof body.reply).toBe('string');
    expect(body.reply.length).toBeGreaterThan(0);
  });

  it('POST /api/advisor/chat returns 400 when message missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/advisor/chat',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/integrations/firefly/status returns demo mode', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/integrations/firefly/status',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { connected: boolean; mode: string };
    expect(body.connected).toBe(false);
    expect(body.mode).toBe('demo');
  });
});
