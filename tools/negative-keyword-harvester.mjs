// tools/negative-keyword-harvester.mjs — Search Term Waste Scrubber & Negative Keyword Harvester
// Discovers search queries with 0 conversions and high spend / irrelevance, and compiles negative lists.

export class NegativeKeywordHarvester {
  constructor(config = {}) {
    this.spendThresholdUsd = config.spendThresholdUsd || 15; // Flag terms with >$15 spend & 0 conversions
    this.irrelevantIntentWords = [
      'cheap', 'free', 'hostel', 'jobs', 'vacancy', 'map', 'directions',
      'salary', 'weather', 'news', 'wikipedia', 'owner', 'booking.com'
    ];
  }

  /**
   * Evaluates Google Ads Search Terms query report and flags wasted ad spend
   * @param {Array<object>} searchTerms - [{ query: string, clicks: number, spend_usd: number, conversions: number }]
   */
  harvestNegatives(searchTerms = []) {
    const candidates = [];
    let wastedSpendUsd = 0;

    for (const term of searchTerms) {
      const queryLower = (term.query || '').toLowerCase();
      const conversions = term.conversions || 0;
      const spend = term.spend_usd || 0;

      // 1. Check for intent irrelevance
      const matchedIntentWord = this.irrelevantIntentWords.find(w => new RegExp(`\\b${w}\\b`, 'i').test(queryLower));
      
      // 2. Check for unprofitable bleed (high spend, zero conversions)
      const isBleed = conversions === 0 && spend >= this.spendThresholdUsd;

      if (matchedIntentWord || isBleed) {
        wastedSpendUsd += spend;
        candidates.push({
          query: term.query,
          reason: matchedIntentWord ? `Irrelevant intent keyword: "${matchedIntentWord}"` : `High spend bleed ($${spend}) with 0 conversions`,
          match_type: matchedIntentWord ? 'BROAD' : 'EXACT',
          spend_saved_usd: spend
        });
      }
    }

    return {
      candidates_count: candidates.length,
      total_wasted_spend_usd: Math.round(wastedSpendUsd * 100) / 100,
      negative_keywords: candidates,
      recommended_action: candidates.length > 0 ? 'SYNC_TO_GOOGLE_ADS_NEGATIVE_LIST' : 'NONE'
    };
  }
}
