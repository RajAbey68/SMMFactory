#!/usr/bin/env node
/**
 * scripts/forager-runner.mjs — Single orchestrator: ingest → triage → grounded draft.
 * R3 FIX #1: grounding now runs IN the execution path, not out-of-band.
 *
 *   Ingest (n8n) ─► POST /generate-and-verify ─► Node runs prompt + assertGroundedOutput
 *                              │
 *                              ├── grounded → vetted draft returned (queued to operator)
 *                              └── ungrounded → confidence dropped / FAIL EARLY, never queued
 *
 * stdin (JSON array of posts) or --file <path>. Emits vetted leads to stdout.
 * Usage: node scripts/forager-runner.mjs --file posts.json
 *        echo '[...]' | node scripts/forager-runner.mjs
 */
import fs from 'node:fs';
import { scoreSignal } from '../tools/vilaforager-watcher.mjs';
import { draftReply, assertGroundedOutput } from '../tools/vilaforager-drafter.mjs';
import { applyTransition, readJson, writeJson } from '../tools/lead-lifecycle.mjs';

function readInput(argv) {
  if (argv.includes('--file')) {
    const i = argv.indexOf('--file');
    return JSON.parse(fs.readFileSync(argv[i + 1], 'utf-8'));
  }
  return JSON.parse(fs.readFileSync(0, 'utf-8'));
}

export function runBatch(posts = [], config = {}) {
  const results = [];
  for (const raw of posts) {
    // Normalize ingest: title + content → text (the field scoreSignal scores on).
    const signal = {
      ...raw,
      text: raw.text || [raw.title, raw.content].filter(Boolean).join(' '),
      source: raw.source || raw.subreddit || 'ingest',
      channel: raw.channel || raw.source || 'ingest',
    };
    const lead = scoreSignal(signal, config);
    if (!lead.is_qualified) continue; // triage dropped it — no draft, no queue
    try {
      const draft = draftReply(lead, config);
      // Gate runs HERE, in the execution path, before anything is queued.
      assertGroundedOutput(draft.text, config.floors);
      results.push({
        lead_id: lead.lead_id,
        source_url: lead.source_url,
        author: lead.author,
        channel: lead.channel,
        qualification_score: lead.qualification_score,
        laya_score: lead.impact_score,
        matched_criteria: lead.matched_criteria,
        draft_text: draft.text,
        cta: draft.cta,
        approved: false,
        gate: 'PASSED',
      });
    } catch (e) {
      // R3 FIX #1: ungrounded claim FAILS EARLY — never queued, never dispatched.
      results.push({
        lead_id: lead.lead_id,
        source_url: lead.source_url,
        gate: 'FAILED',
        gate_reason: e.message,
        draft_text: null,
      });
    }
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const posts = readInput(process.argv.slice(2));
  const states = readJson('campaigns/lead_states.json', {});
  const out = runBatch(posts, { floors: { buyout_from: 250, same_day_villa: 180, room_from: 45 } });
  // Mark every vetted lead as 'reviewing' in the state machine (audit-trail shape).
  let s = states;
  for (const r of out) {
    if (r.gate === 'PASSED') s = applyTransition(s, { lead_id: r.lead_id, to: 'reviewing', actor: 'forager-runner' });
  }
  writeJson('campaigns/lead_states.json', s);
  process.stdout.write(JSON.stringify({ generated_at: new Date().toISOString(), count: out.length, results: out, states: s }, null, 2));
}