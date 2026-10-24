// scripts/forager-digest.mjs — daily digest builder (pure + thin file wrapper).
import fs from 'node:fs';
import path from 'node:path';

const STALLED_DAYS = 7;

export function buildDigest({ leads = [], states = {}, audit = [], date = new Date().toISOString().slice(0, 10) } = {}) {
  const byState = {};
  const byVenture = {};
  for (const l of leads) {
    const st = states[l.lead_id]?.state || 'new';
    byState[st] = (byState[st] || 0) + 1;
    const v = l.target_venture || 'unassigned';
    byVenture[v] = (byVenture[v] || 0) + 1;
  }
  const day = new Date(date + 'T00:00:00Z').getTime();
  const pending = leads.filter((l) => (states[l.lead_id]?.state || 'new') === 'approved');
  const stalled = leads.filter((l) => {
    const s = states[l.lead_id];
    if (!s || s.state !== 'reviewing' || !s.updated_at) return false;
    return day - new Date(s.updated_at).getTime() > STALLED_DAYS * 86400000;
  });
  const top = [...leads].sort((a, b) => (b.qualification_score || 0) - (a.qualification_score || 0)).slice(0, 5);

  const lines = [
    `# Forager Digest — ${date}`,
    ``,
    `Total leads: ${leads.length}`,
    `Pending approval: ${pending.length}`,
    `Stalled (>7d in reviewing): ${stalled.length}`,
    `Audit events: ${audit.length}`,
    ``,
    `## By state`,
    ...Object.entries(byState).map(([s, n]) => `- ${s}: ${n}`),
    ``,
    `## By venture`,
    ...Object.entries(byVenture).map(([v, n]) => `- ${v}: ${n}`),
    ``,
    `## Pending approval (post manually, then mark replied)`,
    ...(pending.length ? pending.map((l) => `- ${l.lead_id} (${l.target_venture}, score ${l.qualification_score}) → APPROVE:${l.lead_id}`) : ['- none']),
    ``,
    `## Stalled (>7d in reviewing)`,
    ...(stalled.length ? stalled.map((l) => `- ${l.lead_id} since ${states[l.lead_id].updated_at}`) : ['- none']),
    ``,
    `## Top new leads`,
    `| Lead | Venture | Score | State |`,
    `|------|---------|-------|-------|`,
    ...top.map((l) => `| ${l.lead_id} | ${l.target_venture || 'unassigned'} | ${l.qualification_score ?? '-'} | ${states[l.lead_id]?.state || 'new'} |`),
    ``,
    `_Generated ${new Date().toISOString()}. Human posts only — nothing here sends anything._`,
  ];
  return lines.join('\n');
}

// Thin wrapper: run directly to emit campaigns/forager-digest-YYYY-MM-DD.md
const invoked = process.argv[1] && path.resolve(process.argv[1]).endsWith('forager-digest.mjs');
if (invoked) {
  const date = new Date().toISOString().slice(0, 10);
  const { readJson } = await import('../tools/lead-lifecycle.mjs');
  const leads = readJson('campaigns/discovered_leads.json', []);
  const states = readJson('campaigns/lead_states.json', {});
  const md = buildDigest({ leads, states, audit: [], date });
  fs.writeFileSync(`campaigns/forager-digest-${date}.md`, md, 'utf-8');
  console.log(`digest written: campaigns/forager-digest-${date}.md (${leads.length} leads)`);
}
