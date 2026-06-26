#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   AI Intelligence Analyst — OpenAI-powered competitive intel
   ═══════════════════════════════════════════════════════════
   Uses your OpenAI API key to transform raw AdSpyder/manual
   scan data into strategic intelligence AND generate
   proof-based ad copy for OpenAI Ads (ChatGPT placements).

   OpenAI Ads requires: 2+ verifiable proof points, 0 superlatives.

   Usage:
     OPENAI_API_KEY=sk-xxx node scripts/ai-intelligence-analyst.mjs
     # Or with env already set:
     node scripts/ai-intelligence-analyst.mjs

   Input:
     - research/market_dna.json
     - research/competitor_intel/latest_scan.json (or any .json scan)

   Output:
     - research/ai_analysis.json
   ═══════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import https from 'https';

// ── Config ──────────────────────────────────────────────────
const MAX_TOKENS = 4096;

// Provider auto-detection: AI_PROVIDER env > whichever key is set
const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase() ||
  (process.env.ANTHROPIC_API_KEY ? 'anthropic' :
   process.env.GEMINI_API_KEY ? 'gemini' : 'openai');

const PROVIDERS = {
  openai:    { key: process.env.OPENAI_API_KEY,    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',       name: 'OpenAI',          keyEnv: 'OPENAI_API_KEY' },
  anthropic: { key: process.env.ANTHROPIC_API_KEY,  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514', name: 'Anthropic Claude', keyEnv: 'ANTHROPIC_API_KEY' },
  gemini:    { key: process.env.GEMINI_API_KEY,     model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',   name: 'Google Gemini',   keyEnv: 'GEMINI_API_KEY' },
};
const P = PROVIDERS[AI_PROVIDER] || PROVIDERS.openai;

// ── File paths ──────────────────────────────────────────────
const MARKET_DNA_PATH = 'research/market_dna.json';
const COMPETITOR_INTEL_DIR = 'research/competitor_intel';
const SEO_INTEL_PATH = 'research/seo_intel.json';
const OUTPUT_PATH = 'research/ai_analysis.json';

// ── Colors for terminal output ──────────────────────────────
const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function log(icon, msg) { console.log(`  ${icon}  ${msg}`); }
function logSection(title) {
  console.log(`\n${C.cyan}  ── ${title} ──${C.reset}`);
}

// ── HTTP helper (zero-dependency) ───────────────────────────
function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', ...headers, 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error(`Parse error: ${raw.slice(0, 300)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Request timed out (120s)')); });
    req.write(body);
    req.end();
  });
}

// ── Provider: OpenAI ────────────────────────────────────────
async function viaOpenAI(sys, usr) {
  const isReasoning = P.model.startsWith('o1') || P.model.startsWith('o3');
  const b = { model: P.model, messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }], response_format: { type: 'json_object' } };
  if (isReasoning) { b.max_completion_tokens = MAX_TOKENS; } else { b.max_tokens = MAX_TOKENS; b.temperature = 0.7; }
  const d = await httpPost('api.openai.com', '/v1/chat/completions', { 'Authorization': `Bearer ${P.key}` }, JSON.stringify(b));
  if (d.error) throw new Error(`OpenAI: ${d.error.message}`);
  return { content: d.choices[0].message.content, usage: d.usage };
}

// ── Provider: Anthropic Claude ──────────────────────────────
async function viaAnthropic(sys, usr) {
  const b = { model: P.model, max_tokens: MAX_TOKENS, system: sys, messages: [{ role: 'user', content: usr + '\n\nRespond with valid JSON only.' }] };
  const d = await httpPost('api.anthropic.com', '/v1/messages', { 'x-api-key': P.key, 'anthropic-version': '2023-06-01' }, JSON.stringify(b));
  if (d.error) throw new Error(`Anthropic: ${d.error.message}`);
  const txt = d.content?.[0]?.text || '';
  const m = txt.match(/```json\s*([\s\S]*?)```/) || txt.match(/({[\s\S]*})/);
  return { content: m ? m[1].trim() : txt, usage: { prompt_tokens: d.usage?.input_tokens||0, completion_tokens: d.usage?.output_tokens||0, total_tokens: (d.usage?.input_tokens||0)+(d.usage?.output_tokens||0) } };
}

// ── Provider: Google Gemini ─────────────────────────────────
async function viaGemini(sys, usr) {
  const b = { contents: [{ parts: [{ text: `${sys}\n\n${usr}\n\nRespond with valid JSON only.` }] }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: MAX_TOKENS, temperature: 0.7 } };
  const d = await httpPost('generativelanguage.googleapis.com', `/v1beta/models/${P.model}:generateContent?key=${P.key}`, {}, JSON.stringify(b));
  if (d.error) throw new Error(`Gemini: ${d.error.message}`);
  const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { content: txt, usage: { prompt_tokens: d.usageMetadata?.promptTokenCount||0, completion_tokens: d.usageMetadata?.candidatesTokenCount||0, total_tokens: d.usageMetadata?.totalTokenCount||0 } };
}

// ── Unified caller ──────────────────────────────────────────
async function callAI(sys, usr) {
  if (AI_PROVIDER === 'anthropic') return viaAnthropic(sys, usr);
  if (AI_PROVIDER === 'gemini') return viaGemini(sys, usr);
  return viaOpenAI(sys, usr);
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │  🧠  AI Intelligence Analyst             │');
  console.log('  │  ────────────────────────────────────────  │');
  console.log(`  │  Provider: ${(P.name + ' (' + P.model + ')').padEnd(27)}│`);
  console.log('  │  Hormozi Value Equation Scoring          │');
  console.log('  └──────────────────────────────────────────┘');
  console.log('');

  // ── Validate API key ──
  if (!P.key) {
    log('❌', `${C.red}${P.keyEnv} not set. Export it or pass inline:${C.reset}`);
    log('  ', `${C.dim}${P.keyEnv}=xxx node scripts/ai-intelligence-analyst.mjs${C.reset}`);
    log('  ', `${C.dim}Or switch provider: AI_PROVIDER=anthropic ANTHROPIC_API_KEY=xxx ...${C.reset}`);
    process.exit(1);
  }
  log('🔑', `${P.name} key: ${P.key.slice(0, 7)}...${P.key.slice(-4)}`);

  // ── Load market DNA ──
  logSection('Loading Inputs');

  let marketDna = null;
  if (existsSync(MARKET_DNA_PATH)) {
    marketDna = JSON.parse(readFileSync(MARKET_DNA_PATH, 'utf-8'));
    log('📊', `Market DNA loaded: ${marketDna.property || 'unknown property'}`);
  } else {
    log('⚠️', `${C.yellow}No market_dna.json found — analysis will be scan-only${C.reset}`);
  }

  // ── Load latest competitor scan ──
  let competitorScan = null;
  if (existsSync(COMPETITOR_INTEL_DIR)) {
    const scanFiles = readdirSync(COMPETITOR_INTEL_DIR)
      .filter(f => f.endsWith('.json') && f !== '.gitkeep')
      .sort()
      .reverse();

    if (scanFiles.length > 0) {
      const scanPath = join(COMPETITOR_INTEL_DIR, scanFiles[0]);
      competitorScan = JSON.parse(readFileSync(scanPath, 'utf-8'));
      log('🔍', `Competitor scan loaded: ${scanFiles[0]}`);
    }
  }

  // ── Load SEMrush SEO intel (optional) ──
  let seoIntel = null;
  if (existsSync(SEO_INTEL_PATH)) {
    seoIntel = JSON.parse(readFileSync(SEO_INTEL_PATH, 'utf-8'));
    const orgKw = seoIntel.top_organic_keywords?.length || 0;
    const paidKw = seoIntel.top_paid_keywords?.length || 0;
    log('🔎', `SEMrush SEO intel loaded: ${orgKw} organic + ${paidKw} paid keywords`);
  }

  if (!marketDna && !competitorScan && !seoIntel) {
    log('❌', `${C.red}No data to analyze. Need market_dna.json, competitor scan, or seo_intel.json.${C.reset}`);
    process.exit(1);
  }

  // ── Build analysis prompt ──
  logSection('Running AI Analysis');
  log('🤖', `${P.name}: ${P.model}`);
  log('⏳', 'Sending request (this may take 30-60 seconds)...');

  const systemPrompt = `You are an elite competitive intelligence analyst for a digital marketing studio.
You specialize in paid advertising strategy across Meta, Google, TikTok, LinkedIn, and OpenAI Ads (ChatGPT placements).

You use two strategic frameworks for all analysis:

**Alex Hormozi's Value Equation:**
Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)
- Score each hook/ad on a 1-10 scale using this equation
- Higher scores = more compelling offers

**Daniel Priestley's 7-11-4 Rule:**
Before someone buys, they need: 7 hours of content, 11 touchpoints, 4 different platforms.
- Evaluate how competitor strategies map to this

**OpenAI Ads — CRITICAL RULES:**
OpenAI Ads appear as "Recommendation Cards" inside ChatGPT conversations. They cost ~$60 CPM (premium conversational traffic). Because of this high CPM:
- Every dollar must be justified with proof-based copy
- OpenAI's moderation layer REJECTS hype language
- MANDATORY: Include 2+ verifiable proof points and 0 superlatives in ALL generated ad copy
- No words like: "best", "amazing", "incredible", "unbeatable", "guaranteed", "perfect"
- Instead use: specific numbers, verifiable facts, named features, real outcomes
- Example BAD: "The best luxury villa experience in Sri Lanka!"
- Example GOOD: "7-room lakefront villa • 24 guests • 300 Mbps WiFi • private chef included"

**Ad Copy Generation Standards:**
For ALL platforms (Meta, Google, AND OpenAI Ads), generate proof-based copy:
- Lead with facts and specifics, not superlatives
- Include quantifiable proof points (capacity, ratings, speeds, distances)
- CTAs should be conversational and direct

Return your analysis as a JSON object with these keys:
{
  "analysis_date": "ISO date string",
  "model_used": "model name",
  "property": "property/brand name from input",
  "competitor_swot": [{ "name": "...", "strengths": [...], "weaknesses": [...], "opportunities": [...], "threats": [...] }],
  "gap_analysis": { "uncontested_opportunities": [...], "high_competition_zones": [...], "blue_ocean_moves": [...] },
  "hook_scores": [{ "hook": "...", "hormozi_score": 1-10, "rationale": "...", "improvement": "..." }],
  "ad_copy_variants": [
    { "theme": "...", "headline": "...", "body": "...", "cta": "...", "target_platform": "meta|google|chatgpt", "proof_points": ["...", "..."] }
  ],
  "chatgpt_ad_cards": [
    {
      "card_title": "Short, fact-based headline for Recommendation Card",
      "card_body": "2-3 sentences with verifiable proof points. No superlatives.",
      "card_cta": "Conversational CTA (e.g., Message us on WhatsApp)",
      "target_intent": "The user query/intent this card should appear for",
      "proof_points": ["Specific fact 1", "Specific fact 2"],
      "estimated_daily_budget": 0
    }
  ],
  "budget_recommendations": {
    "total_daily": 0,
    "allocation": { "meta": 0, "google": 0, "chatgpt_ads": 0 },
    "rationale": "...",
    "chatgpt_cpm_note": "At $60 CPM, justify every impression with high-intent targeting"
  },
  "chatgpt_ads_assessment": { "relevance_score": 1-10, "recommendation": "...", "rationale": "...", "suggested_entry_budget": "..." },
  "strategic_summary": "2-3 paragraph executive summary including cross-platform strategy"
}`;

  const userPrompt = `Analyze this competitive landscape and generate strategic intelligence:

${marketDna ? `**Market DNA:**\n${JSON.stringify(marketDna, null, 2)}` : '(No market DNA available)'}

${competitorScan ? `**Competitor Intelligence Scan:**\n${JSON.stringify(competitorScan, null, 2)}` : '(No competitor scan available)'}

${seoIntel ? `**SEMrush SEO + PPC Intelligence:**\nUse organic keywords for content/SEO angles, paid keywords to reverse-engineer competitor Google Ads, and keyword_intel (volume/CPC/difficulty) to prioritize high-intent, low-difficulty keyword gaps.\n${JSON.stringify(seoIntel, null, 2)}` : '(No SEMrush SEO intel available)'}

Generate comprehensive analysis with all required fields.`;

  const startTime = Date.now();

  try {
    const response = await callAI(systemPrompt, userPrompt);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const content = response.content;
    const usage = response.usage;

    // Parse and validate
    const analysis = JSON.parse(content);

    // Enrich with metadata
    analysis._metadata = {
      generated_at: new Date().toISOString(),
      provider: AI_PROVIDER,
      model: P.model,
      elapsed_seconds: parseFloat(elapsed),
      tokens_used: {
        prompt: usage?.prompt_tokens || 0,
        completion: usage?.completion_tokens || 0,
        total: usage?.total_tokens || 0,
      },
      input_files: {
        market_dna: marketDna ? MARKET_DNA_PATH : null,
        competitor_scan: competitorScan ? 'latest' : null,
        seo_intel: seoIntel ? SEO_INTEL_PATH : null,
      }
    };

    // Save output
    writeFileSync(OUTPUT_PATH, JSON.stringify(analysis, null, 2), 'utf-8');

    logSection('Results');
    log('✅', `${C.green}Analysis complete in ${elapsed}s${C.reset}`);
    log('📄', `Output: ${OUTPUT_PATH}`);
    log('🎯', `Competitors analyzed: ${analysis.competitor_swot?.length || 0}`);
    log('🪝', `Hooks scored: ${analysis.hook_scores?.length || 0}`);
    log('✍️', `Ad copy variants: ${analysis.ad_copy_variants?.length || 0}`);
    log('💬', `ChatGPT Ad Cards: ${analysis.chatgpt_ad_cards?.length || 0}`);
    log('💰', `Budget recommendation: $${analysis.budget_recommendations?.total_daily || '?'}/day`);
    
    const chatgptBudget = analysis.budget_recommendations?.allocation?.chatgpt_ads;
    if (chatgptBudget) {
      log('💬', `ChatGPT Ads allocation: $${chatgptBudget}/day (~${Math.round(chatgptBudget / 60 * 1000)} impressions at $60 CPM)`);
    }

    if (analysis.chatgpt_ads_assessment) {
      const cga = analysis.chatgpt_ads_assessment;
      log('💬', `ChatGPT Ads relevance: ${cga.relevance_score}/10 — ${cga.recommendation}`);
    }

    log('🔢', `Tokens used: ${usage?.total_tokens || '?'} (≈$${((usage?.total_tokens || 0) * 0.000005).toFixed(4)})`);

    console.log(`\n${C.dim}  ── Strategic Summary ──${C.reset}`);
    if (analysis.strategic_summary) {
      console.log(`\n${C.dim}  ${analysis.strategic_summary.slice(0, 500)}${C.reset}\n`);
    }

  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log('❌', `${C.red}Analysis failed after ${elapsed}s: ${err.message}${C.reset}`);

    if (err.message.includes('401') || err.message.includes('invalid_api_key')) {
      log('💡', 'Check your OPENAI_API_KEY — it may be expired or invalid');
    } else if (err.message.includes('429')) {
      log('💡', 'Rate limited — wait a minute and try again');
    } else if (err.message.includes('timeout')) {
      log('💡', 'Request timed out — the model may be overloaded, try again');
    }

    process.exit(1);
  }
}

main();
