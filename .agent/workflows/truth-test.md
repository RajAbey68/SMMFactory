---
description: Run truth tests to verify workspace integrity
---

// turbo-all

1. Validate storage config is well-formed JSON.
python3 -m json.tool storage.config.json > /dev/null && echo "✅ storage.config.json valid" || echo "❌ storage.config.json invalid"

2. Validate package.json is well-formed.
python3 -m json.tool package.json > /dev/null && echo "✅ package.json valid" || echo "❌ package.json invalid"

3. Check all required directories exist.
for dir in research creative landing-page campaigns; do [ -d "$dir" ] && echo "✅ $dir/" || echo "❌ $dir/ missing"; done

4. Run the truth test suite (when available).
npx tsx tests/truth-tests.ts
