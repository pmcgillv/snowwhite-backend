import { describe, it, expect } from 'vitest';
import type { Account } from '@money-max/shared';
import { generateActionPlan } from '../src/engine/actionPlan.js';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const checkingAcc: Account = {
  id: 'acc-checking',
  name: 'Main Checking',
  type: 'checking',
  balance: 2_500,
  interestRateAPR: 0,
  institution: 'Test Bank',
};

const savingsAcc: Account = {
  id: 'acc-savings',
  name: 'HYSA',
  type: 'savings',
  balance: 8_000,
  interestRateAPR: 4.75,
  institution: 'Ally',
};

const lowSavingsAcc: Account = {
  id: 'acc-savings-low',
  name: 'Basic Savings',
  type: 'savings',
  balance: 500,
  interestRateAPR: 0.01,
  institution: 'Big Bank',
};

const highAprCard: Account = {
  id: 'acc-cc-high',
  name: 'High APR Card',
  type: 'credit',
  balance: -5_000,
  interestRateAPR: 24.99,
  institution: 'Visa',
  minimumPayment: 100,
  dueDay: 15,
};

const lowAprCard: Account = {
  id: 'acc-cc-low',
  name: 'Low APR Card',
  type: 'credit',
  balance: -1_200,
  interestRateAPR: 12.99,
  institution: 'Mastercard',
  minimumPayment: 25,
  dueDay: 22,
};

const carLoan: Account = {
  id: 'acc-car',
  name: 'Car Loan',
  type: 'loan',
  balance: -8_000,
  interestRateAPR: 5.99,
  institution: 'Toyota Financial',
  minimumPayment: 250,
  dueDay: 10,
};

const mortgage: Account = {
  id: 'acc-mortgage',
  name: 'Mortgage',
  type: 'mortgage',
  balance: -280_000,
  interestRateAPR: 6.875,
  institution: 'BOA',
  minimumPayment: 1_850,
  dueDay: 1,
};

const helocAcc: Account = {
  id: 'acc-heloc',
  name: 'HELOC',
  type: 'heloc',
  balance: -15_000,
  interestRateAPR: 8.5,
  institution: 'Credit Union',
  creditLimit: 50_000,
  minimumPayment: 150,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateActionPlan — checking_savings mode', () => {
  it('returns an array of ActionItems with required fields', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, highAprCard],
      mode: 'checking_savings',
    });

    expect(Array.isArray(actions)).toBe(true);
    for (const a of actions) {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('type');
      expect(a).toHaveProperty('fromAccountId');
      expect(a).toHaveProperty('toAccountId');
      expect(a).toHaveProperty('amount');
      expect(a).toHaveProperty('suggestedDate');
      expect(a).toHaveProperty('reason');
      expect(a).toHaveProperty('interestImpact');
      expect(a.status).toBe('pending');
    }
  });

  it('targets the highest-APR debt first (avalanche)', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, highAprCard, lowAprCard, carLoan],
      mode: 'checking_savings',
    });

    // The sweep or extra-payment action should target highAprCard, not the lower-rate debts
    const debtTargets = actions
      .filter((a) => a.type === 'sweep' || a.type === 'debt_payment')
      .map((a) => a.toAccountId);

    const firstDebtTarget = debtTargets[0];
    expect(firstDebtTarget).toBe(highAprCard.id);
  });

  it('sweeps idle checking cash to the highest-APR debt', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, highAprCard],
      mode: 'checking_savings',
    });

    const sweep = actions.find(
      (a) => a.type === 'sweep' && a.fromAccountId === checkingAcc.id,
    );
    expect(sweep).toBeDefined();
    expect(sweep?.toAccountId).toBe(highAprCard.id);
    // Should sweep checking balance above $200 buffer
    expect(sweep?.amount).toBeCloseTo(checkingAcc.balance - 200, 0);
  });

  it('does not generate actions when checking has no surplus', () => {
    const nearEmptyChecking: Account = {
      ...checkingAcc,
      balance: 100,
    };
    const { actions } = generateActionPlan({
      accounts: [nearEmptyChecking, highAprCard],
      mode: 'checking_savings',
    });

    // No sweep should fire — can't drain below buffer
    const sweeps = actions.filter((a) => a.type === 'sweep');
    expect(sweeps.length).toBe(0);
  });

  it('calculates positive interestImpact for all debt-payment actions', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, highAprCard, lowAprCard],
      mode: 'checking_savings',
    });

    const debtActions = actions.filter(
      (a) => a.type === 'debt_payment' || a.type === 'sweep',
    );
    expect(debtActions.length).toBeGreaterThan(0);
    for (const a of debtActions) {
      expect(a.interestImpact).toBeGreaterThanOrEqual(0);
    }
  });

  it('projects a debtFreeMonths value when debts exist', () => {
    const { debtFreeMonths } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, highAprCard, lowAprCard, carLoan],
      mode: 'checking_savings',
    });
    expect(debtFreeMonths).toBeGreaterThan(0);
  });

  it('returns debtFreeMonths = 0 when there are no non-mortgage debts', () => {
    const { debtFreeMonths } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, mortgage],
      mode: 'checking_savings',
    });
    expect(debtFreeMonths).toBe(0);
  });

  it('suggests reserving funds into HYSA when emergency fund is low', () => {
    const veryLowSavings: Account = {
      ...savingsAcc,
      balance: 500,  // well below $10 000 target
    };
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, veryLowSavings, highAprCard],
      mode: 'checking_savings',
    });

    const reserve = actions.find((a) => a.type === 'reserve');
    expect(reserve).toBeDefined();
  });

  it('sorts actions by priority ascending', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, highAprCard, lowAprCard],
      mode: 'checking_savings',
    });

    for (let i = 1; i < actions.length; i++) {
      expect((actions[i] as typeof actions[0]).priority).toBeGreaterThanOrEqual(
        (actions[i - 1] as typeof actions[0]).priority,
      );
    }
  });
});

describe('generateActionPlan — line_of_credit mode', () => {
  it('generates a transfer action from checking into HELOC', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, helocAcc, highAprCard],
      mode: 'line_of_credit',
    });

    const transfer = actions.find(
      (a) => a.type === 'transfer' && a.toAccountId === helocAcc.id,
    );
    expect(transfer).toBeDefined();
  });

  it('recommends HELOC arbitrage when HELOC APR < debt APR', () => {
    const lowRateHeloc: Account = {
      ...helocAcc,
      interestRateAPR: 7.5,  // lower than highAprCard (24.99%)
    };
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, lowRateHeloc, highAprCard],
      mode: 'line_of_credit',
    });

    const arbitrage = actions.find(
      (a) =>
        a.fromAccountId === lowRateHeloc.id &&
        a.toAccountId === highAprCard.id &&
        a.type === 'debt_payment',
    );
    expect(arbitrage).toBeDefined();
    expect(arbitrage?.interestImpact).toBeGreaterThan(0);
  });
});

describe('generateActionPlan — edge cases', () => {
  it('handles zero debt gracefully', () => {
    const result = generateActionPlan({
      accounts: [checkingAcc, savingsAcc],
      mode: 'checking_savings',
    });
    expect(result.actions).toBeDefined();
    expect(result.debtFreeMonths).toBe(0);
  });

  it('handles empty accounts array', () => {
    const result = generateActionPlan({
      accounts: [],
      mode: 'checking_savings',
    });
    expect(result.actions).toEqual([]);
    expect(result.projectedInterestSaved).toBe(0);
  });

  it('returns a summary projectedInterestSaved that is the sum of all action impacts', () => {
    const { actions, projectedInterestSaved } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, highAprCard, lowAprCard],
      mode: 'checking_savings',
    });

    const manualSum = actions.reduce((s, a) => s + a.interestImpact, 0);
    expect(projectedInterestSaved).toBeCloseTo(manualSum, 1);
  });
});

describe('generateActionPlan — interest-only periods', () => {
  const ioHeloc: Account = {
    ...helocAcc,
    interestRateAPR: 28.5, // higher than the CC — but IO, so extras skip it
    interestOnlyPeriod: {
      active: true,
      months: 18,
      startDate: '2026-01-01',
      endDate: '2027-07-01',
    },
  };

  it('does not sweep extra principal onto interest-only debts', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, ioHeloc, highAprCard],
      mode: 'checking_savings',
    });

    const extrasToIo = actions.filter(
      (a) =>
        a.toAccountId === ioHeloc.id &&
        (a.type === 'sweep' || (a.type === 'debt_payment' && a.amount > (ioHeloc.minimumPayment ?? 0))),
    );
    expect(extrasToIo.length).toBe(0);

    const sweep = actions.find((a) => a.type === 'sweep');
    expect(sweep?.toAccountId).toBe(highAprCard.id);
  });

  it('schedules interest-only minimum with an explanatory reason', () => {
    const { actions } = generateActionPlan({
      accounts: [checkingAcc, savingsAcc, ioHeloc],
      mode: 'checking_savings',
    });

    const ioPay = actions.find(
      (a) => a.toAccountId === ioHeloc.id && a.type === 'debt_payment',
    );
    expect(ioPay).toBeDefined();
    expect(ioPay?.amount).toBe(ioHeloc.minimumPayment);
    expect(ioPay?.reason.toLowerCase()).toContain('interest-only');
  });
});
