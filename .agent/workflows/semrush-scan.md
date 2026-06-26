---
description: Run SEMrush SEO + PPC intelligence scan and write seo_intel.json
---

// turbo-all

1. Pull SEMrush SEO + PPC intelligence for the campaign target domain.
SEMRUSH_API_KEY=${SEMRUSH_API_KEY} node scripts/semrush-scan.mjs --campaign ko-lake-retreats

2. Show the top organic keywords and competitor PPC keywords found.
python3 -c "
import json, os
f = 'campaigns/ko-lake-retreats/research/seo_intel.json'
if os.path.exists(f):
    data = json.load(open(f))
    org = data.get('top_organic_keywords', [])[:10]
    paid = data.get('top_paid_keywords', [])[:10]
    print(f'📈 Organic keywords: {len(data.get(\"top_organic_keywords\", []))} | 💰 Paid keywords: {len(data.get(\"top_paid_keywords\", []))}')
    for k in org:
        print(f'  • {k.get(\"keyword\",\"?\")} — pos {k.get(\"position\",\"?\")} | vol {k.get(\"search_volume\",\"?\")} | KD {k.get(\"difficulty\",\"?\")}')
else:
    print('⚠️  No seo_intel.json yet. Check SEMRUSH_API_KEY (needs the API-units add-on) and connectivity.')
"

3. Feed SEO intelligence into the AI Intelligence Analyst for gap analysis + proof-based ad copy.
node scripts/ai-intelligence-analyst.mjs
