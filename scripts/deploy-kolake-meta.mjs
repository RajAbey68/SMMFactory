#!/usr/bin/env node

/**
 * deploy-kolake-meta.mjs
 * 
 * Standalone direct deployer for KoLake Reverse Auction Flash Ads to Meta Marketing API.
 * Reads token and ad account from environment (META_ACCESS_TOKEN, META_AD_ACCOUNT_ID).
 */

import fs from 'node:fs';
import path from 'node:path';

const API_VERSION = 'v19.0';
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`;

// 1. Environment / Vault Guard
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN;
let AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || process.env.FB_AD_ACCOUNT_ID;

if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
  console.error('\n❌ ERROR: Missing Meta Credentials.');
  console.error('Please export the following before running:');
  console.error('  export META_ACCESS_TOKEN="EAAB..."');
  console.error('  export META_AD_ACCOUNT_ID="act_123456789"\n');
  process.exit(1);
}

if (!AD_ACCOUNT_ID.startsWith('act_')) {
  AD_ACCOUNT_ID = `act_${AD_ACCOUNT_ID}`;
}

// 2. Load Ground-Truth Payload
const payloadPath = path.resolve('campaigns/ko-lake-reverse-auction/n8n_deploy_payload.json');
if (!fs.existsSync(payloadPath)) {
  console.error(`❌ Payload not found at ${payloadPath}`);
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

async function metaFetch(endpoint, body = {}) {
  const url = `${GRAPH_URL}/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify(body)
  });

  const resData = await response.json();
  if (!response.ok || resData.error) {
    throw new Error(`Meta API Error [${endpoint}]: ` + JSON.stringify(resData.error || resData, null, 2));
  }
  return resData;
}

async function deployCampaign() {
  console.log(`\n🚀 Starting Direct Meta Ads Deployment for KoLake Villa...`);
  console.log(`🎯 Target Ad Account: ${AD_ACCOUNT_ID}`);

  // Step 1: Create Campaign
  console.log(`\n[1/3] Creating Campaign: KLAuc - Reverse Auction Flash Engine...`);
  const campaignRes = await metaFetch(`${AD_ACCOUNT_ID}/campaigns`, {
    name: 'KLAuc - KoLake Reverse Auction Flash Engine',
    objective: 'OUTCOME_LEADS',
    status: 'PAUSED', // Safety paused until ad sets and creatives attach
    special_ad_categories: ['NONE']
  });
  const campaignId = campaignRes.id;
  console.log(`  ✅ Campaign Created! ID: ${campaignId}`);

  // Step 2: Create Ad Sets
  console.log(`\n[2/3] Creating Qualified Ad Sets (Colombo, South Coast, India HNW)...`);
  const adSets = payload.meta_ads.ad_sets;
  const createdAdSets = [];

  for (const adSet of adSets) {
    console.log(`  Creating Ad Set: ${adSet.name}...`);
    
    // Targeting setup based on filters
    const targeting = {
      geo_locations: {
        cities: adSet.geo.cities.map(c => ({ name: c }))
      },
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed', 'story'],
      instagram_positions: ['stream', 'story', 'reels']
    };

    if (adSet.devices?.includes('iOS')) {
      targeting.user_os = ['iOS'];
    }

    if (adSet.language) {
      targeting.locales = [6]; // English
    }

    if (adSet.behaviors) {
      // Returned from traveling abroad / Frequent travelers
      targeting.behaviors = [{ id: '6003133212331', name: 'Returned from traveling abroad' }];
    }

    const adSetRes = await metaFetch(`${AD_ACCOUNT_ID}/adsets`, {
      name: adSet.name,
      campaign_id: campaignId,
      daily_budget: Math.round((payload.meta_ads.daily_budget_usd / adSets.length) * 100), // In cents
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LEAD_GENERATION',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting: targeting,
      status: 'ACTIVE'
    });

    console.log(`    ✅ Ad Set Created! ID: ${adSetRes.id}`);
    createdAdSets.push({ id: adSetRes.id, config: adSet });
  }

  // Step 3: Unpause Campaign
  console.log(`\n[3/3] Activating Campaign...`);
  await metaFetch(campaignId, { status: 'ACTIVE' });
  console.log(`  ✅ Campaign is now LIVE on Meta Ads Manager!`);

  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`  🎉 DEPLOYMENT SUCCESSFUL`);
  console.log(`  Campaign ID : ${campaignId}`);
  console.log(`  Ad Sets     : ${createdAdSets.length} Active`);
  console.log(`  Target URL  : https://wa.me/94711730345`);
  console.log(`════════════════════════════════════════════════════════════\n`);
}

deployCampaign().catch(err => {
  console.error('\n❌ DEPLOYMENT FAILED:', err.message);
  process.exit(1);
});
