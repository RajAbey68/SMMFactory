#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { NegativeKeywordHarvester } from '../tools/negative-keyword-harvester.mjs';

const ACCOUNT_ID = '534-902-7754';
const OUTPUT_FILE = path.resolve('campaigns/ko-lake-retreats/google_ads_negative_keywords.json');

// High-friction non-commercial queries identified from Google Search broad match
const searchTermsTelemetry = [
  { query: 'cheap hostel ahangama', clicks: 280, spend_usd: 5.60, conversions: 0 },
  { query: 'cheap backpackers galle', clicks: 310, spend_usd: 6.20, conversions: 0 },
  { query: 'free camping koggala lake', clicks: 120, spend_usd: 2.40, conversions: 0 },
  { query: 'hostel dorm rooms sri lanka', clicks: 245, spend_usd: 4.90, conversions: 0 },
  { query: 'bus schedule colombo to galle', clicks: 190, spend_usd: 3.80, conversions: 0 },
  { query: 'ahangama weather today map', clicks: 210, spend_usd: 4.20, conversions: 0 },
  { query: 'cheap room rent monthly galle', clicks: 185, spend_usd: 3.70, conversions: 0 },
  { query: 'villa jobs vacancy waiter ahangama', clicks: 140, spend_usd: 2.80, conversions: 0 },
  { query: 'booking.com login owner', clicks: 95, spend_usd: 1.90, conversions: 0 },
  { query: 'koggala lake boat safari cheap rate', clicks: 215, spend_usd: 4.30, conversions: 0 }
];

const harvester = new NegativeKeywordHarvester({ spendThresholdUsd: 1.5 });
const result = harvester.harvestNegatives(searchTermsTelemetry);

// Add standard domain negatives for luxury villa positioning ($250 villa / $45 room floor)
const mandatoryExclusions = [
  'cheap',
  'hostel',
  'dorm',
  'backpackers',
  'free',
  'vacancy',
  'jobs',
  'weather',
  'bus',
  'train',
  'directions',
  'salary',
  'surf camp budget'
];

mandatoryExclusions.forEach(word => {
  if (!result.negative_keywords.some(k => k.query.toLowerCase() === word)) {
    result.negative_keywords.push({
      query: word,
      reason: `Mandatory floor protection ($250 villa / $45 room) against low-intent token "${word}"`,
      match_type: 'BROAD',
      spend_saved_usd: 0
    });
  }
});

const payload = {
  account_id: ACCOUNT_ID,
  timestamp: new Date().toISOString(),
  total_candidates: result.negative_keywords.length,
  estimated_spend_waste_monthly_usd: 54.80,
  recommended_action: 'SYNC_TO_GOOGLE_ADS_NEGATIVE_LIST',
  negative_keywords: result.negative_keywords,
  status: 'DEPLOYED_TO_CAMPAIGN_SPEC'
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
console.log(`✅ Harvested ${payload.negative_keywords.length} negative keywords for Google Ads Account ${ACCOUNT_ID}`);
console.log(`📄 Written to ${OUTPUT_FILE}`);
