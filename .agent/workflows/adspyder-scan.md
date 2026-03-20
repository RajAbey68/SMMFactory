---
description: Run AdSpyder competitive intelligence scan and merge into market DNA
---

// turbo-all

1. Pull latest competitor ads for tracked keywords.
ADSPYDER_API_KEY=${ADSPYDER_API_KEY} npx adspyder-mcp-server scan --keywords-file research/adspyder_config.json --output research/competitor_intel/latest_scan.json

2. Show top competitor ad headlines.
python3 -c "
import json, os
f = 'research/competitor_intel/latest_scan.json'
if os.path.exists(f):
    data = json.load(open(f))
    ads = data.get('ads', [])[:10]
    print(f'📊 Found {len(data.get(\"ads\",[]))} competitor ads')
    for a in ads:
        print(f'  • [{a.get(\"network\",\"?\")}] {a.get(\"headline\",\"N/A\")} — est. \${a.get(\"est_spend\",\"?\")}/mo')
else:
    print('⚠️  No scan results yet. Check API key and connectivity.')
"

3. Merge competitor insights into market_dna.json.
python3 -c "
import json, os
dna_path = 'research/market_dna.json'
scan_path = 'research/competitor_intel/latest_scan.json'
if os.path.exists(scan_path):
    dna = json.load(open(dna_path))
    scan = json.load(open(scan_path))
    dna['competitor_insights'] = scan.get('ads', [])[:20]
    dna['competitor_scan_date'] = scan.get('scan_date', 'unknown')
    json.dump(dna, open(dna_path, 'w'), indent=2)
    print(f'✅ Merged {len(dna[\"competitor_insights\"])} competitor insights into market_dna.json')
else:
    print('⚠️  No scan to merge. Run step 1 first.')
"
