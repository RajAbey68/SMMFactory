---
description: Run AI Intelligence Analyst — OpenAI-powered competitive analysis with Hormozi scoring
---

// turbo-all

1. Run the AI Intelligence Analyst against latest scan data.
OPENAI_API_KEY=${OPENAI_API_KEY} node scripts/ai-intelligence-analyst.mjs

2. Show analysis highlights.
python3 -c "
import json, os
f = 'research/ai_analysis.json'
if os.path.exists(f):
    data = json.load(open(f))
    print(f'🧠 AI Analysis — {data.get(\"property\", \"Unknown\")}')
    print(f'   Model: {data.get(\"model_used\", \"?\")}')
    print()
    # SWOT count
    swot = data.get('competitor_swot', [])
    print(f'   📊 Competitors analyzed: {len(swot)}')
    for c in swot:
        print(f'      • {c[\"name\"]}: {len(c.get(\"strengths\",[]))}S / {len(c.get(\"weaknesses\",[]))}W / {len(c.get(\"opportunities\",[]))}O / {len(c.get(\"threats\",[]))}T')
    print()
    # Hook scores
    hooks = data.get('hook_scores', [])
    print(f'   🪝 Hook Scores (Hormozi Value Equation):')
    for h in sorted(hooks, key=lambda x: x.get('hormozi_score',0), reverse=True)[:5]:
        print(f'      {h.get(\"hormozi_score\",\"?\")}/10 — {h.get(\"hook\",\"?\")}')
    print()
    # Budget
    budget = data.get('budget_recommendations', {})
    print(f'   💰 Budget: \${budget.get(\"total_daily\",\"?\")}/day')
    alloc = budget.get('allocation', {})
    for k,v in alloc.items():
        print(f'      • {k}: \${v}')
    print()
    # ChatGPT Ads
    cga = data.get('chatgpt_ads_assessment', {})
    if cga:
        print(f'   💬 ChatGPT Ads: {cga.get(\"relevance_score\",\"?\")}/10 — {cga.get(\"recommendation\",\"?\")}')
    print()
    meta = data.get('_metadata', {})
    print(f'   ⏱  Generated: {meta.get(\"generated_at\",\"?\")} ({meta.get(\"elapsed_seconds\",\"?\")}s)')
    print(f'   🔢 Tokens: {meta.get(\"tokens_used\",{}).get(\"total\",\"?\")}')
else:
    print('⚠️  No analysis yet. Run step 1 first.')
"

3. Check if market_dna.json needs updating with AI insights.
python3 -c "
import json, os
analysis_path = 'research/ai_analysis.json'
dna_path = 'research/market_dna.json'
if os.path.exists(analysis_path) and os.path.exists(dna_path):
    analysis = json.load(open(analysis_path))
    dna = json.load(open(dna_path))
    dna['ai_analysis_date'] = analysis.get('_metadata', {}).get('generated_at', 'unknown')
    dna['ai_strategic_summary'] = analysis.get('strategic_summary', '')[:500]
    dna['ai_budget_recommendation'] = analysis.get('budget_recommendations', {})
    dna['chatgpt_ads_assessment'] = analysis.get('chatgpt_ads_assessment', {})
    json.dump(dna, open(dna_path, 'w'), indent=2)
    print('✅ market_dna.json enriched with AI analysis metadata')
else:
    print('⚠️  Missing files. Need both ai_analysis.json and market_dna.json.')
"
