/* ═══════════════════════════════════════════════════════
   Ko Lake Villa — Landing Page Interactivity
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── NAV: Scroll effect ─────────────────────────────── */
  const nav = document.getElementById('nav');

  function handleNavScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // run on load

  /* ── REVEAL: Intersection Observer ──────────────────── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ── SMOOTH SCROLL: Anchor links ────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const y = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  /* ── DATE DEFAULTS: Set check-in to next Monday ─────── */
  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');

  if (checkin && checkout) {
    const today = new Date();
    // Next Monday (or today if already Monday)
    const daysUntilMon = ((8 - today.getDay()) % 7) || 7;
    const nextMon = new Date(today);
    nextMon.setDate(today.getDate() + daysUntilMon);

    const nextSun = new Date(nextMon);
    nextSun.setDate(nextMon.getDate() + 6);

    checkin.valueAsDate = nextMon;
    checkout.valueAsDate = nextSun;
    checkin.min = today.toISOString().split('T')[0];

    checkin.addEventListener('change', function () {
      const ci = new Date(this.value);
      const co = new Date(ci);
      co.setDate(ci.getDate() + 6);
      checkout.valueAsDate = co;
      checkout.min = this.value;
    });
  }

  /* ── BOOKING FORM: Handle submission ────────────────── */
  const form = document.getElementById('booking-form');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const data = Object.fromEntries(new FormData(form));
      const btn = document.getElementById('submit-booking');
      const origText = btn.textContent;

      // UTM capture
      const params = new URLSearchParams(window.location.search);
      data.utm_source = params.get('utm_source') || 'direct';
      data.utm_medium = params.get('utm_medium') || '';
      data.utm_campaign = params.get('utm_campaign') || '';

      // Visual feedback
      btn.textContent = '✓ Inquiry Sent!';
      btn.style.background = '#2E7D32';
      btn.style.color = '#fff';
      btn.disabled = true;

      // Log for now (replace with actual endpoint later)
      console.log('[Ko Lake Villa] Booking inquiry:', data);

      setTimeout(() => {
        btn.textContent = origText;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 4000);
    });
  }

  /* ── STATS: Animate on hero visible ─────────────────── */
  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) {
    const statNumbers = statsSection.querySelectorAll('.stat-number');
    let statsAnimated = false;

    function animateStats() {
      if (statsAnimated) return;
      statsAnimated = true;

      statNumbers.forEach((el) => {
        const raw = el.textContent.trim();
        const numericPart = parseInt(raw, 10);
        const suffix = raw.replace(/[0-9]/g, '');

        if (isNaN(numericPart)) return;

        let current = 0;
        const step = Math.ceil(numericPart / 40);
        const interval = setInterval(() => {
          current += step;
          if (current >= numericPart) {
            current = numericPart;
            clearInterval(interval);
          }
          el.textContent = current + suffix;
        }, 30);
      });
    }

    // Trigger stat animation when hero section is in view
    const heroObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateStats();
          heroObserver.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    heroObserver.observe(statsSection);
  }

  /* ── PARALLAX: Subtle hero background ───────────────── */
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    window.addEventListener('scroll', function () {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrolled * 0.2}px) scale(1.05)`;
      }
    }, { passive: true });
  }

})();
