import type { FastifyInstance } from 'fastify';
import type { ChatRequest, ChatResponse } from '@money-max/shared';
import { seedAccounts } from '../data/seed.js';
import { generateActionPlan } from '../engine/actionPlan.js';
import { getSettings } from './settings.js';

const GREETING = `Hi! I'm your Money Max advisor. I can help you reduce debt faster, optimise your cash-flow timing, and build wealth. What would you like to work on today?`;

const CANNED_RESPONSES: Array<{
  keywords: string[];
  reply: (balance: string) => string;
  actions?: ChatResponse['suggestedActions'];
}> = [
  {
    keywords: ['debt', 'credit card', 'pay off', 'payoff'],
    reply: () =>
      `Based on your accounts, the BOA Cash Rewards card at 24.99% APR is costing you the most in interest. I recommend targeting it with every spare dollar using the avalanche method. Would you like me to generate an action plan?`,
    actions: [{ label: 'Generate debt payoff plan', prompt: 'Show me my action plan' }],
  },
  {
    keywords: ['cashflow', 'cash flow', 'timing', 'paycheck'],
    reply: () =>
      `Your paycheck hits on Fridays. I notice your mortgage is due on the 1st and your BOA CC on the 15th. Timing extra payments right after payday (Friday) before those due dates maximises your interest savings. Want me to show the optimised schedule?`,
    actions: [{ label: 'Show cashflow calendar', prompt: 'Show cashflow for 90 days' }],
  },
  {
    keywords: ['emergency', 'savings', 'fund'],
    reply: () =>
      `Your emergency fund in Ally HYSA is $6,450 — about 2-3 months of expenses. The target is $10,000 (3-4 months). Consider directing $150/bi-week there until you hit the target.`,
  },
  {
    keywords: ['interest', 'rate', 'apr'],
    reply: () =>
      `Here's your debt ranked by APR:\n1. BOA CC — 24.99%\n2. Chase CC — 21.74%\n3. Car loan — 5.99%\n4. Mortgage — 6.875%\n\nFocus extra payments on the BOA card first.`,
  },
  {
    keywords: ['net worth', 'wealth', 'progress'],
    reply: () =>
      `Your current net worth is approximately $−194,310. The mortgage is the biggest drag, but your 401(k) at $48,200 is growing. Eliminating the credit cards first frees ~$122/month in minimum payments you can redirect to savings.`,
  },
  {
    keywords: ['action', 'plan', 'recommend', 'suggest'],
    reply: () =>
      `I've generated a prioritised action plan. Your top move: sweep any idle checking balance to the BOA CC today. Even a $42 payment saves you ~$0.03/day in interest — and the habit compounds.`,
    actions: [
      { label: 'View action plan', prompt: 'Show my action plan' },
      { label: 'Approve top action', prompt: 'Approve the highest priority action' },
    ],
  },
];

export async function advisorRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ChatRequest }>(
    '/api/advisor/chat',
    async (req, reply) => {
      const { message } = req.body ?? {};
      if (!message || typeof message !== 'string') {
        return reply.status(400).send({ error: 'message is required' });
      }

      const lower = message.toLowerCase();
      const accounts = seedAccounts;
      const { actions } = generateActionPlan({
        accounts,
        mode: getSettings().methodMode,
      });
      const topAction = actions[0];

      // Check canned responses
      for (const canned of CANNED_RESPONSES) {
        if (canned.keywords.some((kw) => lower.includes(kw))) {
          const checkingBalance = accounts
            .filter((a) => a.type === 'checking')
            .reduce((s, a) => s + a.balance, 0)
            .toFixed(2);
          const response: ChatResponse = {
            reply: canned.reply(checkingBalance),
            suggestedActions: canned.actions,
          };
          return reply.send(response);
        }
      }

      // Greeting / fallback
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return reply.send({ reply: GREETING });
      }

      // Generic fallback with top action
      const fallbackReply = topAction
        ? `Good question! My top recommendation right now is: "${topAction.reason}" — this saves an estimated $${topAction.interestImpact.toFixed(2)} in interest. Would you like more detail?`
        : `I'm analysing your accounts. Could you rephrase or ask about debt, cash-flow, emergency fund, or your action plan?`;

      const response: ChatResponse = {
        reply: fallbackReply,
        suggestedActions: topAction
          ? [{ label: 'Approve this action', actionItemId: topAction.id }]
          : undefined,
      };

      return reply.send(response);
    },
  );
}
