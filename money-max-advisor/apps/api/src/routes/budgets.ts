import type { FastifyInstance } from 'fastify';
import { seedBudgets, seedBills } from '../data/seed.js';

export async function budgetRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/budgets', async (_req, reply) => {
    return reply.send({ budgets: seedBudgets, bills: seedBills });
  });
}
