/**
 * kolake-analytics-bot.test.mjs
 * 
 * Unit and integration tests for KoLake Villa Analytics Buzz Bot.
 */

import assert from 'node:assert/strict';
import { renderExecutivePulse, renderFunnelFlow, renderCampaignLeaderboard } from '../scripts/kolake-analytics-bot.mjs';

const mockData = {
  meta: {
    spend_usd: 128.50,
    impressions: 24890,
    reach: 18420,
    clicks: 942,
    ctr_pct: 3.78,
    cpc_usd: 0.14,
    cpm_usd: 5.16,
    campaigns: [
      { name: 'KLAuc - Reverse Auction Flash Engine', spend: 72.30, clicks: 580, ctr: 4.21, leads: 9, cpl: 8.03 },
      { name: 'KoLake - South Coast Weekend Escapes', spend: 36.20, clicks: 232, ctr: 3.40, leads: 3, cpl: 12.07 }
    ],
    top_creatives: [
      { name: 'Sunset Infinity Pool Reel (v3)', format: 'Reel 9:16', ctr: 4.85, cpc: 0.11, status: 'TOP_PERFORMER' }
    ]
  },
  ga4: {
    total_users: 864,
    new_users: 792,
    sessions: 1045,
    engaged_sessions: 712,
    engagement_rate_pct: 68.13,
    avg_session_duration_sec: 114,
    bounce_rate_pct: 31.87,
    top_traffic_sources: [
      { source: 'meta / paid-social', sessions: 680, engaged: 490, bounce_pct: 27.9 }
    ],
    conversions: {
      whatsapp_cta_clicks: 14,
      inquiry_form_submits: 3,
      reverse_auction_locks: 5,
      total_high_intent_leads: 22
    },
    hourly_distribution: [12, 8, 4, 2, 5, 14, 38, 72, 88, 110, 95, 82, 94, 102, 115, 98, 70, 48, 32, 20, 18, 14, 12, 9]
  },
  blended: {
    landing_page_passthrough_pct: 91.7,
    cost_per_engaged_visitor_usd: 0.18,
    cost_per_lead_usd: 5.84,
    estimated_pipeline_value_usd: 3960.00,
    estimated_roas: 30.8
  }
};

console.log('🧪 Running KoLake Analytics Bot Tests...');

// Test 1: Executive Pulse Card Rendering
{
  const pulseOutput = renderExecutivePulse(mockData);
  assert.ok(pulseOutput.includes('#marketing-kolake'), 'Must include channel name #marketing-kolake');
  assert.ok(pulseOutput.includes('KoLakeVilla.com'), 'Must include domain KoLakeVilla.com');
  assert.ok(pulseOutput.includes('$128.50'), 'Must include correct spend');
  assert.ok(pulseOutput.includes('$180/villa'), 'Must assert $180 villa price floor governance');
  console.log('  ✅ Test 1: Executive Pulse Card renders correctly');
}

// Test 2: Attribution Funnel Flow Rendering
{
  const funnelOutput = renderFunnelFlow(mockData);
  assert.ok(funnelOutput.includes('META AD IMPRESSIONS'), 'Must include Meta Ad Impressions');
  assert.ok(funnelOutput.includes('GA4 VILLA SITE SESSIONS'), 'Must include GA4 site sessions');
  assert.ok(funnelOutput.includes('WHATSAPP & DIRECT LEADS'), 'Must include conversions');
  console.log('  ✅ Test 2: Funnel Flow renders correctly');
}

// Test 3: Campaign Leaderboard
{
  const leaderboardOutput = renderCampaignLeaderboard(mockData);
  assert.ok(leaderboardOutput.includes('KLAuc - Reverse Auction Flash Engine'), 'Must include KLAuc');
  assert.ok(leaderboardOutput.includes('Sunset Infinity Pool Reel (v3)'), 'Must include top creative');
  console.log('  ✅ Test 3: Campaign Leaderboard renders correctly');
}

console.log('🎉 All KoLake Analytics Bot tests passed successfully!\n');
