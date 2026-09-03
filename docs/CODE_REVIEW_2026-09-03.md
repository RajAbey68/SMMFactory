# SMMFactory — Code Review and Agentic Recommendations

Date: 3 September 2026
Scope: `~/code/SMMFactory` (165 files, ESM Node scripts) plus every sibling project in `~/code`
Method: two independent review passes (code review; cross-repo survey), then a critical-thinking pass on the recommendations. Evidence is cited as `file:line`.

---

## 1. The short answer

SMMFactory is not at its best. It is a well-documented paid-ads scaffold where most of the "integrations" are theatre, the approval gate can be forged from the repo itself, and there is no lead-finding, social-listening or community-monitoring capability at all. It is also not the right base to "move" to an agentic architecture — it is a set of loose scripts with JSON files for state and no orchestrator.

The good news: the pieces you need for the lead pipeline already exist across your other repos. The bus (block-buzz), a working scout → score → draft → four-eyes loop (AutumnHarvest), a real WhatsApp/Telegram channel (WhatToDo), a RAG over all your NotebookLM material (notebook-rag), and Ko Lake's grounded knowledge base (kolake-escape-portal). None of them talk to each other yet, and every Buzz client you have written so far speaks the wrong Nostr dialect.

Recommendation in one line: don't rebuild SMMFactory. Freeze it as the paid-ads repo, delete the fake parts, and build a new, small `lead-forager` service that uses SMMFactory only for its three production-grade pieces (SEO clients, grounding validator, security scrubber).

Note on "Glockbox": that name appears nowhere in your code or on the web. Reading it as a dictation of **GrokBot** (your `.agents/rules/buzz_warp_governance.md` says "Buzz first, GrokBot second") — Con as switchboard. If you meant Gravity Claw (WhatToDo) or something else, tell me and section 5 adjusts.

---

## 2. What is real and what is not

Verified by running the code, not just reading it.

**Real network calls with real auth**

- Meta Ads direct deploy — `scripts/deploy-kolake-meta.mjs:62-78`. Creates and activates campaigns. Has been run live (registry carries real IDs, `campaigns/registry.json:214-219`). Has an `--emergency-bypass` flag that skips the approval gate (`:41`).
- Telegram reports — `scripts/report-telegram.mjs:107,130`. Real channel, but the payload is a hardcoded fake telemetry object (`:30-56`, `spend_usd: 128.50`, `roas: 30.8x`).
- Windsor.ai — `scripts/windsor-mcp-client.mjs:26`. Works, with the bearer key committed in three places (see §4).
- SEMrush / SE Ranking — `scripts/semrush-client.mjs`, `seranking-client.mjs`, `seo-retry.mjs`, `seo-schema.mjs`. Injectable fetch, retry taxonomy, canonical schema. This is the best code in the repo and the template to copy.
- AI analyst — `scripts/ai-intelligence-analyst.mjs:85-111`. Real OpenAI/Anthropic/Gemini calls; but it reads only root `research/`, not per-campaign output.
- n8n dispatch, Linear sync, Hook Studio (ffmpeg) — real but each has a defect (no auth header; `teamKey` passed as `teamId` at `tools/linear-sync.mjs:64` so the live path fails; shell injection in Hook Studio).

**Theatre — no I/O, canned data, labelled "live"**

- `tools/openclaw/meta-client.mjs` builds a payload and never sends it (`:34-43`); returns `impressions: 14250` (`:120-131`).
- `google-client.mjs`, `linkedin-client.mjs`, `tiktok-client.mjs`, `openai-ads-client.mjs` — zero network calls. OpenAI Ads is an API that does not exist.
- `tools/adspyder-monitor.mjs` returns fixed hooks for any domain; `mcp_config.json:21-28` references an npm package that does not exist.
- `tools/gcs-asset-manager.mjs` "uploads" by hashing the file; "signed URLs" are random hex (`:57`) and will 403.
- `scripts/extract-market-dna.mjs` (Spyder) is hardcoded Ko Lake data and crashes on run — wrong call signature at `:37` vs `spyder-recovery.mjs:106`.
- `generate-ad-copy.mjs` (Pomelli) — four hardcoded variants, no LLM.
- `third-party-review.mjs` and `adversarial-red-team-review.mjs` — static JSON with `confidence_score: 0.96`. These masquerade as independent audits. `getGitSummary()` returns constants.
- `retrospective-engine.mjs`, `close-campaign.mjs` write default spend/revenue (`1250 / 6800`) into `registry.json` and `retrospective.md` as if measured.
- `kolake-analytics-bot.mjs` invents "baseline telemetry" when no token is present; the live branch returns raw API JSON the renderers then crash on.
- BuzzBar: `deploy-campaign.mjs:167-198` opens one WebSocket, fires one unsigned JSON message, ignores errors. `register-buzz-bot.mjs` writes a persona into the Buzz desktop's `managed-agents.json` with an empty `agent_command` — a prompt, not an agent.

Net: the only path that touches a real ad platform is the standalone Meta script. Everything routed through `deploy-campaign.mjs → tools/openclaw/*` is a dry run that calls itself live, and `registry.json:230-250` carries fabricated results (38,604 impressions, 108 leads) as fact.

---

## 3. Architecture

- No orchestrator, scheduler, queue or state machine. Phases in `registry.json` are emoji strings parsed by regex in `dashboard/dashboard.js:45-52`. Only `close-campaign.mjs` ever transitions a phase.
- State is flat JSON written with `fs.writeFileSync` — no locking, no atomic rename, no schema on write. Two processes will clobber each other. Schema drift already present (`paid_media` vs `paid-media`).
- The BMAD role matrix in `AGENTS.md` maps roles to files, not to anything that runs. `.agent/workflows/*.md` and `marketing-studio.agy` are prompt files, not a runtime.
- Four-eyes is enforced in exactly two places: `deploy-campaign.mjs:49` and `deploy-kolake-meta.mjs:52` (bypassable). `review-engine/` is not an approval gate — it is a guest review-solicitation CRUD app. `AGENTS.md:39` and `docs/bmad-architecture.md:33` describe it wrongly. Its `public/index.html` does not exist, so `npm test` fails at `truth-tests.mjs:255`.
- The "cryptographic sign-off" is HMAC-SHA256 with a hardcoded default secret `'smm-four-eyes-vault-secret'` (`tools/approval-signer.mjs:15,49`). Anyone with the repo can mint approvals. Worse: `npm test` mints one (`truth-tests.mjs:669-673`), and the committed `campaigns/ko-lake-retreats/approval_record.json` is that test artefact. The gate is vacuous.
- GitHub `production` environment (`deploy_ads.yml:140`) is the only real human gate and it only gates a landing-page upload, never ad spend. CI is broken anyway: `npm ci` with no lockfile (`:37`), `landing-page/dist` never built.

---

## 4. Security and bugs (fix regardless of the agentic work)

1. Secrets committed: Windsor bearer token in `mcp_config.json:33`, `scripts/windsor-mcp-client.mjs:6`, `campaigns/ko-lake-reverse-auction/kolake_n8n_workflow.json:38`; Supabase URL + anon JWT in `scripts/register-buzz-bot.mjs:63-64`. `.env` (gitignored, but present) holds what look like live Twilio and Telegram credentials. Rotate all four today.
2. Approval forgery (above). Require `FOUR_EYES_SECRET` from env and fail closed; better, one Ed25519 key per approver; delete the self-signing test; drop `--emergency-bypass`.
3. Shell injection: `creative/hook-studio/server.mjs:334-345` interpolates `hookText` into `execSync`. Path traversal via `images[i]` (`:251`, `:425`). CORS `*` on a localhost server means any website you visit can drive it. Same CORS `*` on the review engine, which stores guest names, emails and WhatsApp numbers in plain JSON.
4. Live deploy creates ad sets `ACTIVE` immediately with no budget-cap check (`deploy-kolake-meta.mjs:134,170,179`), and the gate checks the wrong campaign's DNA (`:49-52`).
5. `deploy-campaign.mjs:154-159` swallows adapter errors and still records `DISPATCHED_TO_API`. The ChatGPT adapter always fails on a field-name mismatch (`title/body` vs `headline/proof_points`).
6. `security-scrubber.mjs`: global regex with `.test()` retains `lastIndex` and alternates true/false; token patterns miss the exact credential types leaked in this repo.
7. Tests: 104 "truth tests", roughly 40% are `content.includes('export class X')`. They mutate repo state and open a socket to buzz.xyz on every run. Five vitest files (57 cases) never run — no config, not in `npm test`. eslint/tsx/typescript/prettier are dead devDependencies.
8. Hardcoded plain-HTTP infra (`167.233.236.178`) and `/Users/rajabey/...` paths in scripts.

---

## 5. Target architecture: Lead Forager

Purpose: agents watch a set of "rooms", find posts where a helpful reply would raise awareness of Ko Lake Villa or of Asimov AI / UTS Global, research and qualify the lead, draft the reply, and hand it to you to approve and post. Buzz is the bus and audit trail; GrokBot/Con is the switchboard; you are the only thing that posts to a logged-in surface (your own rule, `kolake-escape-portal/CLAUDE.md:94`).

```
 sources ──► listener ──► lead store ──► qualifier ──► researcher ──► drafter ──► HITL gate ──► you post
 (Reddit,    (poll +     (Supabase,     (LLM score   (notebook-rag  (LLM +      (Buzz 👍 /     (deep link +
  TripAdv,    cursor,     lifecycle      0-5 +        + concierge    grounding   Telegram/      copy-ready
  FB groups,  dedupe,     states)        rationale)   knowledge)     + scrub)    WhatsApp)      text)
  LinkedIn,   scrub)
  Buzz rooms)
                                    every step = signed kind:9 event in a Buzz channel per brand
```

**Lead lifecycle (enumerated, not emoji strings):**
`discovered → qualified | rejected → researched → drafted → awaiting_approval → approved | edited | declined → posted → replied → converted`

**Two brands, two pipelines, one framework.** Ko Lake leads live in travel rooms (r/srilanka, r/solotravel, TripAdvisor Sri Lanka forum, "Sri Lanka travel" Facebook groups, surf/yoga retreat groups). Asimov/UTS leads live in LinkedIn, HN, r/artificial, AI-governance Slack/Discord communities. Different sources, different rubric, different persona. Build Ko Lake first — the intent signal ("7 of us, south coast, December, villa with pool?") is far cleaner than "someone worrying about agent risk".

**Component mapping — what to reuse and from where**

| Layer | Reuse | Path | Effort |
|---|---|---|---|
| Bus / audit / approval reaction | Buzz relay + `buzz` CLI + workflow engine (`reaction_added` → `call_webhook`) | `block-buzz/crates/{buzz-relay,buzz-cli,buzz-workflow}`, `NOSTR.md` | S — shell out to `buzz` from Node; or the stdio MCP already decided (`~/.buzz/REPOS/buzz-mcp`) |
| Correct bot protocol | port `examples/countdown-bot/src/main.rs` (AUTH → self-add → subscribe → reply) to ~200 lines of nostr-tools TS | `block-buzz/examples/countdown-bot/`, `crates/buzz-sdk/src/nip_oa.rs` | M |
| Supervisor loop | `AHGSupervisor`: Buzz command → scout → scorer → FourEyesGate → post back | `AutumnHarvest/src/agents/{supervisor,scout,outreach}.py` | M — swap the job rubric for a lead rubric |
| Qualifier | `RajivJobScorer` (Claude, 0-5 + rationale) | `AutumnHarvest/src/scoring/job_scorer.py` | S |
| HITL ledger | `FourEyesGate.stage_for_review / approve_record / record_outcome` on `agent_execution_log` | `AutumnHarvest/src/utils/verification_gate.py`, `migrations/004`, `scripts/approve_staged.py` | S |
| Research | hierarchical RAG over 90 NotebookLM notebooks | `notebook-rag/src/hier_rag.py` → `last_context.md` | S |
| Ko Lake facts | `concierge_knowledge` table + `MASTER_PROPERTY_DICTIONARY.json` + price floors | `kolake-escape-portal/supabase/functions/ko-villa-agent`, `SMMFactory/MASTER_PROPERTY_DICTIONARY.json` | S |
| Draft guard | closed-vocabulary grounding + injection/secret scrub | `SMMFactory/scripts/validate-grounding.mjs`, `tools/security-scrubber.mjs` (after the regex fix) | S |
| Push to your phone | Telegram (grammY) and WhatsApp (Baileys) channels | `WhatToDo/src/channels/{TelegramChannel,WhatsAppChannel}.ts` | M — Telegram first; Baileys risks your WhatsApp number |
| Dedup ("already engaged this thread") | pgvector store | `AutumnHarvest/src/memory/vector_store.py` | S |
| Scheduled scans | HMAC webhook → GCS queue → Cloud Run job; or n8n schedule | `kolake-escape-portal/supabase/functions/agent-enqueue`, `AutumnHarvest/n8n/*.json` | M |
| Reply-prompt A/B | evaluator harness once wired to a real model | `prompt-leaderboard/src/evaluator.py` | M, later |
| Retry / rate limiting / schema pattern | SEO client trio | `SMMFactory/scripts/{seo-retry,rate-limiter,seo-schema}.mjs` | S |

**Must be written new:** the source listeners. Nothing in any repo scrapes or subscribes to communities. Reddit (OAuth, `/r/{sub}/new` + search, PRAW or plain fetch), TripAdvisor/Lonely Planet forums (RSS/scrape), Google Alerts RSS, X v2 filtered stream, and Buzz rooms themselves (kind:9 subscription per channel). Facebook groups and LinkedIn have no usable API for this — the listener there is you, once a day, with the agent drafting from a pasted URL. Each listener needs cursor persistence, dedupe and rate-limit handling; copy the SEO client shape.

**Where GrokBot/Con fits:** switchboard. Raj → Con → `#marketing-kolake` / `#AHG_Forager` channels. The forager posts each drafted lead as a kind:9 message with the source link, the score, the rationale and the draft. A 👍 from you fires the Buzz workflow webhook that marks it `approved` and sends you the copy-ready text plus deep link on Telegram. A 👎 records `declined` with an optional reason, which feeds the rubric. This is native to Buzz (`crates/buzz-workflow/src/schema.rs`), needs no new UI, and gives a signed audit trail per lead for free.

---

## 6. Critical review of the plan (devil's advocate pass)

Framework: pre-mortem plus load-bearing-assumption test, applied to a plan/strategy.

Steelman: you have the bus, the loop, the RAG and the channels already; wiring them is weeks not months; every lead gets a signed record; you stay the only human hand on any platform, so ToS and Superhost risk stay low.

Where it breaks:

1. **Load-bearing assumption — that the rooms will tolerate the replies.** Most travel subreddits and Facebook groups ban self-promotion; a villa owner answering "any villa near Galle?" with his own villa gets removed and, repeated, banned. The pipeline only works if the drafts are useful first and promotional second (answer the question fully, mention Ko Lake once, no link unless asked). Bake that into the rubric and the drafter, and track removal rate as a kill metric.
2. **Thin funnel.** How many posts a month match "group of 10+, south coast Sri Lanka, dates, villa"? Possibly 20–40 across all sources. That is fine for a human-in-the-loop system but it means the ROI ceiling is modest. The Asimov/UTS side is thinner still and harder to detect. Set the expectation: this is an awareness and inbound trickle, not a booking engine. Run it 60 days, count posted replies → enquiries → bookings, then decide.
3. **Three languages, four half-finished repos.** Rust (block-buzz), Python (AutumnHarvest, notebook-rag), TypeScript (WhatToDo, buzz-bar), Node ESM (SMMFactory). Reusing all of them by import is a trap. Reuse by *process boundary*: `buzz` CLI, `hier_rag.py` CLI, a Python forager, a Telegram notifier — each callable as a subprocess or webhook. Pick Python as the forager language because the supervisor/scorer/gate already exist there.
4. **Every existing Buzz client is wrong.** `GrokBuzzAgent.ts` and `buzz_websocket.py` send unsigned kind:1 events with `#t` tags and never answer NIP-42 AUTH. Until one correct client exists, nothing will actually post to the relay. This is the first ticket, not the tenth. Cheapest route: use the `buzz` CLI (NIP-98 signed HTTP) from the forager and skip websockets entirely.
5. **WhatsApp via Baileys is a ban risk** on your own number, which is also your guest channel. Use Telegram for approval pushes; keep WhatsApp for reading exported group chats only.
6. **Reusing SMMFactory's approval signer as-is imports its flaw.** Do not carry the hardcoded HMAC secret across. The Buzz reaction is already a signed event from your key — that is the approval; the ledger row just references the event id.
7. **Scope creep.** "Multiple rooms, two businesses, research, qualify, draft, approve, post" is six subsystems. Ship the thinnest slice: one source (Reddit r/srilanka + r/solotravel), one brand (Ko Lake), Telegram approval, you post. Add Buzz channels once that produces its first approved reply.

Verdict: the plan is sound in shape and wrong in sequence. About 70% it produces a useful lead trickle for Ko Lake within 60 days if built thin; below 40% if you try to lift SMMFactory into it or build both brands at once. The uncertainty that matters most is item 1 — community tolerance — and only a live trial resolves it.

---

## 7. What to do, in order

1. **Today — security.** Rotate Windsor, Supabase anon key, Twilio, Telegram. Purge the committed values. Add gitleaks to `.githooks/pre-commit` (it currently only validates JSON).
2. **This week — honesty pass on SMMFactory.** Make `tools/openclaw/*` throw `NotImplemented` when `isLive`; strip fabricated metrics from `registry.json`, `retrospective.md`, the two fake audit scripts; fix or delete the broken CI; make `npm test` stop writing to `campaigns/` and stop opening sockets. Rewrite `AGENTS.md` so it describes what runs. Keep the SEO clients, grounding validator, scrubber (fixed), and the Meta deploy script (gate made real, bypass removed).
3. **Week 1–2 — one correct Buzz client.** Either adopt the `buzz` CLI via the stdio MCP already decided, or port `countdown-bot` to TS. Prove it by posting one signed kind:9 into `#marketing-kolake` from a script and reacting to it.
4. **Week 2–3 — Lead Forager v0 (Python, in a new repo `lead-forager`).** Reddit listener → Supabase `leads` table with the lifecycle enum → `RajivJobScorer` re-rubriced for Ko Lake → `hier_rag.py` context → Claude draft → grounding + scrub → Telegram push with approve/edit/decline buttons → you post. Log every state change as a Buzz message.
5. **Week 4–6 — measure.** Target: 10 approved replies. Track removal rate, enquiries via a UTM'd kolakevilla.com link, and your time per approval. Kill or expand on the numbers.
6. **Then — second source, second brand.** Add TripAdvisor/Google Alerts, then the Asimov/UTS rubric on LinkedIn/HN with you as the listener (paste URL → agent drafts).

Four-eyes for the build itself: Cursor cloud agent writes, a third-party model reviews (your existing default flow), you approve only the merges that touch keys, posting, or budgets.

---

## Appendix — sibling project maturity at a glance

| Project | What | State | Keep for |
|---|---|---|---|
| block-buzz | Fork of Block's buzz v0.5.18 + your `buzz-bar` Linear bridge | working, active | the bus, CLI, workflows, countdown-bot reference |
| AutumnHarvest | job-hunt forager (Python, Supabase, Claude) | working core | supervisor, scorer, FourEyesGate, vector dedup |
| WhatToDo / Gravity Claw | multi-channel agent (TS, SQLite, Baileys, grammY) | channels work, agent core scaffold | Telegram/WhatsApp channels, provider abstraction |
| notebook-rag | hierarchical RAG over NotebookLM | working | lead research |
| kolake-escape-portal | kolakevilla.com + edge functions | live | concierge knowledge, GBP posting, job queue |
| WhatHappen | WhatsApp export analyser | partial, `lib/` missing | MoE triage pattern, export parsers |
| prompt-leaderboard | prompt eval (simulated model) | scaffold | later A/B of reply prompts |
| AsimovBMAD | governance docs | docs only | maker/checker policy |
| nextgen / nextstay / Scrimper | schemas / receipts | scaffold | nothing for this |
