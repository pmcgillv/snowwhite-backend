import Fastify from 'fastify';
import cors from '@fastify/cors';

import { healthRoutes } from './routes/health.js';
import { accountRoutes } from './routes/accounts.js';
import { budgetRoutes } from './routes/budgets.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { actionRoutes } from './routes/actions.js';
import { cashflowRoutes } from './routes/cashflow.js';
import { reportRoutes } from './routes/reports.js';
import { setupRoutes } from './routes/setup.js';
import { settingsRoutes } from './routes/settings.js';
import { advisorRoutes } from './routes/advisor.js';
import { integrationRoutes } from './routes/integrations.js';

export function buildServer() {
  const app = Fastify({ logger: false });

  app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.register(healthRoutes);
  app.register(accountRoutes);
  app.register(budgetRoutes);
  app.register(dashboardRoutes);
  app.register(actionRoutes);
  app.register(cashflowRoutes);
  app.register(reportRoutes);
  app.register(setupRoutes);
  app.register(settingsRoutes);
  app.register(advisorRoutes);
  app.register(integrationRoutes);

  return app;
}
