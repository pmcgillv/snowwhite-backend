import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import type { Account, AccountType, InterestOnlyPeriod } from '@money-max/shared';
import { seedAccounts } from '../data/seed.js';

/** Mutable demo store — starts from seed, accepts local adds. */
const accounts: Account[] = [...seedAccounts];

const DEBT_TYPES: AccountType[] = ['credit', 'loan', 'mortgage', 'heloc'];

function kindToType(kind: string): AccountType {
  switch (kind) {
    case 'creditor':
      return 'loan';
    case 'mortgage':
      return 'mortgage';
    case 'asset':
      return 'investment';
    case 'bank':
    default:
      return 'checking';
  }
}

export function getAccounts(): Account[] {
  return accounts;
}

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/accounts', async (_req, reply) => {
    return reply.send({ accounts });
  });

  app.post<{
    Body: {
      kind?: string;
      name: string;
      institution?: string;
      balance: number;
      interestRateAPR?: number;
      interestOnlyPeriod?: InterestOnlyPeriod;
    };
  }>('/api/accounts', async (req, reply) => {
    const body = req.body;
    if (!body?.name || typeof body.balance !== 'number') {
      return reply.status(400).send({ error: 'name and balance are required' });
    }

    const type = kindToType(body.kind ?? 'bank');
    const isDebt = DEBT_TYPES.includes(type);
    const balance = isDebt ? -Math.abs(body.balance) : body.balance;

    const account: Account = {
      id: `acc-${uuidv4().slice(0, 8)}`,
      name: body.name,
      type,
      balance,
      interestRateAPR: body.interestRateAPR ?? 0,
      institution: body.institution ?? '',
      ...(body.interestOnlyPeriod?.active
        ? { interestOnlyPeriod: body.interestOnlyPeriod }
        : {}),
    };

    accounts.push(account);
    return reply.status(201).send({ account });
  });
}
