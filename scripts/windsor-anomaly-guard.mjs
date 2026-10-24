/**
 * Windsor.ai Automated Ad Fatigue & Budget Anomaly Guard
 * Monitors Meta Ads & Google Ads for CTR decay, CPC spikes, and scaling opportunities.
 */

import { callWindsorTool, WINDSOR_KEY } from './windsor-mcp-client.mjs';

const THRESHOLDS = {
  high_ctr_opportunity: 4.0,   // CTR >= 4% -> Scaling recommendation
  fatigue_ctr_warning: 1.8,    // CTR <= 1.8% -> Ad fatigue alert
  cpc_spike_warning: 0.35,     // CPC >= $0.35 -> Cost spike alert
  channel: '#marketing-kolake'
};

export async function fetchWindsorMetrics() {
  const fields = ['source', 'campaign', 'clicks', 'spend', 'impressions', 'cpc', 'ctr', 'date'];
  
  // Try via Windsor MCP first
  try {
    const result = await callWindsorTool('get_data', {
      connector: 'facebook',
      fields,
      date_preset: 'last_7d'
    });
    
    let raw = result?.structuredContent?.result || result?.structuredContent || [];
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    
    if (Array.isArray(raw)) {
      // Filter out subscription or notice messages
      const valid = raw.filter(c => c.campaign && !c.campaign.includes('manage-subscription') && !c.campaign.startsWith('Uh-oh!'));
      if (valid.length > 0) return valid;
    }
  } catch (mcpErr) {
    console.warn('⚠️ MCP fetch fallback:', mcpErr.message);
  }

  // Direct REST API fallback
  try {
    const fieldStr = fields.join(',');
    const url = `https://connectors.windsor.ai/all?api_key=${WINDSOR_KEY}&fields=${fieldStr}&date_preset=last_7d`;
    const res = await fetch(url);
    const json = await res.json();
    const list = json?.data || [];
    return list.filter(c => c.campaign && !c.campaign.includes('manage-subscription') && !c.campaign.startsWith('Uh-oh!'));
  } catch {
    return [];
  }
}

export async function runAnomalyCheck() {
  console.log('🛡️ Running Windsor.ai Ad Fatigue & Budget Anomaly Surveillance...');
  const campaigns = await fetchWindsorMetrics();

  const alerts = [];
  const opportunities = [];

  if (campaigns.length === 0) {
    console.log('ℹ️ No active live campaigns reporting in Windsor yet. System standing by.');
    return { status: 'STANDBY', alerts, opportunities };
  }

  campaigns.forEach(c => {
    const ctr = parseFloat(c.ctr || 0);
    const cpc = parseFloat(c.cpc || 0);
    const name = c.campaign || 'Unnamed Campaign';

    if (ctr >= THRESHOLDS.high_ctr_opportunity) {
      opportunities.push({
        campaign: name,
        ctr: `${ctr.toFixed(2)}%`,
        cpc: `$${cpc.toFixed(2)}`,
        action: '🚀 High-Performing Asset: Consider scaling daily budget by 15-20%.'
      });
    }

    if (ctr > 0 && ctr <= THRESHOLDS.fatigue_ctr_warning) {
      alerts.push({
        campaign: name,
        type: 'CREATIVE_FATIGUE',
        ctr: `${ctr.toFixed(2)}%`,
        action: '⚠️ Ad Fatigue Detected: Rotate creative assets or refresh hook.'
      });
    }

    if (cpc >= THRESHOLDS.cpc_spike_warning) {
      alerts.push({
        campaign: name,
        type: 'CPC_SPIKE',
        cpc: `$${cpc.toFixed(2)}`,
        action: '🚨 CPC Spike Warning: Review audience targeting and bid strategy.'
      });
    }
  });

  console.log(`✅ Surveillance complete. Found ${alerts.length} alerts and ${opportunities.length} opportunities.`);
  return { status: 'COMPLETE', alerts, opportunities };
}

if (process.argv[1]?.endsWith('windsor_anomaly_guard.mjs') || process.argv[1]?.endsWith('windsor-anomaly-guard.mjs')) {
  runAnomalyCheck();
}
