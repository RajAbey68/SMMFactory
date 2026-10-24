// tools/attribution-engine.mjs — Multi-Touch Conversion Attribution & ROAS Analysis Engine
// Implements first-touch, last-touch, linear, and time-decay attribution across Meta, Google, and WhatsApp channels.

export const ATTRIBUTION_MODELS = {
  FIRST_TOUCH: 'first_touch',
  LAST_TOUCH: 'last_touch',
  LINEAR: 'linear',
  TIME_DECAY: 'time_decay'
};

/**
 * Calculates channel attribution weights based on user journey touchpoints
 * @param {Array<{ channel: string, timestamp: string }>} touchpoints
 * @param {string} model - One of ATTRIBUTION_MODELS
 * @returns {Record<string, number>} Normalized weights per channel summing to 1.0
 */
export function calculateAttribution(touchpoints = [], model = ATTRIBUTION_MODELS.LINEAR) {
  if (!Array.isArray(touchpoints) || touchpoints.length === 0) {
    return {};
  }

  const weights = {};
  const totalPoints = touchpoints.length;

  if (model === ATTRIBUTION_MODELS.FIRST_TOUCH) {
    const first = touchpoints[0].channel;
    weights[first] = 1.0;
    return weights;
  }

  if (model === ATTRIBUTION_MODELS.LAST_TOUCH) {
    const last = touchpoints[totalPoints - 1].channel;
    weights[last] = 1.0;
    return weights;
  }

  if (model === ATTRIBUTION_MODELS.LINEAR) {
    const split = 1.0 / totalPoints;
    for (const tp of touchpoints) {
      weights[tp.channel] = (weights[tp.channel] || 0) + split;
    }
    // Round to 4 decimal places
    for (const k in weights) {
      weights[k] = Math.round(weights[k] * 10000) / 10000;
    }
    return weights;
  }

  if (model === ATTRIBUTION_MODELS.TIME_DECAY) {
    // 7-day half-life weighting: 2^((t - t_conv) / half_life)
    const convTime = new Date(touchpoints[totalPoints - 1].timestamp).getTime();
    const halfLifeMs = 7 * 24 * 60 * 60 * 1000;

    let totalWeight = 0;
    const rawWeights = touchpoints.map(tp => {
      const tpTime = new Date(tp.timestamp).getTime();
      const diffMs = Math.max(0, convTime - tpTime);
      const w = Math.pow(2, -diffMs / halfLifeMs);
      totalWeight += w;
      return { channel: tp.channel, weight: w };
    });

    for (const rw of rawWeights) {
      const normalized = rw.weight / (totalWeight || 1);
      weights[rw.channel] = (weights[rw.channel] || 0) + normalized;
    }

    for (const k in weights) {
      weights[k] = Math.round(weights[k] * 10000) / 10000;
    }
    return weights;
  }

  throw new Error(`Unsupported attribution model: ${model}`);
}

/**
 * Computes ROAS per channel given multi-touch attribution weights and spend data
 * @param {object} params
 * @param {Record<string, number>} params.channelSpendUsd - e.g. { meta: 150, google: 100 }
 * @param {Array<{ conversion_value_usd: number, touchpoints: Array<{ channel: string, timestamp: string }> }>} params.conversions
 * @param {string} params.model
 */
export function computeMultiTouchRoas({ channelSpendUsd = {}, conversions = [], model = ATTRIBUTION_MODELS.LINEAR }) {
  const attributedRevenue = {};

  for (const conv of conversions) {
    const value = conv.conversion_value_usd || 0;
    const weights = calculateAttribution(conv.touchpoints, model);

    for (const [channel, weight] of Object.entries(weights)) {
      attributedRevenue[channel] = (attributedRevenue[channel] || 0) + (value * weight);
    }
  }

  const roasReport = {};
  for (const [channel, spend] of Object.entries(channelSpendUsd)) {
    const rev = attributedRevenue[channel] || 0;
    const roas = spend > 0 ? Math.round((rev / spend) * 100) / 100 : 0;
    roasReport[channel] = {
      spend_usd: spend,
      attributed_revenue_usd: Math.round(rev * 100) / 100,
      roas
    };
  }

  return {
    model,
    total_spend_usd: Object.values(channelSpendUsd).reduce((a, b) => a + b, 0),
    total_conversions: conversions.length,
    channel_performance: roasReport
  };
}
