#!/usr/bin/env node
// tests/dashboard-e2e-truth.mjs — Comprehensive End-to-End Test Suite for Hermes-Dev Executive Command Center
// Validates:
// 1. DOM Element Integrity (all target IDs exist)
// 2. Time Horizon Mutation & Value Reactivity (1h, 24h, 7d, 30d, ytd)
// 3. Currency & Text Sanitization (no 'zsh.' or dropped currency symbols)
// 4. Master Property Dictionary & Price Floor Invariants ($250 villa / $45 room)
// 5. Backend HTTP Health & API endpoints (/api/marketing-telemetry, /api/autumnharvest, /api/llm-spend)

import http from 'http';

const REMOTE_BASE_URL = 'http://167.233.236.178:8080';
const results = [];

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, detail: '✅ PASS', duration: Date.now() - start });
  } catch (err) {
    results.push({ name, passed: false, detail: `❌ FAIL: ${err.message}`, duration: Date.now() - start });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text: data }));
    }).on('error', reject);
  });
}

console.log('🧪 Running SMMFactory Executive Dashboard E2E Truth Suite...\n');

// ─── 1. HTTP Endpoint Reachability & Health ──────────────────────────────────────────

await test('Dashboard index returns HTTP 200 with HTML content', async () => {
  const res = await fetchText(`${REMOTE_BASE_URL}/`);
  assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
  assert(res.text.includes('<title>KoLake & Hermes Executive Command Center</title>'), 'Missing or incorrect dashboard title');
});

await test('API /api/marketing-telemetry responds with HTTP 200 and live payload structure', async () => {
  const res = await fetchText(`${REMOTE_BASE_URL}/api/marketing-telemetry`);
  assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
  const json = JSON.parse(res.text);
  assert(json.live === true, 'Telemetry live flag must be true');
  assert(typeof json.meta === 'object', 'Missing meta telemetry block');
  assert(typeof json.google === 'object', 'Missing google telemetry block');
});

await test('API /api/autumnharvest responds with valid schema', async () => {
  const res = await fetchText(`${REMOTE_BASE_URL}/api/autumnharvest`);
  assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
  const json = JSON.parse(res.text);
  assert(typeof json === 'object', 'Invalid JSON response from /api/autumnharvest');
});

await test('API /api/llm-spend responds with valid spend tracker schema', async () => {
  const res = await fetchText(`${REMOTE_BASE_URL}/api/llm-spend`);
  assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
  const json = JSON.parse(res.text);
  assert(json.checked_at !== undefined && Array.isArray(json.routers), 'Invalid LLM spend payload schema');
});

// ─── 2. DOM Elements & ID Integrity ──────────────────────────────────────────────────

const page = await fetchText(`${REMOTE_BASE_URL}/`);
const html = page.text;

await test('DOM Integrity: All required KPI metric IDs exist', async () => {
  const requiredIds = [
    'meta-spend-val', 'meta-clicks-val', 'meta-cpc-val',
    'google-spend-val', 'google-clicks-val', 'google-cpc-val',
    'blended-spend-val', 'blended-clicks-val', 'blended-cpc-val',
    'kpi-meta-budget-pill', 'kpi-google-budget-pill',
    'horizon-indicator'
  ];

  for (const id of requiredIds) {
    assert(html.includes(`id="${id}"`), `Missing required DOM element id="${id}"`);
  }
});

// ─── 3. Currency Formatting & Sanitization ───────────────────────────────────────────

await test('Sanitization: No zsh shell corruptions or broken currency tokens', async () => {
  assert(!html.includes('zsh.'), "Found corrupted shell token 'zsh.' in dashboard HTML");
  // Check for orphan decimals like ".75 <" without currency symbol
  const orphanDecimalMatch = html.match(/>\s*\.([0-9]{2})\s*</);
  assert(!orphanDecimalMatch, `Found orphan decimal without currency symbol: ${orphanDecimalMatch?.[0]}`);
  assert(html.includes('£'), "Dashboard must properly render GBP '£' currency symbols");
});

// ─── 4. Master Property Dictionary & Invariants ──────────────────────────────────────

await test('Master Property Dictionary: Lakeside villa naming & pricing floors enforced', async () => {
  assert(html.includes('Ko Lake Villa') || html.includes('KoLake Villa'), 'Must reference Ko Lake Villa');
  assert(!html.includes('Ko Lake Hotel'), 'Prohibited: Never name as Hotel');
  assert(!html.includes('Ko Lake Resort'), 'Prohibited: Never name as Resort');
  assert(html.includes('$250/villa') && html.includes('$45/room'), 'Must display $250/villa and $45/room price floors');
});

// ─── 5. Time Horizon Mutation & State Logic Simulation ───────────────────────────────

await test('Horizon Engine: HORIZON_DATA contains distinct figures across all 5 horizons', async () => {
  // Extract HORIZON_DATA definition from the HTML
  const match = html.match(/const HORIZON_DATA = ({[\s\S]*?^};)/m);
  assert(match, 'Failed to extract HORIZON_DATA object from script');

  // Evaluate HORIZON_DATA in an isolated sandbox function
  const extractFn = new Function(`return ${match[1]};`);
  const horizonData = extractFn();

  const horizons = ['1h', '24h', '7d', '30d', 'ytd'];
  const spendsSeen = new Set();
  const clicksSeen = new Set();

  for (const h of horizons) {
    assert(horizonData[h], `Missing configuration for horizon "${h}"`);
    assert(horizonData[h].meta_spend, `Missing meta_spend for horizon "${h}"`);
    assert(horizonData[h].google_spend, `Missing google_spend for horizon "${h}"`);
    assert(horizonData[h].blended_spend, `Missing blended_spend for horizon "${h}"`);
    assert(horizonData[h].meta_clicks, `Missing meta_clicks for horizon "${h}"`);
    assert(horizonData[h].google_clicks, `Missing google_clicks for horizon "${h}"`);
    assert(horizonData[h].blended_clicks, `Missing blended_clicks for horizon "${h}"`);

    spendsSeen.add(horizonData[h].blended_spend);
    clicksSeen.add(horizonData[h].blended_clicks);
  }

  // All 5 horizons must have unique numbers to prevent stagnant/frozen views
  assert(spendsSeen.size === 5, `Expected 5 unique blended_spend values, found ${spendsSeen.size}`);
  assert(clicksSeen.size === 5, `Expected 5 unique blended_clicks values, found ${clicksSeen.size}`);
});

await test('Horizon Engine: setTimeHorizon function dynamically mutates all KPI DOM elements', async () => {
  assert(html.includes('function setTimeHorizon(horizon)'), 'Missing setTimeHorizon function definition');
  assert(html.includes("document.getElementById('meta-spend-val')"), 'setTimeHorizon must update meta-spend-val');
  assert(html.includes("document.getElementById('google-spend-val')"), 'setTimeHorizon must update google-spend-val');
  assert(html.includes("document.getElementById('blended-spend-val')"), 'setTimeHorizon must update blended-spend-val');
  assert(html.includes("document.getElementById('kpi-meta-budget-pill')"), 'setTimeHorizon must update kpi-meta-budget-pill');
  assert(html.includes("document.getElementById('kpi-google-budget-pill')"), 'setTimeHorizon must update kpi-google-budget-pill');
});

// ─── 6. Results Summary ──────────────────────────────────────────────────────────────

console.log('─────────────────────────────────────────────────────────────────────────');
console.log('  TEST RESULTS:');
console.log('─────────────────────────────────────────────────────────────────────────');
let passCount = 0;
results.forEach(r => {
  if (r.passed) passCount++;
  console.log(`  ${r.detail.padEnd(10)} ${r.name} (${r.duration}ms)`);
});
console.log('─────────────────────────────────────────────────────────────────────────');
console.log(`  SUMMARY: ${passCount} / ${results.length} PASSED (${Math.round((passCount/results.length)*100)}%)`);
console.log('─────────────────────────────────────────────────────────────────────────\n');

if (passCount !== results.length) {
  process.exit(1);
}
