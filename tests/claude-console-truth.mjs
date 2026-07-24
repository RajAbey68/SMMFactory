#!/usr/bin/env node
// tests/claude-console-truth.mjs — Truth tests for the Claude Campaign OS console
// (Phase 1 of the Campaign OS design: second-brain/projects/smmfactory-campaign-os.md)
// Run: node tests/claude-console-truth.mjs
//
// Contract under test: dashboard/claude-console.html is the Claude-operator
// console — registry-driven, skill-routed, and free of Antigravity wiring.

import { readFileSync, existsSync } from 'fs';

const results = [];

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, detail: '✅', duration: Date.now() - start });
  } catch (err) {
    results.push({ name, passed: false, detail: `❌ ${err.message}`, duration: Date.now() - start });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const CONSOLE_PATH = 'dashboard/claude-console.html';

// The 11 marketing skills the console must route (Campaign OS design §5)
const MARKETING_SKILLS = [
  'Market Research', 'Brand Building', 'Social Media Marketing', 'Content Creation',
  'Copywriting', 'SEO', 'Google Ads', 'Email Marketing', 'Influencer Outreach',
  'PR', 'CRM Systems',
];
// House skills that ride alongside (installed in Cowork)
const HOUSE_SKILLS = ['ads-analysis', 'voice', 'coderabbit-runner', 'dataviz', 'notebooklm'];

// ─── EXISTENCE ───────────────────────────────────────────────────

await test('Claude console exists at dashboard/claude-console.html', async () => {
  assert(existsSync(CONSOLE_PATH), `${CONSOLE_PATH} missing`);
});

const src = existsSync(CONSOLE_PATH) ? readFileSync(CONSOLE_PATH, 'utf-8') : '';
const reg = JSON.parse(readFileSync('campaigns/registry.json', 'utf-8'));

// ─── REGISTRY CROSS-REFERENCES ──────────────────────────────────

await test('Console references every lifecycle phase id from the registry', async () => {
  for (const phase of reg.lifecycle.phases) {
    assert(src.includes(`"${phase.id}"`), `Lifecycle phase "${phase.id}" not in console`);
  }
});

await test('Console fallback data carries every registered campaign ref', async () => {
  for (const c of reg.campaigns) {
    assert(src.includes(c.ref), `Campaign ref "${c.ref}" (${c.slug}) not in console fallback`);
  }
});

await test('Console loads the live registry (campaigns/registry.json fetch)', async () => {
  assert(src.includes('campaigns/registry.json'), 'Console does not fetch the registry — fallback-only consoles drift');
});

// ─── SKILL ROUTING ──────────────────────────────────────────────

await test('All 11 marketing skills are routed in the console', async () => {
  for (const s of MARKETING_SKILLS) {
    assert(src.includes(s), `Marketing skill "${s}" missing from console`);
  }
});

await test('House skills (Cowork-installed) are referenced', async () => {
  for (const s of HOUSE_SKILLS) {
    assert(src.includes(s), `House skill "${s}" missing from console`);
  }
});

// ─── OPERATOR CONTRACT ──────────────────────────────────────────

await test('Console is Claude-operated — no Antigravity wiring', async () => {
  assert(!/antigravity/i.test(src), 'Console references Antigravity — operator is Claude/Cowork');
  assert(!/AG Prompt/i.test(src), 'Console carries the AG Prompt — replaced by the Claude Prompt Deck');
});

await test('Governance rail present: third-party review + Four-Eyes gates', async () => {
  assert(/third-party review/i.test(src), 'Sprint protocol missing third-party review gate');
  assert(/four-eyes/i.test(src), 'Sprint protocol missing Four-Eyes gate');
});

// ─── REPORT ─────────────────────────────────────────────────────

console.log('\n🧪 Claude Console Truth Tests\n');
for (const r of results) {
  console.log(`  ${r.detail.startsWith('✅') ? '✅' : '❌'} ${r.name}${r.passed ? '' : ` — ${r.detail.slice(2)}`}`);
}
const failed = results.filter((r) => !r.passed).length;
console.log(`\n  ${results.length - failed}/${results.length} passed\n`);
if (failed > 0) process.exit(1);
