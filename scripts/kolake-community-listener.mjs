// scripts/kolake-community-listener.mjs — Orchestrator: web search → score → forager-runner → email digest.
// Runs 3-hourly on Hermes-Dev via PM2. Extends forager-runner pipeline.

import { runWebSearchIngest } from '../tools/web-search-ingest.mjs';
import { runBatch } from '../scripts/forager-runner.mjs';
import { sendDigestEmail, logDigest } from '../tools/email-digest.mjs';
import { readJson, writeJson } from '../tools/lead-lifecycle.mjs';

const DEDUPE_STORE = 'campaigns/discovered_leads.json';
const STATE_STORE = 'campaigns/lead_states.json';

async function main() {
  const runStart = new Date().toISOString();
  console.log(`[kolake-community-listener] Starting run at ${runStart}`);

  // 1. Ingest from web search + Reddit + X
  const ingestResult = await runWebSearchIngest();
  console.log(`[kolake-community-listener] Ingested ${ingestResult.signals.length} signals from ${ingestResult.stats.sources_checked.length} sources`);

  // 2. Load dedupe store
  let discovered = [];
  try {
    discovered = readJson(DEDUPE_STORE, []);
  } catch {
    discovered = [];
  }

  // 3. Filter new signals (dedupe against stored)
  const { dedupKey, isDuplicate, appendLead } = await import('../tools/vilaforager-watcher.mjs');
  const newSignals = [];
  for (const sig of ingestResult.signals) {
    // Normalize signal for vilaforager dedupe (expects text/text_snippet + source_url)
    const normalized = {
      ...sig,
      text: sig.content || sig.title || '',
      text_snippet: sig.content || sig.title || '',
      source_url: sig.url || sig.source_url || '',
    };
    if (!isDuplicate(normalized, discovered)) {
      newSignals.push(sig);
    }
  }
  console.log(`[kolake-community-listener] ${newSignals.length} new signals after dedupe`);

  // 4. Run through forager-runner (score → draft → grounding gate)
  const vettedResults = runBatch(newSignals, {
    floors: { buyout_from: 250, same_day_villa: 180, room_from: 45 },
  });

  // 5. Store new leads in dedupe store
  for (const sig of newSignals) {
    const lead = {
      lead_id: `vfor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      source: sig.platform,
      channel: sig.subreddit || sig.channel || 'web',
      author: sig.author,
      text_snippet: sig.content?.slice(0, 140) || sig.title?.slice(0, 140) || '',
      source_url: sig.url || '',
      target_venture: 'ko-lake-retreats',
    };
    appendLead(lead);
  }

  // 6. Update lead states
  const states = readJson(STATE_STORE, {});
  let newStates = states;
  for (const r of vettedResults) {
    if (r.gate === 'PASSED') {
      newStates = applyTransition(newStates, { lead_id: r.lead_id, to: 'reviewing', actor: 'community-listener' });
    }
  }
  writeJson(STATE_STORE, newStates);

  // 7. Send email digest
  const digestData = {
    signals: newSignals,
    vettedResults,
    stats: ingestResult.stats,
  };

  try {
    await sendDigestEmail(digestData);
    await logDigest(digestData);
    console.log(`[kolake-community-listener] Digest sent successfully`);
  } catch (e) {
    console.error(`[kolake-community-listener] Email failed:`, e.message);
  }

  // 8. Summary
  const passed = vettedResults.filter(r => r.gate === 'PASSED').length;
  const failed = vettedResults.filter(r => r.gate === 'FAILED').length;
  console.log(`[kolake-community-listener] Complete: ${passed} passed, ${failed} failed, ${newSignals.length} new signals`);

  return {
    run_at: runStart,
    signals_ingested: ingestResult.signals.length,
    signals_new: newSignals.length,
    vetted_passed: passed,
    vetted_failed: failed,
    digest_sent: true,
  };
}

// applyTransition import
import { applyTransition } from '../tools/lead-lifecycle.mjs';

// Run if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(e => {
      console.error('[kolake-community-listener] Fatal:', e);
      process.exit(1);
    });
}