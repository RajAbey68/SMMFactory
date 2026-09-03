#!/usr/bin/env node
// scripts/close-campaign.mjs — BMAD Phase 8 Final Close Orchestrator
// Usage: node scripts/close-campaign.mjs <campaign-slug>

import fs from 'node:fs';
import path from 'node:path';
import { RetrospectiveEngine } from '../tools/retrospective-engine.mjs';
import { LinearSyncManager } from '../tools/linear-sync.mjs';

const campaignSlug = process.argv[2] || 'sky-high-villas';

console.log(`[Release Orchestrator] 🏁 Initiating Phase 8 Close for: "${campaignSlug}"...`);

const engine = new RetrospectiveEngine();
const linearSync = new LinearSyncManager();

// 1. Generate retrospective.md & final_report.md
const result = engine.generateRetrospective(campaignSlug, {
  total_spend_usd: 1400,
  total_revenue_usd: 7700,
  total_bookings: 11,
  winning_angles: ["Heli-tour cliffside landing experience", "Luxury private buyout VIP concierge"],
  fatigued_angles: ["Generic aerial photography"]
});

console.log(`[Release Orchestrator] ✅ Generated retrospective.md & final_report.md (Blended ROAS: ${result.performance_summary.blended_roas}x)`);

// 2. Sync to Linear (Phase 8: Close)
const syncRes = await linearSync.syncPhaseCompletion({
  campaignSlug,
  phaseId: 'close',
  status: 'COMPLETED',
  summary: `Formally closed campaign ${campaignSlug}. Blended ROAS: ${result.performance_summary.blended_roas}x on $${result.performance_summary.total_spend_usd} spend. Retrospective & final report archived.`,
  artifacts: [
    `campaigns/${campaignSlug}/retrospective.md`,
    `campaigns/${campaignSlug}/final_report.md`
  ]
});

console.log(`[Linear] 📐 Synced Phase 8 completion: ${syncRes.phase} (${syncRes.mode})`);

// 3. Update campaigns/registry.json status
const registryPath = path.resolve('campaigns/registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
const camp = registry.campaigns.find(c => c.slug === campaignSlug);
if (camp) {
  camp.current_phase = 'close';
  camp.phase_progress = camp.phase_progress || {};
  camp.phase_progress.close = `✅ complete — retrospective.md + final_report.md generated (ROAS: ${result.performance_summary.blended_roas}x)`;
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  console.log(`[Release Orchestrator] 📋 Updated campaigns/registry.json: current_phase -> close`);
}

console.log(`[Release Orchestrator] 🎉 Campaign "${campaignSlug}" successfully graduated and closed.`);
