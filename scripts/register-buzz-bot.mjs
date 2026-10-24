import fs from 'node:fs';
import crypto from 'node:crypto';

const filePath = '/Users/rajabey/Library/Application Support/xyz.block.buzz.app/agents/managed-agents.json';
if (!fs.existsSync(filePath)) {
  console.error('managed-agents.json does not exist at:', filePath);
  process.exit(1);
}

// 1. Create a backup
const backupPath = `${filePath}.bak-${Date.now()}`;
fs.copyFileSync(filePath, backupPath);
console.log('Created backup at:', backupPath);

const raw = fs.readFileSync(filePath, 'utf8');
let data = JSON.parse(raw);
let agents = Array.isArray(data) ? data : (data.agents || []);

// Remove any existing duplicate entries for KoLakeMarketingBot
agents = agents.filter(a => a.name !== 'KoLakeMarketingBot' && a.display_name !== 'KoLake Marketing BOT');

const marketingBot = {
  "pubkey": "",
  "name": "KoLakeMarketingBot",
  "display_name": "KoLake Marketing BOT",
  "persona_id": null,
  "auth_tag": null,
  "relay_url": "",
  "avatar_url": null,
  "acp_command": "buzz-acp",
  "agent_command": "",
  "agent_command_override": null,
  "agent_args": [],
  "mcp_command": "",
  "turn_timeout_seconds": 60,
  "idle_timeout_seconds": 300,
  "max_turn_duration_seconds": 120,
  "parallelism": 1,
  "system_prompt": `# KoLake Marketing BOT — Attribution & Web Traffic Surveillance Agent

You are the **KoLake Marketing BOT**, the dedicated marketing, paid ads, and web traffic surveillance agent for **KoLakeVilla.com** operating on the Buzz service bus.

## Mission & Purpose
1. **Surveillance & Attribution**: Monitor Meta Ads Analytics (Spend, Outbound Link Clicks, CTR, CPC, CPM, Top Creatives) and Google Analytics 4 (GA4 Active Users, Sessions, Engagement Rate, Average Session Duration, Bounce Rate).
2. **Funnel Tracking**: Track visitor progression from paid social ads to KoLakeVilla.com and direct WhatsApp / booking inquiries.
3. **Yield & Axiom Safeguards**: Enforce SMMFactory price floor axioms ($250/night villa floor / $45/night single room floor). Never promote rates below these thresholds.
4. **Visual Telemetry**: Format outputs with rich visual ASCII cards, hourly sparklines, and direct links to the live analytics dashboard.

## Channel & Context
- Target Channel: \`#marketing-kolake\`
- Target Website: https://kolakevilla.com
- Live Dashboard: https://kolake-analytics.vercel.app
- Telegram Dispatch: @KoLakeVillaBot

## Core Capabilities
- Provide daily and hourly performance pulse cards.
- Analyze ad creative effectiveness and recommend budget allocations.
- Alert the owner on CPA spikes, unusual drop-offs, or viral CTR spikes.`,
  "model": "deepseek/deepseek-v4-pro",
  "provider": "openrouter",
  "persona_source_version": null,
  "env_vars": {
    "SUPABASE_ANON_KEY": process.env.SUPABASE_ANON_KEY || "",
    "SUPABASE_URL": process.env.SUPABASE_URL || ""
  },
  "start_on_app_launch": false,
  "auto_restart_on_config_change": true,
  "runtime_pid": null,
  "backend": {
    "type": "local"
  },
  "backend_agent_id": null,
  "provider_policy_pending": false,
  "provider_binary_path": null,
  "created_at": new Date().toISOString(),
  "updated_at": new Date().toISOString(),
  "last_started_at": null,
  "last_stopped_at": null,
  "last_exit_code": null,
  "last_error": null,
  "last_error_code": null,
  "respond_to": "owner-only",
  "respond_to_allowlist": [],
  "slug": "kolake-marketing-bot-" + crypto.randomBytes(4).toString('hex'),
  "runtime": "buzz-agent",
  "is_builtin": false,
  "is_active": true,
  "definition_parallelism": 1
};

agents.unshift(marketingBot);

const output = Array.isArray(data) ? agents : { ...data, agents };
fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf8');
console.log('✅ Successfully registered KoLake Marketing BOT in Buzz managed-agents.json!');
