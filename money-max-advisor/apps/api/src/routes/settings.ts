import type { FastifyInstance } from 'fastify';
import type { AdvisorSettings } from '@money-max/shared';
import { seedSettings } from '../data/seed.js';

// In-memory mutable settings (demo mode)
let currentSettings: AdvisorSettings = { ...seedSettings };

export function getSettings(): AdvisorSettings {
  return currentSettings;
}

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/settings', async (_req, reply) => {
    return reply.send(currentSettings);
  });

  app.patch('/api/settings', async (req, reply) => {
    const body = req.body as Partial<AdvisorSettings>;
    currentSettings = { ...currentSettings, ...body };
    return reply.send(currentSettings);
  });
}
