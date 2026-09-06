---
description: Standard session initialization — verify Hermes-Dev hub, BuzzBar, and run truth tests
---

# Session Initialization Workflow

Execute this workflow at the start of any work session:

// turbo
1. Run the remote integration health check:
```bash
bash scripts/test-remote-hub.sh
```

2. Run the deterministic integration hub truth suite:
```bash
node tests/integration-hub-truth.mjs
```

3. Run the full repository quality gate:
```bash
npm test
```

4. Confirm Ground-Truth invariants:
- Property name: "Ko Lake Villa" (lakeside villa)
- Price floors: $250 buyout / $45 room / $180 emergency
- Four-Eyes approval gate active for all mutations (`/approve ACT-XXX`)
