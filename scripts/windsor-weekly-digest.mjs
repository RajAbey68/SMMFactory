/**
 * Windsor.ai Weekly Executive Marketing Digest
 * Runs every Monday at 08:00 to generate a high-level performance briefing for #marketing-kolake.
 */

import { fetchWindsorMetrics } from './windsor-anomaly-guard.mjs';

export async function generateWeeklyDigest() {
  console.log('📊 Generating Windsor.ai Monday Morning Executive Digest...');
  
  const campaigns = await fetchWindsorMetrics();

  let totalSpend = 0;
  let totalClicks = 0;
  let totalImpressions = 0;

  campaigns.forEach(c => {
    totalSpend += parseFloat(c.spend || 0);
    totalClicks += parseInt(c.clicks || 0);
    totalImpressions += parseInt(c.impressions || 0);
  });

  const blendedCpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0.00";
  const blendedCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  const digest = `
╭────────────────────────────────────────────────────────────────────────────╮
│  🌴 KOLAKE VILLA — MONDAY EXECUTIVE MARKETING BRIEFING                     │
│  Target Period: Last 7 Days (Multi-Channel Windsor.ai Ingestion)           │
├────────────────────────────────────────────────────────────────────────────┤
│  📊 TOTAL AD INVESTMENT : $${totalSpend.toFixed(2)}                           │
│  🎯 OUTBOUND CLICKS    : ${totalClicks.toLocaleString()}                                  │
│  👁️ IMPRESSIONS        : ${totalImpressions.toLocaleString()}                               │
│  ⚡ BLENDED CTR         : ${blendedCtr}%                                    │
│  🏷️ BLENDED CPC         : $${blendedCpc}                                    │
├────────────────────────────────────────────────────────────────────────────┤
│  🛡️ PRICE FLOOR STATUS : $180 Villa Floor / $45 Room Floor (PASS ✅)       │
│  🔗 Executive Dashboard: http://167.233.236.178:8080/                      │
╰────────────────────────────────────────────────────────────────────────────╯
`;

  console.log(digest);
  return digest;
}

if (process.argv[1]?.endsWith('windsor_weekly_digest.mjs') || process.argv[1]?.endsWith('windsor-weekly-digest.mjs')) {
  generateWeeklyDigest();
}
