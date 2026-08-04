import type { FastifyInstance } from 'fastify';
import { seedAccounts } from '../data/seed.js';

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/accounts', async (_req, reply) => {
    return reply.send({ accounts: seedAccounts });
  });
}
