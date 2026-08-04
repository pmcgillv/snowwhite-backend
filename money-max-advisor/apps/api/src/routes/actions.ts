import type { FastifyInstance } from 'fastify';
import type { ActionItem, ActionStatus } from '@money-max/shared';
import { seedAccounts } from '../data/seed.js';
import { generateActionPlan } from '../engine/actionPlan.js';
import { getSettings } from './settings.js';

// In-memory store so approve/execute/dismiss persist within a session
const actionStore = new Map<string, ActionItem>();
let storeInitialised = false;

function ensureStore(): Map<string, ActionItem> {
  if (!storeInitialised) {
    const { actions } = generateActionPlan({
      accounts: seedAccounts,
      mode: getSettings().methodMode,
    });
    for (const a of actions) {
      actionStore.set(a.id, a);
    }
    storeInitialised = true;
  }
  return actionStore;
}

export function resetActionStore(): void {
  actionStore.clear();
  storeInitialised = false;
}

export async function actionRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/actions', async (_req, reply) => {
    const store = ensureStore();
    const actions = Array.from(store.values()).sort(
      (a, b) => a.priority - b.priority,
    );
    return reply.send({ actions });
  });

  app.post<{ Params: { id: string } }>(
    '/api/actions/:id/approve',
    async (req, reply) => {
      return setStatus(req.params.id, 'approved', reply);
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/actions/:id/execute',
    async (req, reply) => {
      // Marks executed after user confirms they manually performed the action.
      // No money movement happens here.
      return setStatus(req.params.id, 'executed', reply);
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/actions/:id/dismiss',
    async (req, reply) => {
      return setStatus(req.params.id, 'dismissed', reply);
    },
  );
}

function setStatus(
  id: string,
  status: ActionStatus,
  reply: Parameters<Parameters<FastifyInstance['post']>[1]>[1],
) {
  const store = ensureStore();
  const action = store.get(id);
  if (!action) {
    return reply.status(404).send({ error: 'Action not found', id });
  }
  const updated: ActionItem = { ...action, status };
  store.set(id, updated);
  return reply.send(updated);
}
