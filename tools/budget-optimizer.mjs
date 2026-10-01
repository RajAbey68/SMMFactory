// tools/budget-optimizer.mjs — Dynamic Budget Reallocation Engine based on Hormozi Value Equation & Ad Performance
// Rebalances daily budgets: scaling winners (+25%) and trimming underperformers (-50% or pause) within safe bounds.

export const BUDGET_CONSTRAINTS = {
  MIN_DAILY_BUDGET_USD: 10,
  MAX_DAILY_BUDGET_USD: 500,
  SCALE_UP_FACTOR: 1.25,    // +25% for high ROAS / CTR
  TRIM_DOWN_FACTOR: 0.50,   // -50% for low ROAS / high CPC
  TARGET_ROAS_THRESHOLD: 3.0,
  MIN_CTR_THRESHOLD: 1.0     // 1.0% minimum CTR
};

/**
 * Rebalances ad spend across active platforms based on real-time metrics.
 * @param {Array<{ channel: string, currentBudget: number, ctr: number, cpc: number, roas: number }>} channelMetrics
 * @returns {{ allocations: Array<object>, totalBudget: number, recommendations: string[] }}
 */
export function optimizeBudget(channelMetrics) {
  if (!Array.isArray(channelMetrics) || channelMetrics.length === 0) {
    throw new Error('channelMetrics must be a non-empty array');
  }

  const recommendations = [];
  const allocations = channelMetrics.map(item => {
    let newBudget = item.currentBudget;
    let action = 'MAINTAIN';
    let rationale = 'Performance within expected baseline parameters';

    // High performance: ROAS >= 3.0 or CTR >= 2.0%
    if (item.roas >= BUDGET_CONSTRAINTS.TARGET_ROAS_THRESHOLD || item.ctr >= 2.0) {
      newBudget = Math.round(item.currentBudget * BUDGET_CONSTRAINTS.SCALE_UP_FACTOR);
      action = 'SCALE_UP';
      rationale = `High ROAS (${item.roas}x) or CTR (${item.ctr}%). Scaled budget +25%.`;
    }
    // Underperformance: ROAS < 1.5 and CTR < 1.0%
    else if (item.roas < 1.5 && item.ctr < BUDGET_CONSTRAINTS.MIN_CTR_THRESHOLD) {
      newBudget = Math.round(item.currentBudget * BUDGET_CONSTRAINTS.TRIM_DOWN_FACTOR);
      action = 'TRIM_DOWN';
      rationale = `Sub-threshold ROAS (${item.roas}x) and CTR (${item.ctr}%). Trimmed budget -50%.`;
    }

    // Enforce safety clamps ($10 to $500/day)
    if (newBudget < BUDGET_CONSTRAINTS.MIN_DAILY_BUDGET_USD) {
      newBudget = BUDGET_CONSTRAINTS.MIN_DAILY_BUDGET_USD;
      rationale += ` (Clamped to minimum safe floor $${BUDGET_CONSTRAINTS.MIN_DAILY_BUDGET_USD}/day)`;
    } else if (newBudget > BUDGET_CONSTRAINTS.MAX_DAILY_BUDGET_USD) {
      newBudget = BUDGET_CONSTRAINTS.MAX_DAILY_BUDGET_USD;
      rationale += ` (Clamped to maximum safe ceiling $${BUDGET_CONSTRAINTS.MAX_DAILY_BUDGET_USD}/day)`;
    }

    recommendations.push(`[${item.channel.toUpperCase()}] ${action}: $${item.currentBudget} -> $${newBudget}/day. ${rationale}`);

    return {
      channel: item.channel,
      previous_budget: item.currentBudget,
      optimized_budget: newBudget,
      delta: newBudget - item.currentBudget,
      action,
      rationale
    };
  });

  const totalBudget = allocations.reduce((sum, a) => sum + a.optimized_budget, 0);

  return {
    allocations,
    totalBudget,
    recommendations
  };
}
