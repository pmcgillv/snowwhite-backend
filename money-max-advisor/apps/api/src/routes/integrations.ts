import type { FastifyInstance } from 'fastify';
import type { IntegrationStatus } from '@money-max/shared';

export async function integrationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/integrations/firefly/status', async (_req, reply) => {
    const status: IntegrationStatus = {
      connected: false,
      mode: 'demo',
    };
    return reply.send(status);
  });

  app.get('/api/integrations/simplefin/status', async (_req, reply) => {
    const status: IntegrationStatus = {
      connected: false,
      mode: 'demo',
    };
    return reply.send(status);
  });
}
