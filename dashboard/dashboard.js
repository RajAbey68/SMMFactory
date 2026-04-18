/* ============================================
   SMMFactory Dashboard — JavaScript Engine
   ============================================ */

// --- Phase icon/label map (always available) ---
const PHASE_META = {
  ideation:  { icon: '💡', short: 'Idea' },
  research:  { icon: '🔍', short: 'Rsch' },
  planning:  { icon: '📋', short: 'Plan' },
  creative:  { icon: '🎨', short: 'Crtv' },
  review:    { icon: '✅', short: 'Revw' },
  launch:    { icon: '🚀', short: 'Lnch' },
  optimize:  { icon: '📈', short: 'Optm' },
  close:     { icon: '🏁', short: 'Clse' }
};

const PHASE_ORDER = ['ideation','research','planning','creative','review','launch','optimize','close'];

// --- Metrics templates per campaign type (used when registry doesn't include metrics) ---
const METRICS_TEMPLATES = {
  paid_media: {
    impressions:   { value: '—', source: 'Meta Ads', trend: 'neutral', note: 'Awaiting data' },
    clicks:        { value: '—', source: 'Meta Ads', trend: 'neutral', note: '' },
    ctr:           { value: '—', source: 'Meta Ads', trend: 'neutral', note: '' },
    leads:         { value: '—', source: 'WhatsApp', trend: 'neutral', note: '' },
    spend:         { value: '$0', source: 'Meta+Google', trend: 'neutral', note: 'Pre-launch' },
    landing_views: { value: '—', source: 'Analytics', trend: 'neutral', note: '' }
  },
  personal_brand: {
    posts_published: { value: '0/6', source: 'LinkedIn', trend: 'neutral', note: '' },
    impressions:     { value: '—', source: 'LinkedIn', trend: 'neutral', note: '' },
    connections:     { value: '0/40', source: 'LinkedIn', trend: 'neutral', note: '' },
    outreach_sent:   { value: '0/20', source: 'Manual', trend: 'neutral', note: '' },
    replies:         { value: '0/5', source: 'Manual', trend: 'neutral', note: '' },
    interviews:      { value: '0/2', source: 'Manual', trend: 'neutral', note: '' }
  }
};

// --- Dynamic Registry Loader ---
// Loads from campaigns/registry.json, normalises phase_progress strings
// into simple states (done/active/skipped/pending) for the timeline.

let REGISTRY = { lifecycle: { phases: PHASE_ORDER.map(id => ({ id, ...PHASE_META[id] })) }, campaigns: [] };

function normalizePhaseState(raw) {
  if (!raw) return 'pending';
  const s = raw.toLowerCase();
  if (s.includes('complete') || s.startsWith('✅')) return 'done';
  if (s.includes('in progress') || s.startsWith('🔴') || s.includes('active')) return 'active';
  if (s.includes('skipped')) return 'skipped';
  return 'pending';
}

function inferNextAction(campaign) {
  for (const phase of PHASE_ORDER) {
    const state = normalizePhaseState(campaign.phase_progress?.[phase]);
    if (state === 'active') {
      const raw = campaign.phase_progress[phase] || '';
      const detail = raw.replace(/^[✅🔴⬜]\s*/, '').replace(/^(complete|in progress|not started)\s*[—–-]?\s*/i, '');
      return detail || `Complete ${phase} phase`;
    }
  }
  return 'Review campaign status';
}

async function loadRegistry() {
  try {
    const res = await fetch('../campaigns/registry.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Normalise campaigns from registry format to dashboard format
    REGISTRY.campaigns = (data.campaigns || []).map(c => {
      const progress = {};
      for (const phase of PHASE_ORDER) {
        progress[phase] = normalizePhaseState(c.phase_progress?.[phase]);
      }
      return {
        ...c,
        phase_progress: progress,
        next_action: inferNextAction(c),
        metrics: c.metrics || METRICS_TEMPLATES[c.type] || METRICS_TEMPLATES.paid_media
      };
    });

    console.log(`✅ Loaded ${REGISTRY.campaigns.length} campaigns from registry.json`);
  } catch (err) {
    console.warn('⚠️ Could not load registry.json, using fallback data:', err.message);
    // Fallback: minimal embedded data
    REGISTRY.campaigns = [
      {
        slug: 'ko-lake-easter', ref: 'KLEst', name: 'Ko Lake Villa — Easter/Avurudu Push',
        type: 'paid_media', status: 'active', current_phase: 'creative',
        window: { start: '2026-03-24', end: '2026-04-17' },
        phase_progress: { ideation:'done', research:'done', planning:'done', creative:'active', review:'pending', launch:'pending', optimize:'pending', close:'pending' },
        next_action: 'Select hero image + ad creatives',
        metrics: METRICS_TEMPLATES.paid_media
      },
      {
        slug: 'ai-career', ref: 'AICar', name: 'AI Adoption Advisor — Career Push',
        type: 'personal_brand', status: 'active', current_phase: 'review',
        window: { start: '2026-03-25', end: '2026-04-07' },
        phase_progress: { ideation:'done', research:'skipped', planning:'done', creative:'done', review:'active', launch:'pending', optimize:'pending', close:'pending' },
        next_action: 'Profile overhaul + publish Post 1',
        metrics: METRICS_TEMPLATES.personal_brand
      }
    ];
  }
}


// --- Utilities ---
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function daysLeft(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function daysElapsed(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
}

function phaseCompletion(progress) {
  const phases = Object.values(progress);
  const done = phases.filter(p => p === 'done' || p === 'skipped').length;
  return Math.round((done / phases.length) * 100);
}


// --- Clock ---
function updateClock() {
  const el = $('#currentTime');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}


// --- Summary Strip ---
function renderSummaryStrip() {
  const el = $('#summaryStrip');
  if (!el) return;

  const total = REGISTRY.campaigns.length;
  const active = REGISTRY.campaigns.filter(c => c.status === 'active').length;
  const avgCompletion = Math.round(
    REGISTRY.campaigns.reduce((sum, c) => sum + phaseCompletion(c.phase_progress), 0) / total
  );

  const cards = [
    { value: total, label: 'Total Campaigns', color: 'var(--accent-blue)' },
    { value: active, label: 'Active Now', color: 'var(--accent-green)' },
    { value: `${avgCompletion}%`, label: 'Avg Progress', color: 'var(--accent-amber)' },
    { value: REGISTRY.campaigns.reduce((min, c) => {
        const d = daysLeft(c.window.end);
        return d < min ? d : min;
      }, Infinity) + 'd', label: 'Nearest Deadline', color: 'var(--accent-red)' }
  ];

  el.innerHTML = cards.map(c => `
    <div class="summary-card">
      <div class="summary-card__value" style="color: ${c.color}">${c.value}</div>
      <div class="summary-card__label">${c.label}</div>
    </div>
  `).join('');
}


// --- Campaign Cards ---
function renderCampaignCards() {
  const el = $('#campaignsGrid');
  if (!el) return;

  el.innerHTML = REGISTRY.campaigns.map(campaign => {
    const completion = phaseCompletion(campaign.phase_progress);
    const days = daysLeft(campaign.window.end);
    const elapsed = daysElapsed(campaign.window.start);
    const refClass = campaign.type === 'paid_media' ? 'paid' : 'personal';

    // Phase timeline
    const timeline = PHASE_ORDER.map((phaseId, i) => {
      const state = campaign.phase_progress[phaseId] || 'pending';
      const circleClass = `phase-dot__circle--${state}`;
      const icon = state === 'done' ? '✓' : state === 'active' ? '●' : state === 'skipped' ? '—' : '';
      const meta = PHASE_META[phaseId];

      // Connector between dots (not after last)
      let connector = '';
      if (i < PHASE_ORDER.length - 1) {
        const nextState = campaign.phase_progress[PHASE_ORDER[i + 1]] || 'pending';
        const connDone = (state === 'done' || state === 'skipped') ? 'done' : 'pending';
        connector = `<div class="phase-dot__connector phase-dot__connector--${connDone}"></div>`;
      }

      return `
        <div class="phase-dot">
          ${connector}
          <div class="phase-dot__circle ${circleClass}" title="${phaseId}: ${state}">${icon}</div>
          <span class="phase-dot__label">${meta.short}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="campaign-card" data-ref="${campaign.ref}" data-slug="${campaign.slug}">
        <div class="campaign-card__header">
          <span class="campaign-card__ref campaign-card__ref--${refClass}">${campaign.ref}</span>
          <span class="campaign-card__name">${campaign.name}</span>
          <span class="campaign-card__status campaign-card__status--${campaign.status}">${campaign.status}</span>
        </div>
        <div class="campaign-card__body">
          <div class="phase-timeline">${timeline}</div>
          <div class="campaign-card__meta">
            <div class="meta-item">
              <span class="meta-item__label">Progress</span>
              <span class="meta-item__value">${completion}% complete</span>
            </div>
            <div class="meta-item">
              <span class="meta-item__label">Window</span>
              <span class="meta-item__value">${campaign.window.start} → ${campaign.window.end}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item__label">Day</span>
              <span class="meta-item__value">Day ${elapsed} · ${days}d left</span>
            </div>
            <div class="meta-item">
              <span class="meta-item__label">Phase</span>
              <span class="meta-item__value" style="color: var(--accent-amber)">${campaign.current_phase}</span>
            </div>
          </div>
        </div>
        <div class="campaign-card__footer">
          <span class="campaign-card__next-action">⚡ ${campaign.next_action}</span>
          <button class="campaign-card__action" data-action="prompt" data-ref="${campaign.ref}">Open in Prompt →</button>
        </div>
      </div>
    `;
  }).join('');

  // Wire up "Open in Prompt" buttons
  $$('.campaign-card__action[data-action="prompt"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ref = btn.dataset.ref;
      focusPromptWithRef(ref);
    });
  });
}


// --- Metrics Grid ---
function renderMetrics() {
  const el = $('#metricsGrid');
  if (!el) return;

  const allMetrics = [];
  REGISTRY.campaigns.forEach(campaign => {
    Object.entries(campaign.metrics).forEach(([key, m]) => {
      allMetrics.push({
        ref: campaign.ref,
        key: key.replace(/_/g, ' '),
        ...m
      });
    });
  });

  el.innerHTML = allMetrics.map(m => {
    const trendIcon = m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '—';
    const trendClass = `metric-card__trend--${m.trend}`;

    return `
      <div class="metric-card">
        <div class="metric-card__header">
          <span class="metric-card__ref">${m.ref}</span>
          <span class="metric-card__source">${m.source}</span>
        </div>
        <div class="metric-card__value">${m.value}</div>
        <div class="metric-card__label">${m.key}</div>
        ${m.note ? `<div class="metric-card__trend ${trendClass}">${trendIcon} ${m.note}</div>` : ''}
      </div>
    `;
  }).join('');
}


// --- AG Prompt ---
function initPrompt() {
  const form = $('#promptForm');
  const input = $('#promptInput');
  const select = $('#campaignSelect');
  const history = $('#promptHistory');
  const toggle = $('#promptToggle');
  const header = $('.ag-prompt__header');
  const prompt = $('#agPrompt');

  // Populate select
  REGISTRY.campaigns.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.ref;
    opt.textContent = `${c.ref} — ${c.name.split('—')[0].trim()}`;
    select.appendChild(opt);
  });

  // Toggle collapse
  header.addEventListener('click', () => {
    prompt.classList.toggle('ag-prompt--collapsed');
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const ref = select.value;
    const fullMessage = ref ? `for ${ref}: ${text}` : text;

    // Add to history
    addMessageToHistory(fullMessage, 'user');
    addMessageToHistory(`Instruction queued for Antigravity. Copy and paste into your AG session, or use the AG CLI.`, 'system');

    // Copy to clipboard
    navigator.clipboard.writeText(fullMessage).then(() => {
      addMessageToHistory(`📋 Copied to clipboard`, 'system');
    }).catch(() => {});

    input.value = '';
    input.focus();
  });
}

function addMessageToHistory(text, type) {
  const history = $('#promptHistory');
  // Remove welcome message on first real message
  const welcome = $('.ag-prompt__welcome', history);
  if (welcome) welcome.remove();

  const div = document.createElement('div');
  div.className = `ag-prompt__message ag-prompt__message--${type}`;
  div.textContent = text;
  history.appendChild(div);
  history.scrollTop = history.scrollHeight;
}

function focusPromptWithRef(ref) {
  const prompt = $('#agPrompt');
  const select = $('#campaignSelect');
  const input = $('#promptInput');

  // Expand if collapsed
  prompt.classList.remove('ag-prompt--collapsed');

  // Set the campaign selector
  select.value = ref;

  // Focus input
  input.focus();
  input.placeholder = `Instruction for ${ref}...`;
}


// --- Refresh ---
async function refreshAll() {
  await loadRegistry();
  renderSummaryStrip();
  renderCampaignCards();
  renderMetrics();
}


// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  updateClock();
  setInterval(updateClock, 1000);
  await refreshAll();
  initPrompt();

  // Refresh button
  $('#refreshBtn').addEventListener('click', async () => {
    await refreshAll();
    addMessageToHistory('Dashboard refreshed from registry.json', 'system');
  });
});
