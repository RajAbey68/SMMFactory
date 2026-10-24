#!/usr/bin/env node
// scripts/feedback-optimizer.mjs — Real-Time Performance Feedback & BuzzBar Telemetry Broadcaster
// Collects multi-channel metrics, runs budget optimization, and broadcasts alert telemetry to #marketing-kolake.

import fs from 'node:fs';
import path from 'node:path';
import { optimizeBudget } from '../tools/budget-optimizer.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    campaign: 'ko-lake-retreats',
    dryRun: true
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--campaign' && args[i + 1]) options.campaign = args[++i];
    else if (args[i] === '--live') options.dryRun = false;
  }
  return options;
}

export async function runOptimizationPass(options = {}) {
  const campaign = options.campaign || 'ko-lake-retreats';
  console.log(`[Feedback Optimizer] Running daily optimization pass for "${campaign}"...`);

  // Simulated live telemetry feed (Meta, Google, ChatGPT Ads)
  const currentMetrics = [
    { channel: 'meta', currentBudget: 40, ctr: 2.35, cpc: 0.42, roas: 3.8 },   // Winner -> scale
    { channel: 'google', currentBudget: 20, ctr: 0.72, cpc: 1.85, roas: 1.1 }, // Underperformer -> trim
    { channel: 'chatgpt', currentBudget: 15, ctr: 1.50, cpc: 0.90, roas: 2.4 } // Steady baseline -> maintain
  ];

  const optimization = optimizeBudget(currentMetrics);

  // Broadcast to BuzzBar service bus
  let buzzEvent = null;
  const busPath = path.resolve('.agent-bus.json');
  if (fs.existsSync(busPath)) {
    const busConfig = JSON.parse(fs.readFileSync(busPath, 'utf-8'));
    console.log(`[BuzzBar] 🐝 Broadcasting optimization telemetry to ${busConfig.channel}...`);
    buzzEvent = {
      channel: busConfig.channel,
      relay: busConfig.relay,
      event_type: 'BUDGET_OPTIMIZATION_RECOMMENDED',
      campaign,
      total_budget: optimization.totalBudget,
      recommendations: optimization.recommendations,
      timestamp: new Date().toISOString()
    };
  }

  const logPayload = {
    campaign,
    timestamp: new Date().toISOString(),
    metrics_evaluated: currentMetrics,
    optimization_result: optimization,
    buzz_event: buzzEvent
  };

  const outPath = path.resolve(`campaigns/${campaign}/optimization_report.json`);
  fs.writeFileSync(outPath, JSON.stringify(logPayload, null, 2), 'utf-8');
  console.log(`[Feedback Optimizer] ✅ Optimization report saved to ${outPath}`);

  return logPayload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs();
  runOptimizationPass(opts).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
