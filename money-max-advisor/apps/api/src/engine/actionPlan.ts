import { v4 as uuidv4 } from 'uuid';
import type { Account, ActionItem, ActionType, MethodMode } from '@money-max/shared';
import { isInterestOnlyActive } from '@money-max/shared';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_IN_YEAR = 365;

// ── Interest helpers ──────────────────────────────────────────────────────────

/**
 * Daily interest accrued on a balance at the given APR.
 */
function dailyInterest(balance: number, apr: number): number {
  return (Math.abs(balance) * (apr / 100)) / DAYS_IN_YEAR;
}

/**
 * Project total interest saved by paying `extraAmount` today on a debt account
 * given it accrues at `apr` until the next statement (30-day window default).
 */
function interestSavedByExtraPayment(
  balance: number,
  apr: number,
  extraAmount: number,
  daysWindow: number = 30,
): number {
  const dailyRate = apr / 100 / DAYS_IN_YEAR;
  // Interest on the extra principal avoided over the window
  return extraAmount * dailyRate * daysWindow;
}

/**
 * Months to pay off a debt given a fixed payment.
 * Returns Infinity if payment doesn't cover interest.
 */
function monthsToPayoff(balance: number, apr: number, monthlyPayment: number): number {
  const monthlyRate = apr / 100 / 12;
  const principal = Math.abs(balance);
  if (monthlyRate === 0) return principal / monthlyPayment;
  const monthlyInterest = principal * monthlyRate;
  if (monthlyPayment <= monthlyInterest) return Infinity;
  return Math.ceil(
    Math.log(monthlyPayment / (monthlyPayment - monthlyInterest)) /
    Math.log(1 + monthlyRate),
  );
}

// ── Core engine ───────────────────────────────────────────────────────────────

export interface PlanContext {
  accounts: Account[];
  mode: MethodMode;
  availableCash?: number;        // override liquid surplus; if omitted, computed
  existingActionIds?: Set<string>;
}

export interface ActionPlanResult {
  actions: ActionItem[];
  debtFreeMonths: number;
  projectedInterestSaved: number;
}

/**
 * Generate a prioritised list of ActionItems that reduce interest volume.
 *
 * Strategy:
 *  1. Identify the highest-APR debt → avalanche target.
 *  2. Compute liquid surplus (checking + savings − 1-month bill buffer).
 *  3. In checking_savings mode: sweep excess checking to target debt.
 *  4. In line_of_credit mode: push paycheck through HELOC, pay bills from HELOC.
 *  5. Reserve minimum emergency fund in HYSA.
 *  6. Rank by interestImpact descending.
 */
export function generateActionPlan(ctx: PlanContext): ActionPlanResult {
  const { accounts, mode } = ctx;

  const checking = accounts.filter((a) => a.type === 'checking');
  const savings = accounts.filter((a) => a.type === 'savings');
  const debts = accounts.filter((a) =>
    ['credit', 'loan', 'mortgage', 'heloc'].includes(a.type) && a.interestRateAPR > 0,
  );
  const heloc = accounts.find((a) => a.type === 'heloc');

  // Sort debts by APR descending (avalanche). Prefer debts that can take principal
  // over accounts still in an interest-only period (extra $ doesn't reduce principal).
  const sortedDebts = [...debts].sort((a, b) => {
    const aIo = isInterestOnlyActive(a) ? 1 : 0;
    const bIo = isInterestOnlyActive(b) ? 1 : 0;
    if (aIo !== bIo) return aIo - bIo;
    return b.interestRateAPR - a.interestRateAPR;
  });
  const avalancheTargets = sortedDebts.filter((d) => !isInterestOnlyActive(d));
  const highestAprDebt = (avalancheTargets[0] ?? sortedDebts[0]) as Account | undefined;

  // Liquid assets
  const totalChecking = checking.reduce((s, a) => s + a.balance, 0);
  const totalSavings = savings.reduce((s, a) => s + a.balance, 0);

  // Minimum emergency buffer: 1 month of bills (~$2 700 conservative estimate)
  const EMERGENCY_BUFFER = 2_700;
  const OPTIMAL_EMERGENCY_FUND = 10_000;

  const liquidSurplus =
    ctx.availableCash ??
    Math.max(0, totalChecking + totalSavings - EMERGENCY_BUFFER);

  const actions: ActionItem[] = [];

  // ── 1. Emergency fund top-up ────────────────────────────────────────────────
  // If total savings < optimal, suggest moving money there before extra debt pay.
  // Keep at least $500 in checking as a small operating buffer.
  const CHECKING_KEEP = 500;
  const fundGap = Math.max(0, OPTIMAL_EMERGENCY_FUND - totalSavings);
  const highYieldSavings = savings
    .filter((a) => a.interestRateAPR > 0.5)
    .sort((a, b) => b.interestRateAPR - a.interestRateAPR)[0];

  if (fundGap > 0 && totalChecking > CHECKING_KEEP && highYieldSavings) {
    const transferAmount = Math.min(
      fundGap,
      totalChecking - CHECKING_KEEP,
    );
    if (transferAmount > 50) {
      const checkingAccount = checking[0];
      if (checkingAccount) {
        actions.push(makeAction({
          type: 'reserve',
          fromAccountId: checkingAccount.id,
          toAccountId: highYieldSavings.id,
          amount: round2(transferAmount),
          suggestedDate: daysFromNow(1),
          reason: `Build emergency fund in ${highYieldSavings.name} (${highYieldSavings.interestRateAPR}% APY).`,
          interestImpact: round2(transferAmount * (highYieldSavings.interestRateAPR / 100) / 12),
          priority: 3,
        }));
      }
    }
  }

  // ── 2. Checking_Savings mode actions ────────────────────────────────────────
  if (mode === 'checking_savings') {
    const checkingAccount = checking[0];

    // Sweep excess checking to highest-APR debt that accepts principal
    if (highestAprDebt && checkingAccount && !isInterestOnlyActive(highestAprDebt)) {
      const checkingSurplus = Math.max(0, checkingAccount.balance - 200); // keep $200 buffer
      if (checkingSurplus > 25) {
        const sweepAmount = Math.min(checkingSurplus, Math.abs(highestAprDebt.balance));
        actions.push(makeAction({
          type: 'sweep',
          fromAccountId: checkingAccount.id,
          toAccountId: highestAprDebt.id,
          amount: round2(sweepAmount),
          suggestedDate: daysFromNow(1),
          reason: `Sweep idle checking cash to ${highestAprDebt.name} (${highestAprDebt.interestRateAPR}% APR). Every day money sits in checking costs ~$${round2(dailyInterest(highestAprDebt.balance, highestAprDebt.interestRateAPR)).toFixed(2)} in interest.`,
          interestImpact: round2(interestSavedByExtraPayment(highestAprDebt.balance, highestAprDebt.interestRateAPR, sweepAmount)),
          priority: 1,
        }));
      }
    }

    // Extra payment from savings surplus (above emergency buffer)
    if (highestAprDebt && liquidSurplus > 200 && !isInterestOnlyActive(highestAprDebt)) {
      const extraPayment = Math.min(liquidSurplus - 200, Math.abs(highestAprDebt.balance));
      if (extraPayment > 50) {
        const savingsSource =
          savings.sort((a, b) => a.interestRateAPR - b.interestRateAPR)[0]; // use lowest-APR savings first
        if (savingsSource) {
          actions.push(makeAction({
            type: 'debt_payment',
            fromAccountId: savingsSource.id,
            toAccountId: highestAprDebt.id,
            amount: round2(extraPayment),
            suggestedDate: daysFromNow(3),
            reason: `Extra principal payment on ${highestAprDebt.name} eliminates the highest-rate debt faster. Avalanche method.`,
            interestImpact: round2(interestSavedByExtraPayment(highestAprDebt.balance, highestAprDebt.interestRateAPR, extraPayment, 60)),
            priority: 2,
          }));
        }
      }
    }

    // Interest-only debts: schedule interest (min) only — no extra principal
    for (const debt of debts) {
      if (!isInterestOnlyActive(debt)) continue;
      const minPay = debt.minimumPayment ?? 0;
      const checkingAccountIo = checking[0];
      if (minPay > 0 && checkingAccountIo) {
        const endHint = debt.interestOnlyPeriod?.endDate
          ? ` until ${debt.interestOnlyPeriod.endDate}`
          : debt.interestOnlyPeriod?.months
            ? ` for ~${debt.interestOnlyPeriod.months} months`
            : '';
        actions.push(makeAction({
          type: 'debt_payment',
          fromAccountId: checkingAccountIo.id,
          toAccountId: debt.id,
          amount: minPay,
          suggestedDate: daysUntilDay(debt.dueDay ?? 1),
          reason: `Interest-only payment on ${debt.name} (${debt.interestRateAPR}% APR). Principal stays flat${endHint} — extras go to higher-impact debts.`,
          interestImpact: round2(interestSavedByExtraPayment(debt.balance, debt.interestRateAPR, minPay, 5)),
          priority: 5,
        }));
      }
    }

    // For secondary debts: suggest paying minimums + small extras
    for (let i = 0; i < sortedDebts.length; i++) {
      const debt = sortedDebts[i] as Account;
      if (!debt || debt.type === 'mortgage') continue; // skip mortgage in this pass
      if (isInterestOnlyActive(debt)) continue; // handled above
      if (highestAprDebt && debt.id === highestAprDebt.id) continue; // extras already planned
      const minPay = debt.minimumPayment ?? 0;
      if (minPay > 0) {
        const checkingAccount2 = checking[0];
        if (checkingAccount2) {
          actions.push(makeAction({
            type: 'debt_payment',
            fromAccountId: checkingAccount2.id,
            toAccountId: debt.id,
            amount: minPay,
            suggestedDate: daysUntilDay(debt.dueDay ?? 15),
            reason: `Minimum payment on ${debt.name} (${debt.interestRateAPR}% APR) due on day ${debt.dueDay}.`,
            interestImpact: round2(interestSavedByExtraPayment(debt.balance, debt.interestRateAPR, minPay, 5)),
            priority: 4 + i,
          }));
        }
      }
    }
  }

  // ── 3. Line_of_Credit mode actions ──────────────────────────────────────────
  if (mode === 'line_of_credit' && heloc) {
    const checkingAccount = checking[0];

    // Deposit paycheck into HELOC to immediately reduce balance
    if (checkingAccount && checkingAccount.balance > 0) {
      actions.push(makeAction({
        type: 'transfer',
        fromAccountId: checkingAccount.id,
        toAccountId: heloc.id,
        amount: round2(checkingAccount.balance),
        suggestedDate: daysFromNow(0),
        reason: `Park checking balance in HELOC to reduce principal daily. Draw back for bills as needed.`,
        interestImpact: round2(dailyInterest(heloc.balance, heloc.interestRateAPR) * 30),
        priority: 1,
      }));
    }

    // Pay highest-APR non-HELOC debt from HELOC (arbitrage if HELOC rate < debt rate)
    if (highestAprDebt && highestAprDebt.id !== heloc.id &&
        heloc.interestRateAPR < highestAprDebt.interestRateAPR) {
      const amount = Math.min(Math.abs(highestAprDebt.balance), Math.abs(heloc.creditLimit ?? 0) * 0.5);
      if (amount > 100) {
        actions.push(makeAction({
          type: 'debt_payment',
          fromAccountId: heloc.id,
          toAccountId: highestAprDebt.id,
          amount: round2(amount),
          suggestedDate: daysFromNow(1),
          reason: `Use HELOC (${heloc.interestRateAPR}% APR) to pay off ${highestAprDebt.name} (${highestAprDebt.interestRateAPR}% APR) — saves ${round2(highestAprDebt.interestRateAPR - heloc.interestRateAPR)}% in rate spread.`,
          interestImpact: round2(
            amount * (highestAprDebt.interestRateAPR - heloc.interestRateAPR) / 100 / 12,
          ),
          priority: 2,
        }));
      }
    }
  }

  // ── 4. Paycheck timing optimisation ─────────────────────────────────────────
  // Suggest paying CC statement balance within 2 days of paycheck to avoid
  // interest on the grace period.
  for (const debt of sortedDebts) {
    if (debt.type !== 'credit') continue;
    const dueDate = daysUntilDay(debt.dueDay ?? 22);
    const fullBalance = Math.abs(debt.balance);
    if (fullBalance > 0 && liquidSurplus >= fullBalance) {
      // Can pay in full — recommend it
      const checkingOrSavings =
        checking[0]?.id ?? savings[0]?.id;
      if (checkingOrSavings) {
        const existing = actions.find(
          (a) => a.toAccountId === debt.id && a.type === 'debt_payment',
        );
        if (!existing) {
          actions.push(makeAction({
            type: 'debt_payment',
            fromAccountId: checkingOrSavings,
            toAccountId: debt.id,
            amount: round2(fullBalance),
            suggestedDate: dueDate,
            reason: `Pay ${debt.name} in FULL before due date. Eliminates ${debt.interestRateAPR}% APR entirely this cycle.`,
            interestImpact: round2(interestSavedByExtraPayment(debt.balance, debt.interestRateAPR, fullBalance, 30)),
            priority: 1,
          }));
        }
      }
    }
  }

  // ── 5. Sort by priority then interestImpact ──────────────────────────────────
  actions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.interestImpact - a.interestImpact;
  });

  // ── 6. Compute summary stats ──────────────────────────────────────────────────
  const projectedInterestSaved = actions.reduce(
    (sum, a) => sum + a.interestImpact, 0,
  );

  // Simple debt-free estimate: assume $500/mo extra after plan actions.
  // Interest-only balances don't amortize until the period ends — exclude them
  // from the principal runway (they're paid down after IO expires).
  const totalDebtExMortgage = debts
    .filter((d) => d.type !== 'mortgage' && !isInterestOnlyActive(d))
    .reduce((s, d) => s + Math.abs(d.balance), 0);
  const maxIoMonths = debts
    .filter((d) => isInterestOnlyActive(d))
    .reduce((max, d) => {
      const io = d.interestOnlyPeriod;
      if (!io) return max;
      if (io.endDate) {
        const monthsLeft = Math.max(
          0,
          Math.ceil(
            (new Date(io.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44),
          ),
        );
        return Math.max(max, monthsLeft);
      }
      return Math.max(max, io.months ?? 0);
    }, 0);
  const amortMonths = totalDebtExMortgage > 0
    ? Math.ceil(totalDebtExMortgage / 500)
    : 0;
  const debtFreeMonths = amortMonths + (totalDebtExMortgage === 0 && maxIoMonths > 0 ? maxIoMonths : 0);

  return { actions, debtFreeMonths, projectedInterestSaved: round2(projectedInterestSaved) };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAction(
  opts: Omit<ActionItem, 'id' | 'status'>,
): ActionItem {
  return { ...opts, id: uuidv4(), status: 'pending' };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0] as string;
}

/** Return an ISO date string for the next occurrence of `day` in the month. */
function daysUntilDay(day: number): string {
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target <= now) {
    target = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  return target.toISOString().split('T')[0] as string;
}
