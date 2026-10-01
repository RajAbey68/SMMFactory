#!/usr/bin/env node
// scripts/generate-landing-page.mjs — Stitch Responsive Brand-Matched Landing Page Generator
// Generates responsive, performance-optimized HTML/CSS matching extracted brand colors and proof-based ad copy.

import fs from 'node:fs';
import path from 'node:path';
import { assertNoProhibitedTerms } from '../tools/security-scrubber.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    campaign: 'ko-lake-retreats',
    output: 'landing-page/generated/index.html'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--campaign' && args[i + 1]) options.campaign = args[++i];
    else if (args[i] === '--output' && args[i + 1]) options.output = args[++i];
  }
  return options;
}

export function generateLandingPageHtml(options = {}) {
  const campaign = options.campaign || 'ko-lake-retreats';
  const dnaPath = path.resolve(`campaigns/${campaign}/research/market_dna.json`);

  if (!fs.existsSync(dnaPath)) {
    throw new Error(`Market DNA missing for campaign "${campaign}" at ${dnaPath}`);
  }

  const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf-8'));
  const colors = dna.brand?.colors || { primary: '#1B5E20', secondary: '#1565C0', accent: '#FFD600' };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dna.property} — Lakeside Living in Ahangama, Sri Lanka</title>
  <meta name="description" content="7-bedroom luxury lakeside villa on Koggala Lake. 60ft pool, private chef, 300 Mbps fiber Wi-Fi, 350-yard beach access. Book direct on WhatsApp.">
  <style>
    :root {
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
      --bg: #0d130e;
      --surface: #141c15;
      --surface-card: #1c261e;
      --text: #f0f4f1;
      --text-muted: #9eb1a2;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.6; }
    header { background: var(--surface); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 1.4rem; font-weight: 700; color: var(--text); }
    .brand span { color: var(--accent); }
    .cta-button { background: var(--accent); color: #000; padding: 0.75rem 1.5rem; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; transition: opacity 0.2s; }
    .cta-button:hover { opacity: 0.9; }
    .hero { padding: 5rem 2rem; max-width: 1000px; margin: 0 auto; text-align: center; }
    .badge { display: inline-block; background: rgba(255, 214, 0, 0.15); color: var(--accent); font-size: 0.85rem; font-weight: 600; padding: 0.35rem 0.85rem; border-radius: 20px; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.15; margin-bottom: 1.5rem; font-weight: 800; }
    .hero p { font-size: 1.25rem; color: var(--text-muted); max-width: 700px; margin: 0 auto 2.5rem; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 1100px; margin: 0 auto 5rem; padding: 0 1.5rem; }
    .card { background: var(--surface-card); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 2rem; text-align: left; }
    .card h3 { font-size: 1.2rem; margin-bottom: 0.75rem; color: #fff; }
    .card p { color: var(--text-muted); font-size: 0.95rem; }
    .pricing-box { background: linear-gradient(145deg, var(--surface), var(--surface-card)); border: 2px solid var(--accent); border-radius: 12px; max-width: 600px; margin: 0 auto 5rem; padding: 2.5rem; text-align: center; }
    .rate { font-size: 3rem; font-weight: 800; color: #fff; margin: 1rem 0; }
    footer { background: var(--surface); padding: 3rem 1.5rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.9rem; color: var(--text-muted); }
    footer p { max-width: 700px; margin: 0 auto; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <div class="brand">${dna.property}</div>
    <a href="https://wa.me/94711730345" class="cta-button" id="header-cta">Book on WhatsApp</a>
  </header>

  <main>
    <section class="hero">
      <div class="badge">Direct Booking Guarantee — Zero OTA Markup</div>
      <h1>Private Lakefront Living on Koggala Lake</h1>
      <p>7 AC en-suite bedrooms sleeping up to 24 guests. 60ft infinity pool, private lake jetty, dedicated chef, and 350-yard beach access in Ahangama.</p>
      <a href="https://wa.me/94711730345" class="cta-button" id="hero-cta">Reserve Direct via WhatsApp</a>
    </section>

    <section class="features">
      <div class="card">
        <h3>7 AC En-Suite Bedrooms</h3>
        <p>Spacious accommodations sleeping up to 24 guests including 2 large multi-guest family suites.</p>
      </div>
      <div class="card">
        <h3>60ft Infinity Pool</h3>
        <p>Private swimming pool with uninterrupted panoramic views over tranquil Koggala Lake.</p>
      </div>
      <div class="card">
        <h3>Dedicated Villa Chef</h3>
        <p>On-site private chef preparing daily fresh seafood BBQs, traditional Sri Lankan curries, and breakfast.</p>
      </div>
      <div class="card">
        <h3>300 Mbps Fiber Wi-Fi</h3>
        <p>Verified high-speed fiber internet and dedicated workstations designed for remote work retreats.</p>
      </div>
    </section>

    <section class="pricing-box">
      <h2>Exclusive Villa Buyout</h2>
      <p>Entire 7-bedroom property with private pool, chef & staff</p>
      <div class="rate">From $250<span style="font-size:1.2rem;font-weight:400;color:var(--text-muted)"> / night</span></div>
      <p style="margin-bottom:1.5rem;color:var(--text-muted)">Last-minute individual rooms from $45/night (call to check availability)</p>
      <a href="https://wa.me/94711730345" class="cta-button" id="pricing-cta">Check Availability on WhatsApp</a>
    </section>
  </main>

  <footer>
    <p>For more information about our unique accommodations and to explore the amenities of Ko Lake Villa, please visit our website at <a href="https://www.kolakevilla.com" style="color:var(--accent)">www.kolakevilla.com</a>. Book your stay today and experience the tranquility of lakeside living!</p>
  </footer>
</body>
</html>`;

  // Security check: no prohibited terms
  assertNoProhibitedTerms(html);

  const outFile = path.resolve(options.output || 'landing-page/generated/index.html');
  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, html, 'utf-8');
  console.log(`[Stitch] ✅ Generated responsive landing page at ${outFile}`);
  return html;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs();
  generateLandingPageHtml(opts);
}
