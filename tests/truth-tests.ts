// tests/truth-tests.ts — Truth tests for SMMFactory Marketing Studio
// Run: npx tsx tests/truth-tests.ts

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
    name: string;
    passed: boolean;
    detail: string;
    duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
    const start = Date.now();
    try {
        await fn();
        results.push({ name, passed: true, detail: '✅', duration: Date.now() - start });
    } catch (err: any) {
        results.push({ name, passed: false, detail: `❌ ${err.message}`, duration: Date.now() - start });
    }
}

function assert(condition: boolean, message: string) {
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

const requiredDirs = ['research', 'creative', 'landing-page', 'campaigns'];
for (const dir of requiredDirs) {
    await test(`Directory exists: ${dir}/`, async () => {
        assert(existsSync(dir), `Required directory "${dir}" is missing`);
    });
}

// ─── AGENT WORKFLOWS ────────────────────────────────────────────

const requiredWorkflows = ['truth-test.md', 'verify.md', 'quality.md', 'status.md'];
for (const wf of requiredWorkflows) {
    await test(`Workflow exists: .agent/workflows/${wf}`, async () => {
        const path = join('.agent', 'workflows', wf);
        assert(existsSync(path), `Workflow "${wf}" is missing`);
    });
}

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
