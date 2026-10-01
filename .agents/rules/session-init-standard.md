# Session Initialization & Agentic Hub Operating Standard

> **MANDATORY PROTOCOL:** Run on every agent session start across Antigravity, Claude Code, Codex, and Hermes.

---

## 1. Step 0: Pre-Flight Health & Ingress Check
Before generating plans, proposing changes, or mutating campaigns, every agent must execute the deterministic hub check:

```bash
bash scripts/test-remote-hub.sh
```

**Passing Invariants:**
1. **BuzzBar Health (`127.0.0.1:7070/health`):** HTTP 200, circuit breaker `CLOSED`.
2. **n8n Container Ingress (`127.0.0.1:5678/webhook/kolake-marketing`):** HTTP 200, response latency <200ms.
3. **Container-to-Host Route:** n8n successfully connects to `http://172.17.0.1:7070/health`.

---

## 2. Invariant Enforcement
- **Property Name:** **Ko Lake Villa** (lakeside villa — **never** an "estate", "resort", or "hotel").
- **Yield Law:**
  - Villa Buyout: Floor **$250 / night** (Emergency same-day: **$180 / night**).
  - Last-minute rooms: Floor **$45 / night**.
- **Four-Eyes Approval Gate:**
  - Any ad mutation, negative keyword injection, or auction bid acceptance requires an action token (`ACT-XXXXXX`) unexpired with 2h TTL.
  - Mutations execute only upon explicit human `/approve ACT-XXXXXX` on BuzzBar (`#marketing-kolake` / `#KoLake Auction`).
- **Tokenless Core:**
  - Zero plaintext secrets (`sk-`, `EAA`, Bearer tokens) in Git-tracked repositories.
  - Outbound credentials live exclusively in runtime vaults (`/root/buzz-bar/.env` 0600 on Hermes-Dev).

---

## 3. Truth Test Verification
Prior to ending any task or committing changes:
```bash
node tests/integration-hub-truth.mjs
npm test
```
All tests must pass at 100%.
