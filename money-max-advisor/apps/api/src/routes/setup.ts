import type { FastifyInstance } from 'fastify';
import type { SetupStatus } from '@money-max/shared';

let setupCompleted = false;

export async function setupRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/setup/status', async (_req, reply) => {
    const status: SetupStatus = {
      completed: setupCompleted,
      mode: 'demo',
      steps: [
        { key: 'accounts',     label: 'Connect accounts',         done: true },
        { key: 'income',       label: 'Verify income streams',    done: true },
        { key: 'bills',        label: 'Confirm bills & autopay',  done: true },
        { key: 'goals',        label: 'Set financial goals',      done: setupCompleted },
        { key: 'integrations', label: 'Bank integration (optional)', done: false },
      ],
    };
    return reply.send(status);
  });

  app.post('/api/setup/complete', async (_req, reply) => {
    setupCompleted = true;
    return reply.send({ completed: true, message: 'Setup marked complete.' });
  });
}
