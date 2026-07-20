/* ============================================================
   Blog Studio — SMMFactory content pipeline wizard
   Standalone, no build step. Vanilla JS state machine.
   Assembles a campaign brief + draft .md + SEO checklist.
   Nothing is published: output is always a draft.
   ============================================================ */
(function () {
  'use strict';

  // --- Reference data (mirrors campaigns/registry.json) ---
  const CAMPAIGNS = {
    KLRtr: {
      ref: 'KLRtr',
      name: 'Ko Lake Villa — Retreats & Events',
      audience: 'Retreat organisers & discerning travellers',
      tone: 'Warm, sensory, unhurried — sells calm and place, not features',
      tags: ['retreats', 'wellness'],
    },
    AICar: {
      ref: 'AICar',
      name: 'AI Adoption Advisor — Career Push',
      audience: 'Professionals & hiring managers',
      tone: 'Credible, plain, confident — practical authority without hype',
      tags: ['ai-adoption', 'career'],
    },
    SKYHV: {
      ref: 'SKYHV',
      name: 'Sky High Villas — Heli-Tours Push',
      audience: 'Luxury & experience seekers',
      tone: 'Vivid, aspirational, precise — the thrill is concrete',
      tags: ['heli-tours', 'luxury-travel'],
    },
    GEN: {
      ref: '',
      name: 'Generic house post',
      audience: 'General audience',
      tone: 'Plain, direct, ~7th–9th grade — lead with the problem',
      tags: ['marketing'],
    },
  };

  const SOURCES = {
    topic: { label: 'A topic idea', sub: 'Start from a subject — Studio drafts from scratch.', detail: null },
    research: { label: 'Run new research', sub: 'Run the LeadSynch grounded research engine on an entity or topic — sources with provenance become the material.', detail: { type: 'text', label: 'Entity / topic to research', ph: 'e.g. wellness tourism trends Sri Lanka 2026' } },
    prior: { label: 'Pick up previous research', sub: 'Recover research you already have — a campaign research file, a stored LeadSynch profile, or a project name.', detail: { type: 'text', label: 'What to recover', ph: 'e.g. campaigns/ko-lake-retreats/research/market_dna.json, a contact/company name, or a project name' } },
    paste: { label: 'Repurpose pasted text', sub: 'A transcript, email, notes, or existing copy.', detail: { type: 'textarea', label: 'Paste the source text', ph: 'Paste the transcript, notes, or copy to repurpose…' } },
    url: { label: 'Repurpose a URL', sub: 'An article, landing page, or announcement to fetch.', detail: { type: 'text', label: 'Source URL', ph: 'https://…' } },
    asset: { label: 'From a campaign asset', sub: 'A file already in this campaign (research, DNA, calendar).', detail: { type: 'text', label: 'Path to the campaign file', ph: 'campaigns/ko-lake-retreats/research/market_dna.json' } },
  };

  const TONES = {
    auto: { label: 'Match the campaign', sub: "Use the campaign's own voice (recommended)." },
    plain: { label: 'Plain & direct', sub: 'Short sentences, no jargon.' },
    warm: { label: 'Warm & sensory', sub: 'Evocative, human, unhurried.' },
    authoritative: { label: 'Authoritative', sub: 'Confident, evidence-led.' },
    playful: { label: 'Playful', sub: 'Light, quick, a little cheeky.' },
  };

  const LENGTHS = {
    short: { label: 'Short', range: '500–700 words', sub: 'A quick, single-idea read.' },
    standard: { label: 'Standard', range: '700–1000 words', sub: 'The default for most posts.' },
    deep: { label: 'Deep', range: '1200+ words', sub: 'A thorough, reference-grade piece.' },
  };

  // --- State ---
  const state = {
    source: null,
    sourceDetail: '',
    campaign: null,
    title: '',
    primaryKeyword: '',
    supportingKeywords: '',
    tone: 'auto',
    length: 'standard',
    cta: '',
  };

  let step = 0; // 0-indexed; last index is the review screen
  let activeTab = 'brief';

  // --- Step definitions ---
  const STEPS = [
    { key: 'source', kicker: 'Source', render: renderSource, valid: () => !!state.source },
    { key: 'campaign', kicker: 'Campaign', render: renderCampaign, valid: () => !!state.campaign },
    { key: 'angle', kicker: 'Angle', render: renderAngle, valid: validAngle },
    { key: 'keywords', kicker: 'Keywords', render: renderKeywords, valid: () => state.primaryKeyword.trim().length > 0 },
    { key: 'voice', kicker: 'Voice', render: renderVoice, valid: () => !!state.tone },
    { key: 'format', kicker: 'Format', render: renderFormat, valid: () => !!state.length && state.cta.trim().length > 0 },
    { key: 'review', kicker: 'Assemble', render: renderReview, valid: () => true, isReview: true },
  ];

  const els = {
    rail: document.getElementById('rail'),
    kicker: document.getElementById('stepKicker'),
    count: document.getElementById('stepCount'),
    card: document.getElementById('card'),
  };

  // --- Helpers ---
  const CHECK_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="#241a05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70) || 'untitled';
  }
  function today() {
    // Local date, YYYY-MM-DD.
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function resolvedTone() {
    if (state.tone === 'auto') return (CAMPAIGNS[state.campaign] || CAMPAIGNS.GEN).tone;
    return TONES[state.tone].label;
  }
  function supportingList() {
    return state.supportingKeywords.split(',').map((s) => s.trim()).filter(Boolean);
  }

  function optionEl({ selected, kind, label, sub, onClick }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option' + (selected ? ' selected' : '');
    btn.setAttribute('role', kind === 'check' ? 'checkbox' : 'radio');
    btn.setAttribute('aria-checked', selected ? 'true' : 'false');
    btn.innerHTML =
      `<span class="mark ${kind}">${CHECK_SVG}</span>` +
      `<span class="body"><span class="label">${esc(label)}</span>` +
      (sub ? `<span class="sub">${esc(sub)}</span>` : '') + '</span>';
    btn.addEventListener('click', onClick);
    return btn;
  }

  // --- Step renderers (return a DocumentFragment of body content) ---
  function renderSource(root) {
    heading(root, 'What are you starting from?', 'This decides how Studio gathers material for the post.');
    const opts = document.createElement('div');
    opts.className = 'options';
    Object.entries(SOURCES).forEach(([k, v]) => {
      opts.appendChild(optionEl({
        selected: state.source === k, kind: 'radio', label: v.label, sub: v.sub,
        onClick: () => { state.source = k; refresh(); },
      }));
    });
    root.appendChild(opts);
  }

  function renderCampaign(root) {
    heading(root, 'Which campaign is this for?', 'The campaign sets the voice and the audience — no two sound alike.');
    const opts = document.createElement('div');
    opts.className = 'options';
    ['KLRtr', 'AICar', 'SKYHV', 'GEN'].forEach((k) => {
      const c = CAMPAIGNS[k];
      opts.appendChild(optionEl({
        selected: state.campaign === k, kind: 'radio',
        label: c.ref ? `${c.ref} · ${c.name}` : c.name,
        sub: `${c.audience} — ${c.tone}`,
        onClick: () => { state.campaign = k; refresh(); },
      }));
    });
    root.appendChild(opts);
  }

  function renderAngle(root) {
    heading(root, 'What is the angle?', 'A working title or the specific take. You can refine it later.');
    root.appendChild(textField({
      label: 'Working title / angle', value: state.title,
      ph: 'e.g. What a real reset feels like — three slow days at the lake',
      on: (v) => { state.title = v; updateNav(); },
    }));
    const src = SOURCES[state.source];
    if (src && src.detail) {
      root.appendChild(textField({
        label: src.detail.label, value: state.sourceDetail, ph: src.detail.ph,
        textarea: src.detail.type === 'textarea',
        on: (v) => { state.sourceDetail = v; updateNav(); },
      }));
    }
  }

  function renderKeywords(root) {
    heading(root, 'What should it rank for?', 'One phrase a real reader would type. Studio works it in naturally — no stuffing.');
    root.appendChild(textField({
      label: 'Primary keyword', value: state.primaryKeyword,
      ph: 'e.g. sri lanka wellness retreat',
      on: (v) => { state.primaryKeyword = v; updateNav(); },
    }));
    root.appendChild(textField({
      label: 'Supporting keywords', optional: true, value: state.supportingKeywords,
      ph: 'comma-separated — e.g. off-grid retreat, lakeside stay',
      on: (v) => { state.supportingKeywords = v; updateNav(); },
    }));
  }

  function renderVoice(root) {
    const c = CAMPAIGNS[state.campaign] || CAMPAIGNS.GEN;
    heading(root, 'How should it sound?', `${c.name} usually reads: ${c.tone.toLowerCase()}.`);
    const opts = document.createElement('div');
    opts.className = 'options';
    Object.entries(TONES).forEach(([k, v]) => {
      opts.appendChild(optionEl({
        selected: state.tone === k, kind: 'radio',
        label: k === 'auto' ? `${v.label} — ${c.tone.split('—')[0].trim()}` : v.label,
        sub: v.sub,
        onClick: () => { state.tone = k; refresh(); },
      }));
    });
    root.appendChild(opts);
  }

  function renderFormat(root) {
    heading(root, 'How long, and where does it lead?', 'Pick a depth, then the one action the reader should take at the end.');
    const opts = document.createElement('div');
    opts.className = 'options';
    Object.entries(LENGTHS).forEach(([k, v]) => {
      opts.appendChild(optionEl({
        selected: state.length === k, kind: 'radio', label: `${v.label} · ${v.range}`, sub: v.sub,
        onClick: () => { state.length = k; refresh(); },
      }));
    });
    root.appendChild(opts);
    const ctaField = textField({
      label: 'Call to action (the close)', value: state.cta,
      ph: 'e.g. See the retreat dates open this season',
      on: (v) => { state.cta = v; updateNav(); },
    });
    ctaField.style.marginTop = '1.5rem';
    root.appendChild(ctaField);
  }

  // --- Review / assemble ---
  function renderReview(root) {
    const c = CAMPAIGNS[state.campaign] || CAMPAIGNS.GEN;
    heading(root, 'Your brief is ready', 'Copy it into a Claude Code / Cowork session, or download the draft to start writing.');

    // Summary chips
    const sum = document.createElement('div');
    sum.className = 'summary';
    const rows = [
      ['Campaign', c.ref ? `${c.ref}` : 'House post'],
      ['Source', SOURCES[state.source].label],
      ['Tone', resolvedTone().split('—')[0].trim()],
      ['Length', LENGTHS[state.length].range],
    ];
    rows.forEach(([k, v]) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `<div class="k">${esc(k)}</div><div class="v">${esc(v)}</div>`;
      sum.appendChild(chip);
    });
    root.appendChild(sum);

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabs.setAttribute('role', 'tablist');
    [['brief', 'Skill brief'], ['draft', 'Draft .md'], ['seo', 'SEO checklist']].forEach(([k, label]) => {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'tab' + (activeTab === k ? ' active' : '');
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', activeTab === k ? 'true' : 'false');
      t.textContent = label;
      t.addEventListener('click', () => { activeTab = k; refresh(); });
      tabs.appendChild(t);
    });
    root.appendChild(tabs);

    // Panel
    if (activeTab === 'seo') {
      root.appendChild(seoPanel());
    } else {
      const text = activeTab === 'brief' ? buildBrief() : buildDraft();
      root.appendChild(codePanel(text));
      if (activeTab === 'draft') {
        const row = document.createElement('div');
        row.className = 'dl-row';
        const dl = document.createElement('button');
        dl.className = 'btn btn-ghost';
        dl.textContent = '↓ Download .md';
        dl.addEventListener('click', () => downloadDraft());
        row.appendChild(dl);
        root.appendChild(row);
      }
    }

    // Draft-gate reassurance
    const gate = document.createElement('div');
    gate.className = 'gate';
    gate.innerHTML = '<span>✓</span><span>This is written as a <b>draft</b>. A human reads it and flips <code style="color:inherit">draft: true</code> → <code style="color:inherit">false</code> before it publishes — the Four-Eyes gate, applied to content.</span>';
    root.appendChild(gate);
  }

  function codePanel(text) {
    const wrap = document.createElement('div');
    wrap.className = 'output';
    const copy = document.createElement('button');
    copy.className = 'cta-copy';
    copy.textContent = 'Copy';
    copy.addEventListener('click', () => copyText(text, copy));
    const pre = document.createElement('pre');
    pre.textContent = text;
    wrap.appendChild(copy);
    wrap.appendChild(pre);
    return wrap;
  }

  function seoPanel() {
    const ul = document.createElement('ul');
    ul.className = 'checklist';
    const title = state.title.trim();
    const kw = state.primaryKeyword.trim();
    const titleLen = title.length;
    const kwInTitle = kw && title.toLowerCase().includes(kw.toLowerCase());

    const items = [];
    items.push(check(titleLen > 0 && titleLen <= 60,
      `Title length — <b>${titleLen}</b> chars`,
      titleLen === 0 ? 'Add a title.' : titleLen <= 60 ? 'Good; fits most search results.' : 'Over 60 chars may truncate in results — consider trimming.'));
    items.push(check(!!kwInTitle,
      'Primary keyword in the title',
      kwInTitle ? 'Present.' : `Work "<code>${esc(kw || '…')}</code>" into the title if it reads naturally.`));
    items.push(check(false,
      'Meta description',
      'Write a one-sentence <code>description</code> under 155 chars stating the payoff (the draft leaves a TODO).', true));
    items.push(check(false,
      'A heading phrased like a search',
      'Make at least one <code>##</code> match how people ask this — see the queries below.', true));

    items.forEach((li) => ul.appendChild(li));

    // Suggested searches
    const note = document.createElement('li');
    const q = kw || 'your topic';
    note.innerHTML = `<span class="icon">🔎</span><span class="note">Run these in <code>WebSearch</code> (or <code>npm run seo</code> for real volume): ` +
      `<br>· “how to ${esc(q)}” &nbsp; · “best ${esc(q)}” &nbsp; · “${esc(q)} tips”</span>`;
    ul.appendChild(note);
    return ul;
  }

  function check(ok, label, note, flag) {
    const li = document.createElement('li');
    const icon = ok ? '<span class="icon ok">✓</span>' : `<span class="icon ${flag ? 'flag' : 'flag'}">!</span>`;
    li.innerHTML = `${icon}<span><b style="font-weight:600">${label}</b>${note ? ` — <span class="note">${note}</span>` : ''}</span>`;
    return li;
  }

  // --- Output builders ---
  function buildBrief() {
    const c = CAMPAIGNS[state.campaign] || CAMPAIGNS.GEN;
    const src = SOURCES[state.source];
    const detail = state.sourceDetail.trim();
    const lines = [
      '/blog-post',
      '',
      c.ref
        ? `Write one blog post for campaign ${c.ref} (${c.name}).`
        : 'Write one generic SMMFactory house blog post.',
      '',
      `Angle / working title: ${state.title.trim() || '(propose one)'}`,
      `Audience: ${c.audience}`,
      `Tone: ${resolvedTone()}`,
      `Length: ${LENGTHS[state.length].label} (${LENGTHS[state.length].range})`,
      `Primary keyword: ${state.primaryKeyword.trim()}`,
      `Supporting keywords: ${supportingList().join(', ') || '—'}`,
      `Call to action (close): ${state.cta.trim()}`,
      `Source: ${src.label}${detail ? ` — ${detail}` : ''}`,
      '',
      `Follow the blog-post skill: match the ${c.ref || 'house'} voice, keep`,
      'draft: true, and save to content/blog/. Ground every factual claim in',
      "the campaign's own files — do not invent offers, prices, or results.",
    ];
    if (state.source === 'research') {
      lines.push('');
      lines.push('Ground this via the LeadSynch research engine first: POST the');
      lines.push('entity/topic above to /api/research/entity (LEADSYNCH_URL or');
      lines.push('http://localhost:3001), poll the job, and write only from the');
      lines.push('returned sources — cite their sourceUrl provenance. If the');
      lines.push('service is unreachable, fall back per the skill’s "Research');
      lines.push('grounding" section and note it in the draft header.');
    }
    if (state.source === 'prior') {
      lines.push('');
      lines.push('Recover the previous research named above before writing.');
      lines.push('Try in order: (1) a research file in this repo (campaigns/*/');
      lines.push('research/, research/) matching it; (2) a stored LeadSynch');
      lines.push('profile — GET /api/research/profile/:contactId after finding');
      lines.push('the contact; (3) ask me for the file or re-run fresh research');
      lines.push('if neither exists. Write only from what was recovered — keep');
      lines.push('its provenance — and never invent findings to fill gaps.');
    }
    return lines.join('\n');
  }

  function buildDraft() {
    const c = CAMPAIGNS[state.campaign] || CAMPAIGNS.GEN;
    const kws = [state.primaryKeyword.trim(), ...supportingList()].filter(Boolean);
    const fm = ['---'];
    fm.push(`title: "${state.title.trim().replace(/"/g, "'") || 'Untitled'}"`);
    fm.push('description: "TODO — one sentence, the payoff, under 155 chars."');
    fm.push(`date: "${today()}"`);
    if (c.ref) fm.push(`campaign: "${c.ref}"`);
    fm.push(`tags: [${c.tags.map((t) => `"${t}"`).join(', ')}]`);
    fm.push(`keywords: [${kws.map((k) => `"${k.replace(/"/g, "'")}"`).join(', ')}]`);
    fm.push('author: "SMMFactory"');
    fm.push('draft: true');
    fm.push('---');
    fm.push('');
    fm.push(`<!-- Source: ${SOURCES[state.source].label}${state.sourceDetail.trim() ? ' — ' + state.sourceDetail.trim() : ''} -->`);
    fm.push(`<!-- Tone: ${resolvedTone()} · Audience: ${c.audience} · Target: ${LENGTHS[state.length].range} -->`);
    fm.push('');
    fm.push('TODO — opening: the reader\'s problem in concrete terms, no throat-clearing.');
    fm.push('');
    fm.push('## TODO — first point');
    fm.push('');
    fm.push('## TODO — second point');
    fm.push('');
    fm.push('## Close');
    fm.push('');
    fm.push(state.cta.trim() || 'TODO — one specific next step.');
    fm.push('');
    return fm.join('\n');
  }

  function downloadDraft() {
    const name = `${today()}-${slugify(state.title)}.md`;
    const blob = new Blob([buildDraft()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function copyText(text, btn) {
    const done = () => { const o = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* no-op */ }
    document.body.removeChild(ta);
  }

  // --- Shared UI builders ---
  function heading(root, q, help) {
    const h = document.createElement('div');
    h.className = 'q';
    h.textContent = q;
    root.appendChild(h);
    if (help) {
      const p = document.createElement('div');
      p.className = 'q-help';
      p.textContent = help;
      root.appendChild(p);
    }
  }

  function textField({ label, value, ph, on, optional, textarea }) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const id = 'f_' + Math.random().toString(36).slice(2, 8);
    const lab = document.createElement('label');
    lab.setAttribute('for', id);
    lab.innerHTML = esc(label) + (optional ? ' <span class="opt">(optional)</span>' : '');
    const input = document.createElement(textarea ? 'textarea' : 'input');
    if (!textarea) input.type = 'text';
    input.id = id;
    input.value = value;
    input.placeholder = ph || '';
    input.addEventListener('input', (e) => on(e.target.value));
    wrap.appendChild(lab);
    wrap.appendChild(input);
    return wrap;
  }

  function validAngle() {
    if (state.title.trim().length === 0) return false;
    const src = SOURCES[state.source];
    if (src && src.detail) return state.sourceDetail.trim().length > 0;
    return true;
  }

  // --- Navigation / chrome ---
  function renderRail() {
    els.rail.innerHTML = '';
    STEPS.forEach((_, i) => {
      const seg = document.createElement('div');
      seg.className = 'seg' + (i < step ? ' done' : i === step ? ' active' : '');
      els.rail.appendChild(seg);
    });
  }

  function renderNav(root) {
    const s = STEPS[step];
    const actions = document.createElement('div');
    actions.className = 'actions';

    if (step > 0) {
      const back = document.createElement('button');
      back.className = 'btn btn-ghost';
      back.textContent = '← Back';
      back.addEventListener('click', () => { step--; activeTab = 'brief'; refresh(); });
      actions.appendChild(back);
    }

    if (!s.isReview) {
      const next = document.createElement('button');
      next.className = 'btn btn-primary';
      next.id = 'nextBtn';
      next.textContent = step === STEPS.length - 2 ? 'Assemble brief →' : 'Continue →';
      next.disabled = !s.valid();
      next.addEventListener('click', () => { if (STEPS[step].valid()) { step++; refresh(); } });
      actions.appendChild(next);
    } else {
      const restart = document.createElement('button');
      restart.className = 'btn btn-primary';
      restart.textContent = 'Start another post';
      restart.addEventListener('click', () => resetAll());
      actions.appendChild(restart);
    }
    root.appendChild(actions);
  }

  function updateNav() {
    const btn = document.getElementById('nextBtn');
    if (btn) btn.disabled = !STEPS[step].valid();
  }

  function refresh() {
    const s = STEPS[step];
    els.kicker.textContent = `${s.kicker}`;
    els.count.textContent = s.isReview ? 'Review' : `${step + 1} / ${STEPS.length - 1}`;
    renderRail();
    els.card.innerHTML = '';
    s.render(els.card);
    renderNav(els.card);
  }

  function resetAll() {
    Object.assign(state, {
      source: null, sourceDetail: '', campaign: null, title: '', primaryKeyword: '',
      supportingKeywords: '', tone: 'auto', length: 'standard', cta: '',
    });
    step = 0; activeTab = 'brief';
    refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  refresh();
})();
