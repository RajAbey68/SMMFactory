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

echo "🧪 Step 4/4: Truth tests..."
if [ -f "tests/truth-tests.ts" ]; then
  npx tsx tests/truth-tests.ts || FAILED=1
else
  echo "   ⚠️  No truth tests yet (tests/truth-tests.ts). Skipping."
fi

echo ""
[ $FAILED -eq 0 ] && echo "  ✅ ALL GATES PASSED" || echo "  ❌ GATE FAILED"
exit $FAILED
