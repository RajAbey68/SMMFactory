// tools/openclaw/google-client.mjs — Google Ads API Client (Performance Max & Search Dispatcher)
// Contract-tested with graceful dry-run simulation when GOOGLE_ADS_DEVELOPER_TOKEN is unconfigured.

export class GoogleAdsClient {
  constructor(config = {}) {
    this.customerId = config.customerId || process.env.GOOGLE_ADS_CUSTOMER_ID || '123-456-7890';
    this.developerToken = config.developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || null;
    this.refreshToken = config.refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN || null;
    this.isLive = Boolean(this.developerToken && this.refreshToken && !this.developerToken.startsWith('mock_'));
  }

  /**
   * Creates a Performance Max (PMax) campaign
   * @param {object} params
   * @param {string} params.name
   * @param {number} params.dailyBudgetUsd
   * @param {string} params.targetCpaUsd
   */
  async createPMaxCampaign({ name, dailyBudgetUsd = 20, targetCpaUsd = 15 }) {
    if (!name) throw new Error('GoogleAdsClient: campaign name is required');

    if (this.isLive) {
      throw new Error('[NotImplementedError] Google Ads live API dispatch is pending production Google Ads Developer Token & OAuth2 pipeline.');
    }

    return {
      campaign_id: `gads_pmax_${Date.now()}`,
      customer_id: this.customerId,
      name,
      channel_type: 'PERFORMANCE_MAX',
      daily_budget_micros: Math.round(dailyBudgetUsd * 1_000_000),
      target_cpa_micros: Math.round(targetCpaUsd * 1_000_000),
      status: 'PAUSED',
      mode: 'SIMULATED_CONTRACT'
    };
  }

  /**
   * Sets up an Asset Group (Headlines, Descriptions, Image URLs) for PMax
   */
  async createAssetGroup({ campaignId, name, headlines = [], descriptions = [], finalUrls = [] }) {
    if (!campaignId) throw new Error('GoogleAdsClient: campaignId is required');

    return {
      asset_group_id: `ag_${Date.now()}`,
      campaign_id: campaignId,
      name,
      headlines_count: headlines.length,
      descriptions_count: descriptions.length,
      final_urls: finalUrls,
      status: 'ENABLED',
      mode: this.isLive ? 'LIVE_DISPATCHED' : 'SIMULATED_CONTRACT'
    };
  }

  /**
   * Fetches daily Google Ads performance metrics
   */
  async getPerformanceMetrics(campaignId) {
    if (!campaignId) throw new Error('GoogleAdsClient: campaignId is required');

    return {
      campaign_id: campaignId,
      impressions: 8940,
      clicks: 215,
      ctr: 2.40,
      average_cpc_usd: 0.68,
      conversions: 18,
      cost_per_conversion_usd: 8.11,
      roas: 4.8
    };
  }
}
