/* ═══════════════════════════════════════════════════════
   SMMFactory — Review Engine
   -------------------------------------------------------
   Genuine guest review solicitation system.
   Handles: guest records, review request scheduling,
   WhatsApp/email template generation, sentiment log.
   Zero external dependencies — pure Node.js.
   ═══════════════════════════════════════════════════════ */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3848;
const HOST = '127.0.0.1';
const DATA_DIR = path.join(__dirname, 'data');
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const LOG_FILE = path.join(DATA_DIR, 'request_log.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Data helpers ──────────────────────────────────────────
function readJSON(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Review Request Templates ──────────────────────────────

const PROPERTIES = {
  'ko-lake-villa': {
    name: 'Ko Lake Villa',
    whatsapp_number: '+94XXXXXXXXX', // replace with actual number
    google_review_url: 'https://g.page/r/XXXXXX/review', // replace with actual
    tripadvisor_url: 'https://www.tripadvisor.com/Hotel_Review-XXXXXX',
    booking_url: 'https://www.booking.com/hotel/XXXXXX',
    tone: 'warm'
  }
};

function buildWhatsAppMessage(guest, property, dayOffset) {
  const prop = PROPERTIES[property] || PROPERTIES['ko-lake-villa'];
  const firstName = guest.name.split(' ')[0];

  const messages = {
    1: `Hi ${firstName} 😊 Thank you so much for staying at ${prop.name}! We hope you had a wonderful time. If you enjoyed your stay, we'd truly appreciate a quick review — it makes a huge difference for us: ${prop.google_review_url} 🙏`,
    3: `Hi ${firstName}, it was such a pleasure hosting you at ${prop.name}! If you have a spare moment, an honest review would mean the world to our small team: ${prop.google_review_url} — No pressure at all, and thank you again! ✨`,
    7: `Hi ${firstName} — a quick follow-up from ${prop.name}. We'd love to hear your thoughts on your stay. Even a few words helps future guests and our team grow: ${prop.google_review_url} 🌿`
  };

  return messages[dayOffset] || messages[1];
}

function buildEmailTemplate(guest, property, dayOffset) {
  const prop = PROPERTIES[property] || PROPERTIES['ko-lake-villa'];
  const firstName = guest.name.split(' ')[0];

  return {
    subject: dayOffset === 1
      ? `Thank you for staying at ${prop.name} 🙏`
      : `Your feedback matters — ${prop.name}`,
    body: `
Hi ${firstName},

${dayOffset === 1 ? `Thank you so much for choosing ${prop.name}. We hope your stay exceeded your expectations.` : `We hope you've settled back home after your wonderful visit to ${prop.name}.`}

If you have a moment, sharing your experience would help other travellers find us and help our small team grow:

⭐ Google Review: ${prop.google_review_url}
🏨 TripAdvisor: ${prop.tripadvisor_url}
📋 Booking.com: ${prop.booking_url}

Your honest feedback means the world to us.

With gratitude,
The ${prop.name} Team
    `.trim()
  };
}

// ── HTTP Server ───────────────────────────────────────────
function parseJSON(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve the UI
  if (method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  try {
    // ── GET /api/health ──────────────────────────────────
    if (method === 'GET' && pathname === '/api/health') {
      return json(res, { status: 'ok', service: 'review-engine', port: PORT });
    }

    // ── GET /api/guests ──────────────────────────────────
    if (method === 'GET' && pathname === '/api/guests') {
      return json(res, readJSON(GUESTS_FILE));
    }

    // ── POST /api/guests ─────────────────────────────────
    // Add a new guest checkout (triggers review request schedule)
    if (method === 'POST' && pathname === '/api/guests') {
      const body = await parseJSON(req);
      const guests = readJSON(GUESTS_FILE);

      if (!body.name || !body.checkout_date || !body.contact) {
        return json(res, { error: 'name, checkout_date, and contact required' }, 400);
      }

      const guest = {
        id: randomUUID(),
        name: body.name,
        email: body.email || null,
        whatsapp: body.whatsapp || null,
        contact: body.contact, // 'whatsapp' | 'email' | 'both'
        checkout_date: body.checkout_date,
        property: body.property || 'ko-lake-villa',
        nights: body.nights || 1,
        notes: body.notes || '',
        review_requested: false,
        review_received: false,
        created_at: new Date().toISOString(),
        request_schedule: [
          { day: 1, sent: false, sent_at: null },
          { day: 3, sent: false, sent_at: null },
          { day: 7, sent: false, sent_at: null }
        ]
      };

      guests.push(guest);
      writeJSON(GUESTS_FILE, guests);

      return json(res, { success: true, guest });
    }

    // ── GET /api/due-requests ────────────────────────────
    // Returns guests whose next review request is due today
    if (method === 'GET' && pathname === '/api/due-requests') {
      const guests = readJSON(GUESTS_FILE);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = [];
      for (const guest of guests) {
        if (guest.review_received) continue;
        const checkout = new Date(guest.checkout_date);
        checkout.setHours(0, 0, 0, 0);

        for (const slot of guest.request_schedule) {
          if (slot.sent) continue;
          const dueDate = new Date(checkout);
          dueDate.setDate(dueDate.getDate() + slot.day);

          if (dueDate <= today) {
            const message = guest.contact !== 'email'
              ? buildWhatsAppMessage(guest, guest.property, slot.day)
              : null;
            const email = guest.contact !== 'whatsapp'
              ? buildEmailTemplate(guest, guest.property, slot.day)
              : null;

            due.push({
              guest_id: guest.id,
              guest_name: guest.name,
              day_offset: slot.day,
              property: guest.property,
              whatsapp: guest.whatsapp,
              email_address: guest.email,
              whatsapp_message: message,
              email_template: email,
              checkout_date: guest.checkout_date
            });
            break; // only the next unsent slot per guest
          }
        }
      }

      return json(res, { due, count: due.length });
    }

    // ── POST /api/mark-sent ──────────────────────────────
    // Mark a review request as sent (called after manual/automated send)
    if (method === 'POST' && pathname === '/api/mark-sent') {
      const body = await parseJSON(req);
      const guests = readJSON(GUESTS_FILE);
      const log = readJSON(LOG_FILE);

      const guest = guests.find(g => g.id === body.guest_id);
      if (!guest) return json(res, { error: 'Guest not found' }, 404);

      const slot = guest.request_schedule.find(s => s.day === body.day_offset && !s.sent);
      if (!slot) return json(res, { error: 'Slot not found or already sent' }, 400);

      slot.sent = true;
      slot.sent_at = new Date().toISOString();
      guest.review_requested = true;

      log.push({
        guest_id: guest.id,
        guest_name: guest.name,
        day_offset: body.day_offset,
        channel: body.channel || 'unknown',
        sent_at: slot.sent_at
      });

      writeJSON(GUESTS_FILE, guests);
      writeJSON(LOG_FILE, log);

      return json(res, { success: true });
    }

    // ── GET /api/reviews ─────────────────────────────────
    if (method === 'GET' && pathname === '/api/reviews') {
      return json(res, readJSON(REVIEWS_FILE));
    }

    // ── POST /api/reviews ────────────────────────────────
    // Log an incoming review (from manual entry or future API integration)
    if (method === 'POST' && pathname === '/api/reviews') {
      const body = await parseJSON(req);
      const reviews = readJSON(REVIEWS_FILE);
      const guests = readJSON(GUESTS_FILE);

      const review = {
        id: randomUUID(),
        guest_id: body.guest_id || null,
        guest_name: body.guest_name || 'Anonymous',
        platform: body.platform || 'google', // google | tripadvisor | booking
        rating: body.rating,          // 1-5
        text: body.text || '',
        url: body.url || null,
        property: body.property || 'ko-lake-villa',
        response_draft: null,
        response_posted: false,
        received_at: new Date().toISOString()
      };

      // Auto-generate response draft using template
      review.response_draft = buildResponseDraft(review);

      // Mark guest as reviewed if guest_id provided
      if (body.guest_id) {
        const guest = guests.find(g => g.id === body.guest_id);
        if (guest) {
          guest.review_received = true;
          writeJSON(GUESTS_FILE, guests);
        }
      }

      reviews.push(review);
      writeJSON(REVIEWS_FILE, reviews);

      return json(res, { success: true, review });
    }

    // ── GET /api/stats ───────────────────────────────────
    if (method === 'GET' && pathname === '/api/stats') {
      const guests = readJSON(GUESTS_FILE);
      const reviews = readJSON(REVIEWS_FILE);

      const totalGuests = guests.length;
      const requested = guests.filter(g => g.review_requested).length;
      const received = guests.filter(g => g.review_received).length;
      const conversionRate = requested > 0
        ? Math.round((received / requested) * 100)
        : 0;

      const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : '—';

      const byPlatform = reviews.reduce((acc, r) => {
        acc[r.platform] = (acc[r.platform] || 0) + 1;
        return acc;
      }, {});

      return json(res, {
        total_guests: totalGuests,
        review_requested: requested,
        review_received: received,
        conversion_rate: `${conversionRate}%`,
        avg_rating: avgRating,
        total_reviews: reviews.length,
        by_platform: byPlatform,
        pending_response: reviews.filter(r => !r.response_posted).length
      });
    }

    json(res, { error: 'Not found' }, 404);

  } catch (err) {
    console.error('Review Engine error:', err.message);
    json(res, { error: err.message?.slice(0, 500) || 'Internal error' }, 500);
  }
});

// ── Response Draft Generator ──────────────────────────────
function buildResponseDraft(review) {
  const prop = PROPERTIES[review.property] || PROPERTIES['ko-lake-villa'];
  const name = review.guest_name?.split(' ')[0] || 'Guest';
  const rating = review.rating || 5;

  if (rating >= 4) {
    return `Thank you so much, ${name}! We're thrilled you enjoyed your time at ${prop.name}. Your kind words mean the world to our team. We'd love to welcome you back again soon! 🌿`;
  } else if (rating === 3) {
    return `Thank you for your honest feedback, ${name}. We're glad you stayed with us and we take your comments seriously. We're always working to improve and hope to welcome you back to an even better experience at ${prop.name}.`;
  } else {
    return `Thank you for taking the time to share your feedback, ${name}. We sincerely apologise that your experience at ${prop.name} fell short of your expectations. We'd love the opportunity to understand what went wrong and make it right — please reach out to us directly so we can address this personally.`;
  }
}

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │  ⭐  Review Engine — SMMFactory          │');
  console.log('  │  ────────────────────────────────────────│');
  console.log(`  │  http://localhost:${PORT}                │`);
  console.log('  │                                          │');
  console.log('  │  POST /api/guests   → Log checkout       │');
  console.log('  │  GET  /api/due-requests → Due today      │');
  console.log('  │  POST /api/reviews  → Log review         │');
  console.log('  │  GET  /api/stats    → Dashboard stats    │');
  console.log('  └──────────────────────────────────────────┘');
  console.log('');
});
