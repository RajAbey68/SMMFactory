#!/usr/bin/env node
// tests/truth-tests.mjs — Plain Node.js truth tests (no tsx/npm required)
// Fallback runner: node tests/truth-tests.mjs
// Primary runner:  npx tsx tests/truth-tests.ts

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

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

// ─── ENVIRONMENT INTEGRITY ───────────────────────────────────────

await test('package.json exists and is valid JSON', async () => {
  const raw = readFileSync('package.json', 'utf-8');
  const pkg = JSON.parse(raw);
  assert(pkg.name === 'smm-factory', `Expected name "smm-factory", got "${pkg.name}"`);
  assert(pkg.version, 'Missing version field');
});

await test('storage.config.json exists and declares cloud-hybrid', async () => {
  const raw = readFileSync('storage.config.json', 'utf-8');
  const cfg = JSON.parse(raw);
  assert(cfg.strategy === 'cloud-hybrid', `Expected strategy "cloud-hybrid", got "${cfg.strategy}"`);
  assert(cfg.tiers?.gcs?.bucket, 'Missing GCS bucket in tiers.gcs');
  assert(cfg.tiers?.gdrive?.sync_folder, 'Missing sync_folder in tiers.gdrive');
});

await test('mcp_config.json exists and declares GCS server', async () => {
  const raw = readFileSync('mcp_config.json', 'utf-8');
  const mcp = JSON.parse(raw);
  assert(mcp.mcpServers?.['google-cloud-storage'], 'Missing google-cloud-storage server');
  assert(mcp.mcpServers?.['google-drive'], 'Missing google-drive server');
  assert(mcp.mcpServers?.['spyder-agent'], 'Missing spyder-agent server');
});

await test('marketing-studio.agy blueprint exists', async () => {
  assert(existsSync('marketing-studio.agy'), 'Blueprint file missing');
  const content = readFileSync('marketing-studio.agy', 'utf-8');
  assert(content.includes('RECONNAISSANCE'), 'Blueprint missing STEP 1: RECONNAISSANCE');
  assert(content.includes('CREATIVE GENESIS'), 'Blueprint missing STEP 2: CREATIVE GENESIS');
  assert(content.includes('AGENTIC DEPLOYMENT'), 'Blueprint missing STEP 3: AGENTIC DEPLOYMENT');
  assert(content.includes('FOUR-EYES GATE'), 'Blueprint missing FOUR-EYES GATE');
});

// ─── DIRECTORY STRUCTURE ─────────────────────────────────────────

const requiredDirs = ['research', 'creative', 'landing-page', 'campaigns', 'dashboard'];
for (const dir of requiredDirs) {
  await test(`Directory exists: ${dir}/`, async () => {
    assert(existsSync(dir), `Required directory "${dir}" is missing`);
  });
}

// ─── CAMPAIGN REGISTRY ──────────────────────────────────────────

await test('Campaign registry exists and is valid JSON', async () => {
  const path = 'campaigns/registry.json';
  assert(existsSync(path), 'campaigns/registry.json missing');
  const raw = readFileSync(path, 'utf-8');
  const reg = JSON.parse(raw);
  assert(reg.version, 'Registry missing version field');
  assert(Array.isArray(reg.campaigns), 'Registry missing campaigns array');
  assert(reg.campaigns.length > 0, 'Registry has no campaigns');
  assert(reg.lifecycle?.phases, 'Registry missing lifecycle phases');
});

await test('Every campaign has required fields', async () => {
  const reg = JSON.parse(readFileSync('campaigns/registry.json', 'utf-8'));
  const required = ['slug', 'ref', 'name', 'type', 'status', 'current_phase', 'window', 'path'];
  for (const c of reg.campaigns) {
    for (const field of required) {
      assert(c[field] !== undefined, `Campaign "${c.slug || c.name || 'unknown'}" missing field: ${field}`);
    }
    assert(c.ref && c.ref.length <= 5, `Campaign "${c.slug}" ref "${c.ref}" must be ≤5 chars`);
  }
});

await test('Every registered campaign has a folder with required files', async () => {
  const reg = JSON.parse(readFileSync('campaigns/registry.json', 'utf-8'));
  for (const c of reg.campaigns) {
    const campaignDir = c.path.replace('./', '');
    assert(existsSync(campaignDir), `Campaign folder missing: ${campaignDir}`);
    assert(existsSync(join(campaignDir, 'Campaign_Summary.md')), `${c.slug}: Missing Campaign_Summary.md`);
    assert(existsSync(join(campaignDir, 'action_calendar.md')), `${c.slug}: Missing action_calendar.md`);
  }
});

await test('No duplicate campaign refs', async () => {
  const reg = JSON.parse(readFileSync('campaigns/registry.json', 'utf-8'));
  const refs = reg.campaigns.map(c => c.ref);
  const unique = new Set(refs);
  assert(refs.length === unique.size, `Duplicate refs found: ${refs.join(', ')}`);
});

await test('No duplicate campaign slugs', async () => {
  const reg = JSON.parse(readFileSync('campaigns/registry.json', 'utf-8'));
  const slugs = reg.campaigns.map(c => c.slug);
  const unique = new Set(slugs);
  assert(slugs.length === unique.size, `Duplicate slugs found: ${slugs.join(', ')}`);
});

await test('Campaign lifecycle has all 8 phases', async () => {
  const reg = JSON.parse(readFileSync('campaigns/registry.json', 'utf-8'));
  const expected = ['ideation', 'research', 'planning', 'creative', 'review', 'launch', 'optimize', 'close'];
  const actual = reg.lifecycle.phases.map(p => p.id);
  for (const phase of expected) {
    assert(actual.includes(phase), `Lifecycle missing phase: ${phase}`);
  }
});

// ─── AGENT WORKFLOWS ────────────────────────────────────────────

const requiredWorkflows = ['truth-test.md', 'verify.md', 'quality.md', 'status.md', 'ai-analyst.md'];
for (const wf of requiredWorkflows) {
  await test(`Workflow exists: .agent/workflows/${wf}`, async () => {
    const path = join('.agent', 'workflows', wf);
    assert(existsSync(path), `Workflow "${wf}" is missing`);
  });
}

// ─── AI INTELLIGENCE ANALYST ────────────────────────────────

await test('AI Intelligence Analyst script exists', async () => {
  assert(existsSync('scripts/ai-intelligence-analyst.mjs'), 'scripts/ai-intelligence-analyst.mjs missing');
  const content = readFileSync('scripts/ai-intelligence-analyst.mjs', 'utf-8');
  assert(content.includes('callAI'), 'Script missing AI provider integration (callAI)');
  assert(content.includes('proof_points') || content.includes('proof-based'), 'Script missing proof-based copy enforcement');
});

await test('Blueprint includes AI Intelligence Analyst step', async () => {
  const content = readFileSync('marketing-studio.agy', 'utf-8');
  assert(content.includes('AI INTELLIGENCE ANALYST'), 'Blueprint missing STEP 1.5: AI INTELLIGENCE ANALYST');
  assert(content.includes('ai-intelligence-analyst.mjs'), 'Blueprint missing analyst script reference');
});

await test('Blueprint includes OpenAI Ads deployment channel', async () => {
  const content = readFileSync('marketing-studio.agy', 'utf-8');
  assert(content.includes('OpenAI Ads'), 'Blueprint missing OpenAI Ads channel');
  assert(content.includes('chatgpt_ad_cards'), 'Blueprint missing ChatGPT Ad Cards reference');
});

// ─── QUALITY GATE ────────────────────────────────────────────────

await test('Quality gate script exists', async () => {
  assert(existsSync('scripts/quality-gate.sh'), 'scripts/quality-gate.sh missing');
});

await test('Pre-commit hook exists', async () => {
  assert(existsSync('.githooks/pre-commit'), '.githooks/pre-commit missing');
});

// ─── STORAGE TIER CONSISTENCY ────────────────────────────────────

await test('GCS bucket name matches between storage.config.json and mcp_config.json', async () => {
  const storage = JSON.parse(readFileSync('storage.config.json', 'utf-8'));
  const mcp = JSON.parse(readFileSync('mcp_config.json', 'utf-8'));
  const storageBucket = storage.tiers.gcs.bucket.replace('gs://', '');
  const mcpBucket = mcp.mcpServers['google-cloud-storage'].env.GCS_BUCKET_NAME;
  assert(storageBucket === mcpBucket,
    `Bucket mismatch: storage.config says "${storageBucket}" but mcp_config says "${mcpBucket}"`);
});

// ─── DASHBOARD ──────────────────────────────────────────────────

await test('Dashboard files exist', async () => {
  assert(existsSync('dashboard/index.html'), 'dashboard/index.html missing');
  assert(existsSync('dashboard/dashboard.css'), 'dashboard/dashboard.css missing');
  assert(existsSync('dashboard/dashboard.js'), 'dashboard/dashboard.js missing');
});

await test('Dashboard JS references registry.json path', async () => {
  const content = readFileSync('dashboard/dashboard.js', 'utf-8');
  assert(content.includes('registry.json'), 'Dashboard JS does not reference registry.json');
});

// ─── LANDING PAGE ────────────────────────────────────────────────

await test('Landing page index.html exists', async () => {
  assert(existsSync('landing-page/index.html'), 'landing-page/index.html missing');
  const content = readFileSync('landing-page/index.html', 'utf-8');
  assert(content.includes('id="booking"'), 'Landing page missing booking section');
  assert(content.includes('id="features"'), 'Landing page missing features section');
  assert(content.includes('utm_source'), 'Landing page missing UTM tracking');
});

await test('Landing page CSS exists', async () => {
  assert(existsSync('landing-page/index.css'), 'landing-page/index.css missing');
  const content = readFileSync('landing-page/index.css', 'utf-8');
  assert(content.includes('#1B5E20'), 'CSS missing brand primary color #1B5E20');
  assert(content.includes('#FFD600'), 'CSS missing brand accent color #FFD600');
});

// ─── REPORT ──────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('  TRUTH TEST RESULTS — SMMFactory');
console.log('═'.repeat(60));
for (const r of results) {
  const icon = r.passed ? '✅' : '❌';
  console.log(`  ${icon} ${r.name} (${r.duration}ms)`);
  if (!r.passed) console.log(`     → ${r.detail}`);
}
const passed = results.filter(r => r.passed);
const failed = results.filter(r => !r.passed);
console.log('─'.repeat(60));
console.log(`  Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
console.log(`  Pass Rate: ${Math.round((passed.length / results.length) * 100)}%`);
console.log('═'.repeat(60) + '\n');
if (failed.length > 0) process.exit(1);
