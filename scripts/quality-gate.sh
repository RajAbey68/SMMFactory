#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════"
echo "  🏗️  QUALITY GATE — SMMFactory"
echo "═══════════════════════════════════════════"

FAILED=0

echo "📋 Step 1/4: Validate JSON configs..."
for f in package.json storage.config.json; do
  python3 -m json.tool "$f" > /dev/null 2>&1 && echo "   ✅ $f OK" || { echo "   ❌ $f invalid"; FAILED=1; }
done

echo "📂 Step 2/4: Directory structure..."
for dir in research creative landing-page campaigns; do
  [ -d "$dir" ] && echo "   ✅ $dir/" || { echo "   ❌ $dir/ missing"; FAILED=1; }
done

echo "📄 Step 3/4: Blueprint check..."
[ -f "marketing-studio.agy" ] && echo "   ✅ Blueprint found" || { echo "   ❌ Blueprint missing"; FAILED=1; }

echo "🧪 Step 4/5: Truth tests..."
if [ -f "tests/truth-tests.mjs" ]; then
  node tests/truth-tests.mjs || FAILED=1
else
  echo "   ❌ Truth test suite missing (tests/truth-tests.mjs)."
  FAILED=1
fi

if [ -f "tests/claude-console-truth.mjs" ]; then
  node tests/claude-console-truth.mjs || FAILED=1
else
  echo "   ❌ Console truth tests missing (tests/claude-console-truth.mjs)."
  FAILED=1
fi

echo "🛡️  Step 5/5: Independent Third-Party Drift & Governance Audit..."
node -e "
import('./tools/third-party-auditor.mjs').then(({ ThirdPartyAuditor }) => {
  const auditor = new ThirdPartyAuditor();
  const res = auditor.auditRegisteredCampaigns();
  if (!res.all_passed) {
    console.error('   ❌ Third-party drift detected in registered campaigns:');
    console.error(JSON.stringify(res.reports, null, 2));
    process.exit(1);
  }
  console.log('   ✅ Zero drift detected across all ' + res.campaigns_audited + ' registered campaigns.');
}).catch(err => {
  console.error('   ❌ Auditor execution error:', err.message);
  process.exit(1);
});
" || FAILED=1

echo ""
[ $FAILED -eq 0 ] && echo "  ✅ ALL GATES PASSED (INCLUDING THIRD-PARTY AUDIT)" || echo "  ❌ GATE FAILED"
exit $FAILED
