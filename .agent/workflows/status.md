---
description: Quick workspace health check — verify all scaffold components are in place
---

// turbo-all

1. Check directory structure.
echo "=== Directory Structure ===" && find . -maxdepth 2 -type d | grep -v node_modules | grep -v .git | sort

2. Validate all JSON configs.
for f in package.json storage.config.json; do echo -n "$f: " && python3 -m json.tool "$f" > /dev/null 2>&1 && echo "✅ valid" || echo "❌ invalid"; done

3. Check blueprint exists and has frontmatter.
[ -f marketing-studio.agy ] && echo "✅ Blueprint found" || echo "❌ Blueprint missing"

4. Show storage config summary.
python3 -c "import json; c=json.load(open('storage.config.json')); print(f'Strategy: {c[\"strategy\"]}'); [print(f'  {k}: {v.get(\"description\",\"\")}') for k,v in c['tiers'].items()]"
