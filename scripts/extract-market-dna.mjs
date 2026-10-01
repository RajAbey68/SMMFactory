#!/usr/bin/env node
// scripts/extract-market-dna.mjs — Spyder Market DNA & Competitor Intel Extraction Agent
// Usage: node scripts/extract-market-dna.mjs --domain kolakevilla.com --competitors 3 --campaign ko-lake-retreats

import fs from 'node:fs';
import path from 'node:path';
import { validateMarketDna } from '../tools/market-dna-schema.mjs';
import { spyderWithRecovery } from './spyder-recovery.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    domain: 'kolakevilla.com',
    competitors: 3,
    campaign: 'ko-lake-retreats',
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) options.domain = args[++i];
    else if (args[i] === '--competitors' && args[i + 1]) options.competitors = parseInt(args[++i], 10);
    else if (args[i] === '--campaign' && args[i + 1]) options.campaign = args[++i];
    else if (args[i] === '--output' && args[i + 1]) options.output = args[++i];
  }

  return options;
}

export async function extractMarketDna(options = {}) {
  const domain = options.domain || 'kolakevilla.com';
  const campaign = options.campaign || 'ko-lake-retreats';
  const targetOutput = options.output || path.join('campaigns', campaign, 'research', 'market_dna.json');

  console.log(`[Spyder] Extracting Market DNA for ${domain} (Campaign: ${campaign})...`);

  // Use spyderWithRecovery wrapper
  const result = await spyderWithRecovery(
    async () => {
      // 1. Check if campaign market_dna already exists
      if (fs.existsSync(targetOutput)) {
        const existing = JSON.parse(fs.readFileSync(targetOutput, 'utf-8'));
        return existing;
      }

      // 2. Load Master Property Dictionary for ground truth
      const masterDictPath = path.resolve('MASTER_PROPERTY_DICTIONARY.json');
      let masterDict = null;
      if (fs.existsSync(masterDictPath)) {
        masterDict = JSON.parse(fs.readFileSync(masterDictPath, 'utf-8'));
      }

      return {
        property: masterDict?.property_identity?.official_name || "Ko Lake Villa",
        url: `https://${domain}`,
        location: "Koggala / Ahangama, Sri Lanka",
        brand: {
          colors: {
            primary: "#1B5E20",
            secondary: "#1565C0",
            accent: "#FFD600"
          },
          palette_names: ["Tropical Green", "Lake Blue", "Gold"],
          tone: "luxury"
        },
        property_details: {
          bedrooms: masterDict?.room_inventory?.total_ac_ensuite_bedrooms || 7,
          all_ensuite: true,
          max_guests: 24,
          pool: "60ft infinity pool",
          wifi: "300 Mbps fiber",
          jetty: "Private lake jetty",
          beach_access: "350-yard beach access",
          staff: "Full villa staff included",
          chef: "Dedicated chef on-site"
        },
        usps: [
          "7 ensuite AC bedrooms sleeping up to 24",
          "60ft infinity pool overlooking Koggala Lake",
          "300 Mbps high-speed fiber Wi-Fi",
          "Private lake jetty with boat safari access",
          "350-yard beach access to Ahangama surf",
          "Full villa staff with dedicated chef"
        ],
        pricing: {
          currency: "USD",
          entire_villa_starting_floor: masterDict?.pricing_axioms?.full_villa_7bed_starting_rate_usd || 250,
          rooms_starting_floor: masterDict?.pricing_axioms?.last_minute_room_starting_rate_usd || 45,
          direct_booking_discount: "15-30% vs OTA platforms"
        },
        hooks: [
          "7-Bedroom private lakefront buyout from $250/night",
          "Last-minute luxury surf stay in Ahangama from $45/night",
          "Exclusive lakeside villa buyout with 60ft pool & private chef"
        ],
        generated_at: new Date().toISOString()
      };
    },
    {
      campaignId: campaign,
      crawlName: `market-dna-crawl-${domain}`
    }
  );

  const finalDna = result.data || result;

  // Validate Market DNA
  const validation = validateMarketDna(finalDna);
  if (!validation.valid) {
    throw new Error(`[Spyder Error] Extracted Market DNA violates schema:\n${validation.errors.join('\n')}`);
  }

  // Ensure output directory exists and write
  const outDir = path.dirname(path.resolve(targetOutput));
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.resolve(targetOutput), JSON.stringify(finalDna, null, 2), 'utf-8');
  console.log(`[Spyder] ✅ Successfully validated and written Market DNA to ${targetOutput}`);

  return finalDna;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs();
  extractMarketDna(opts).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
