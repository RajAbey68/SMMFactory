---
description: Pre-deploy verification gate - full quality gate
---

// turbo-all

1. Run the full quality gate (config validation → structure check → truth tests).
bash scripts/quality-gate.sh

2. If all steps pass, report ready to deploy. If any fail, report errors and fix them.
