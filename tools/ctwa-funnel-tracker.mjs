// tools/ctwa-funnel-tracker.mjs — WhatsApp Click-to-Chat (CTWA) Funnel Tracking Engine
// Tracks front-door conversions from Meta/TikTok click to WhatsApp chat initiation, qualification, and booking deposit.

export class CTWAFunnelTracker {
  constructor(config = {}) {
    this.phone = config.phone || '+94 71 173 0345'; // Ko Lake Villa Front Door WhatsApp
    this.depositThresholdUsd = config.depositThresholdUsd || 180; // Minimum buyout floor deposit
  }

  /**
   * Generates a tracked, pre-filled WhatsApp click URL with campaign attribution parameters
   */
  generateTrackedUrl({ campaignSlug, sourceChannel = 'meta', utmSource = 'ad_variant_1', customText = '' }) {
    if (!campaignSlug) throw new Error('CTWAFunnelTracker: campaignSlug is required');

    const cleanPhone = this.phone.replace(/[^0-9]/g, '');
    const defaultText = `Hi Ko Lake Villa, I saw your ${sourceChannel.toUpperCase()} offer for ${campaignSlug} [ref:${utmSource}]. Is the buyout available?`;
    const textToEncode = customText || defaultText;
    const encodedText = encodeURIComponent(textToEncode);

    return {
      channel: 'whatsapp',
      target_phone: this.phone,
      campaign: campaignSlug,
      source: sourceChannel,
      utm_source: utmSource,
      wa_link: `https://wa.me/${cleanPhone}?text=${encodedText}`
    };
  }

  /**
   * Evaluates the multi-stage WhatsApp qualification funnel
   * @param {object} metrics - { ad_clicks: number, conversations_started: number, qualified_leads: number, bookings_closed: number, total_deposit_usd: number }
   */
  evaluateFunnel(metrics = {}) {
    const clicks = metrics.ad_clicks || 0;
    const convos = metrics.conversations_started || 0;
    const qualified = metrics.qualified_leads || 0;
    const closed = metrics.bookings_closed || 0;
    const revenue = metrics.total_deposit_usd || 0;

    const clickToConvoRate = clicks > 0 ? (convos / clicks) * 100 : 0;
    const convoToLeadRate = convos > 0 ? (qualified / convos) * 100 : 0;
    const leadToCloseRate = qualified > 0 ? (closed / qualified) * 100 : 0;

    let health = 'OPTIMAL';
    const bottlenecks = [];

    if (clicks > 50 && clickToConvoRate < 20) {
      health = 'BOTTLENECK_AT_PREFILL';
      bottlenecks.push('Click-to-conversation drop-off: Pre-filled message or landing trigger needs simplification.');
    }
    if (convos > 20 && convoToLeadRate < 40) {
      health = 'BOTTLENECK_AT_QUALIFICATION';
      bottlenecks.push('Conversation-to-lead drop-off: Chatbot response speed or initial room/date qualification needs tightening.');
    }

    return {
      funnel_health: health,
      conversion_rates: {
        click_to_convo_percent: Math.round(clickToConvoRate * 10) / 10,
        convo_to_qualified_percent: Math.round(convoToLeadRate * 10) / 10,
        qualified_to_close_percent: Math.round(leadToCloseRate * 10) / 10
      },
      metrics: {
        ad_clicks: clicks,
        conversations_started: convos,
        qualified_leads: qualified,
        bookings_closed: closed,
        total_deposit_usd: revenue
      },
      bottlenecks
    };
  }
}
