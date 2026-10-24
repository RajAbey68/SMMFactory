// tools/ab-testing-engine.mjs — Landing Page & Ad Variant A/B Testing Engine
// Computes statistical significance (Two-Proportion Z-Test) and triggers automatic winner graduation.

export class ABTestingEngine {
  constructor(config = {}) {
    this.confidenceThreshold = config.confidenceThreshold || 0.95; // 95% statistical confidence
    this.minSampleSize = config.minSampleSize || 100; // Minimum visitors per variant
  }

  /**
   * Evaluates split test performance between Variant A (control) and Variant B (treatment)
   * @param {object} variantA - { name: string, visitors: number, conversions: number }
   * @param {object} variantB - { name: string, visitors: number, conversions: number }
   */
  evaluateTest(variantA, variantB) {
    if (!variantA || !variantB) throw new Error('Both variantA and variantB are required');

    const nA = variantA.visitors || 0;
    const cA = variantA.conversions || 0;
    const nB = variantB.visitors || 0;
    const cB = variantB.conversions || 0;

    const crA = nA > 0 ? cA / nA : 0;
    const crB = nB > 0 ? cB / nB : 0;

    const lift = crA > 0 ? ((crB - crA) / crA) * 100 : 0;

    // Check sample size threshold
    if (nA < this.minSampleSize || nB < this.minSampleSize) {
      return {
        status: 'COLLECTING_DATA',
        confidence: 0,
        lift_percent: Math.round(lift * 100) / 100,
        variant_a: { ...variantA, cr: Math.round(crA * 10000) / 100 },
        variant_b: { ...variantB, cr: Math.round(crB * 10000) / 100 },
        recommendation: `Insufficient sample size (Need >= ${this.minSampleSize} per variant). Keep test running.`
      };
    }

    // Two-proportion Z-score calculation
    const pPool = (cA + cB) / (nA + nB);
    const se = Math.sqrt(pPool * (1 - pPool) * ((1 / nA) + (1 / nB)));
    const zScore = se > 0 ? (crB - crA) / se : 0;

    // Approximate cumulative normal distribution for two-tailed p-value
    const pValue = 2 * (1 - this._normalCdf(Math.abs(zScore)));
    const confidence = Math.max(0, Math.min(1, 1 - pValue));

    const isSignificant = confidence >= this.confidenceThreshold;
    let winner = null;
    let action = 'CONTINUE_TESTING';

    if (isSignificant) {
      winner = crB > crA ? variantB.name : variantA.name;
      action = 'GRADUATE_WINNER';
    }

    return {
      status: isSignificant ? 'STATISTICALLY_SIGNIFICANT' : 'NO_SIGNIFICANT_DIFFERENCE',
      confidence: Math.round(confidence * 1000) / 1000,
      p_value: Math.round(pValue * 10000) / 10000,
      lift_percent: Math.round(lift * 100) / 100,
      z_score: Math.round(zScore * 100) / 100,
      winner,
      action,
      variant_a: { ...variantA, cr_percent: Math.round(crA * 10000) / 100 },
      variant_b: { ...variantB, cr_percent: Math.round(crB * 10000) / 100 },
      recommendation: isSignificant
        ? `Graduate ${winner} as default baseline (+${Math.abs(Math.round(lift))} % lift at ${Math.round(confidence * 100)}% confidence).`
        : 'Differences are within normal variance. Continue collecting impressions.'
    };
  }

  _normalCdf(z) {
    // Standard normal cumulative distribution approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
  }
}
