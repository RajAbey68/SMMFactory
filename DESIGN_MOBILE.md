# SMMFactory Mobile — Design Plan (Notion-Warm)

> **Mobile strategy for SMMFactory:** A native-feeling, touch-first mobile experience that lets marketers manage campaigns, capture media, and respond to engagement alerts on the go. Follows the same Notion-warm design language as the desktop app.

---

## Table of Contents

1. [Mobile-First Principles](#1-mobile-first-principles)
2. [Screen Architecture](#2-screen-architecture)
3. [Navigation](#3-navigation)
4. [Feature Deep-Dives](#4-feature-deep-dives)
5. [Interaction Design](#5-interaction-design)
6. [Push Notification Strategy](#6-push-notification-strategy)
7. [Mobile Component Library](#7-mobile-component-library)
8. [Platform Considerations](#8-platform-considerations)
9. [Current Component Audit](#9-current-component-audit)

---

## 1. Mobile-First Principles

| Principle | Why |
|---|---|
| **Thumb zone** | Primary actions and navigation sit in the bottom third of the screen (thumb-friendly zone). |
| **One primary action per screen** | No decision paralysis. Each mobile view has exactly one clear CTA. |
| **Bottom navigation** | 5 tabs max. No hamburger menus hidden in the top-left corner. |
| **Camera as first-class input** | Social media is visual. Taking/uploading a photo should be as easy as tapping a button. |
| **Haptic feedback for micro-interactions** | Light tap on selection, medium on submission, error on failure — feels native. |
| **Offline resilience** | Draft posts, unsent messages, and queued actions survive spotty connectivity. |
| **Share sheet integration** | Every published post supports native OS share sheet for cross-platform distribution. |
| **Pull-to-refresh** | Campaign status, metrics, and engagement feeds refresh via natural pull gesture. |

---

## 2. Screen Architecture

### Tab Structure (Bottom Navigation)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  Content Area                        │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  📊     ✏️     ➕     🔔     ⚙️                     │
│  Home   Posts  New    Activity   Settings            │
└─────────────────────────────────────────────────────┘
```

| Tab | Screen | Primary Action |
|---|---|---|
| **Home** (`📊`) | Campaign dashboard (metrics strip + campaign cards) | Tap card → campaign detail |
| **Posts** (`✏️`) | Content calendar / post queue | Tap post → compose/edit |
| **New** (`➕`) | Floating action hub | Camera / gallery / text post |
| **Activity** (`🔔`) | Engagement alerts + notifications | Swipe to dismiss, tap to act |
| **Settings** (`⚙️`) | Profile, connected accounts, preferences | Tap to configure |

### Screen Map

```
Home (Dashboard)
├── Campaign Card
│   └── Campaign Detail
│       ├── Metrics tab (impressions, clicks, CTR, spend)
│       ├── Creative tab (ads, images, videos)
│       ├── Comments tab (engagement feed)
│       └── Settings tab (budget, targeting, schedule)
│
Posts (Content Queue)
├── Drafts
├── Scheduled
├── Published
└── Compose (also accessed via ➕ New)
    ├── Camera (take photo/video)
    ├── Gallery (pick existing)
    ├── Text (caption, thread, hook)
    └── Share Sheet (distribute)

Activity
├── Engagement alerts (likes, comments, shares)
├── System alerts (campaign ended, budget threshold)
└── Team notifications (review needed, approved)

Settings
├── Profile (name, avatar, bio)
├── Connected accounts (Meta, Google, LinkedIn, TikTok)
├── Notification preferences
├── Appearance (light/dark)
└── Data & storage
```

---

## 3. Navigation

### 3.1 Bottom Tab Bar

```css
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px; /* includes safe-area-bottom padding */
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--surface-page);
  border-top: 1px solid var(--border-light);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 100;
}
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tab-item__icon { font-size: 22px; }
.tab-item__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
}
.tab-item--active .tab-item__label { color: var(--accent-blue); }
.tab-item--active .tab-item__icon { color: var(--accent-blue); }
```

### 3.2 FAB (Floating Action Button) — "New" Tab Center

The center tab is a **prominent circular button** that acts as the primary creation gateway:

```
┌─────────┐
│    ➕    │  56×56px circle, Notion Blue bg, white icon
└─────────┘
```

On tap, it expands into an action sheet:

```json
[
  { "icon": "📷", "label": "Camera", "action": "openCamera" },
  { "icon": "🖼️", "label": "Gallery", "action": "openGallery" },
  { "icon": "✍️", "label": "Text Post", "action": "composeText" },
  { "icon": "🔗", "label": "Link Post", "action": "composeLink" }
]
```

### 3.3 Back Navigation

- Swipe right to go back (iOS standard)
- Hardware back button on Android
- Back arrow in top bar for modals/drill-downs
- **No hamburger menu** — bottom tabs + swipe back is sufficient

### 3.4 Safe Areas

```css
/* iOS notch / Android cutout */
padding-top: env(safe-area-inset-top, 0px);
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-left: env(safe-area-inset-left, 0px);
padding-right: env(safe-area-inset-right, 0px);
```

---

## 4. Feature Deep-Dives

### 4.1 Camera Integration

**User story:** "As a social media marketer, I want to capture content for a campaign post directly from my phone."

```
Flow:
1. Tap ➕ New → Camera
2. Native camera viewport opens (full-screen, not a picker)
3. Grid overlay (rule of thirds) for composition
4. Capture photo (tap) or video (hold)
5. Optional: Apply quick filter (Notion-warm preset)
6. Preview → Add caption → Post now / Schedule / Save as Draft
```

**Implementation:**

```javascript
// Camera access via MediaDevices API (or Capacitor/Cordova plugin)
async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1080 } },
      audio: false,
    });
    // Render stream to a <video> element as viewfinder
    // On capture: draw frame to canvas → blob → upload or store locally
  } catch (err) {
    // Fallback: open native file picker with accept="image/*,video/*"
    showToast('Camera permission denied', 'error');
  }
}
```

**Permissions handling:**
- Request camera permission on first use (contextual — explain why)
- If denied: show a clear explainer card with a "Go to Settings" button
- Respect `prefers-reduced-transparency` for camera UI chrome

### 4.2 Haptic Feedback

Map haptics to specific interactions for a polished, native feel:

| Interaction | Haptic Type | Platform |
|---|---|---|
| Tab switch | Light impact (`UIImpactFeedbackStyle.Light`) | iOS |
| Button tap (primary) | Light impact | iOS |
| Pull-to-refresh trigger | Medium impact | iOS |
| Success (post published) | Notification success | iOS |
| Error / failure | Notification error | iOS |
| Camera shutter | Custom (short burst) | Cross-platform |
| Swipe to delete | Medium impact + animation | iOS |
| Drag reorder | Continuous light | iOS |
| Long-press context menu | Selection feedback | iOS |

**Web implementation** (via `navigator.vibrate`):

```javascript
const HAPTICS = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  heavy: () => navigator.vibrate?.([30, 20, 10]),
  success: () => navigator.vibrate?.(15),
  error: () => navigator.vibrate?.([50, 30, 50]),
};

// Usage
element.addEventListener('click', () => HAPTICS.light());
```

For native apps (Swift/Kotlin), use platform haptic APIs directly.

### 4.3 Share Sheet Integration

**User story:** "As a marketer, I want to share a published post across Instagram, LinkedIn, TikTok, and WhatsApp without manual copy-paste."

```
Flow (after post is published):
1. "Post published!" toast appears
2. "Share Now" button in the success CTA
3. Tapping opens the native OS share sheet
4. Content payload includes:
   - Text: Caption / post body
   - URL: Link to the post (if applicable)
   - Image/Video: The creative asset
   - Title: Campaign name
5. User picks a target app → native share handles the rest
```

**Web implementation** (via Web Share API):

```javascript
async function sharePost(post) {
  const shareData = {
    title: post.campaignName,
    text: post.caption,
    url: post.publicUrl,
    files: post.assets.map(a => a.file), // Image objects
  };

  if (navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      trackEvent('post_shared', { id: post.id, method: 'share_sheet' });
    } catch (err) {
      if (err.name !== 'AbortError') { // user dismissed, not an error
        showToast('Share failed', 'error');
      }
    }
  } else {
    // Fallback: copy link to clipboard
    await navigator.clipboard.writeText(post.publicUrl);
    showToast('Link copied to clipboard', 'success');
  }
}
```

**Native:** Use `UIActivityViewController` (iOS) / `Intent.createChooser` (Android).

### 4.4 Push Notifications

**User story:** "As a user, I want to know immediately when a campaign gets engagement so I can respond or amplify."

#### Notification Types

| Category | Trigger | Priority | Action |
|---|---|---|---|
| **Engagement** | New comment on a post | High | Tap → Comment thread in Activity |
| **Engagement** | Like / reaction spike (>50 in 15min) | High | Tap → Campaign metrics |
| **Engagement** | New share / repost | Medium | Tap → Post detail |
| **System** | Campaign budget threshold reached (80%) | High | Tap → Campaign settings |
| **System** | Campaign ended | Low | Tap → Campaign summary |
| **System** | Scheduled post published | Low | Tap → Post detail |
| **Team** | Review requested on creative | Medium | Tap → Creative review screen |
| **Team** | Four-eyes approval needed | High | Tap → Approval queue |
| **Error** | Ad rejected by platform | Critical | Tap → Error detail |

#### Design Pattern

```
┌──────────────────────────────────────┐
│ 🔔  Campaign engagement spike        │
│     "Ko Lake Villa Easter Push —     │
│      23 new comments in 15 min"      │
│                             2m ago   │
├──────────────────────────────────────┤
│ ...                                  │
└──────────────────────────────────────┘
```

Each notification is a card with:
- Left icon (contextual: engagement = heart, system = bell, team = people, error = alert-triangle)
- Title (bold, `--text-primary`)
- Message body (`--text-secondary`, max 2 lines)
- Time ago (`--text-muted`)
- Swipe to dismiss (left = dismiss, right = mark as read)
- 3D Touch / long-press for quick actions ("View campaign", "Mute for 1h")

#### Permission Prompt

First-time prompt is **contextual** (not at app launch):

```
"When someone comments or likes your post,
we'll let you know right away.

[ Not Now ]  [ Allow Notifications ]
```

### 4.5 Pull-to-Refresh

Standard gesture for refreshing campaign data, metrics, and engagement feeds.

```javascript
// Using CSS overscroll-behavior for web
// Or <PullToRefresh> component in React Native
function handleRefresh() {
  return new Promise((resolve) => {
    refreshCampaigns().then(() => resolve());
  });
}
```

Visual indicator: Notion-warm spinner (Notion Blue `#0075de`), 24×24px.

---

## 5. Interaction Design

### 5.1 Gestures

| Gesture | Action | Feedback |
|---|---|---|
| Tap | Select / navigate | Light haptic |
| Long-press (1s) | Context menu | Medium haptic |
| Swipe left | Dismiss notification | Medium haptic |
| Swipe right | Mark as read (notifications) | Light haptic |
| Pull down | Refresh data | Medium haptic on trigger |
| Pinch | Zoom image preview | None |
| Drag (on image strip) | Reorder creative assets | Continuous haptic |

### 5.2 Animations

All animations use `ease-out` (natural deceleration), 200–300ms.

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Page transitions: slide up */
.page-enter { animation: slideUp 250ms var(--ease-out); }
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* FAB expand */
.fab-expand-enter { animation: scaleIn 200ms var(--ease-spring); }
@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Toast slide down */
.toast-enter { animation: toastSlide 300ms var(--ease-out); }
@keyframes toastSlide {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**Reduce motion:** All animations respect `prefers-reduced-motion` — fall back to opacity fades (0ms duration).

---

## 6. Push Notification Strategy

### 6.1 Technology

| Layer | Option A (PWA) | Option B (Native wrapper) |
|---|---|---|
| Service Worker | `push` + `notification` events | N/A |
| Payload | VAPID + Firebase Cloud Messaging | APNs (iOS) / FCM (Android) |
| Delivery | Browser push API | Native push notification service |
| Offline | Service worker caches notifs | OS notification store |

**Recommended:** PWA as initial version (Web Push API + Service Worker), migrate to Capacitor/React Native if user demand justifies it.

### 6.2 Subscription Flow

```javascript
// Register service worker
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.register('/sw.js');

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}
```

### 6.3 Notification Payload

```json
{
  "title": "🔥 Engagement spike!",
  "body": "Ko Lake Villa Easter Push — 23 new comments in 15 min",
  "icon": "/icons/icon-192.png",
  "badge": "/icons/badge.png",
  "data": {
    "type": "engagement_spike",
    "campaignId": "kle-2026",
    "url": "/campaigns/kle-2026?tab=comments"
  },
  "actions": [
    { "action": "view", "title": "View Campaign" },
    { "action": "mute", "title": "Mute for 1h" }
  ]
}
```

### 6.4 Notification Categories (iOS)

| Category | Actions |
|---|---|
| `engagement` | View, Mute 1h, Reply (if comment) |
| `system` | View, Dismiss |
| `team` | View, Approve, Request Changes |
| `error` | View Error, Dismiss |

---

## 7. Mobile Component Library

### 7.1 Campaign Card (Mobile)

```
┌──────────────────────────────────┐
│ KLEst         ● Active           │
│ Ko Lake Villa — Easter Push      │
│                                  │
│ 📈 1.2K imp   💰 $450 spent      │
│ ❤️ 89 eng     📅 Ends Apr 20    │
│                                  │
│ [  View Campaign →  ]            │
└──────────────────────────────────┘
```

- Single column (full-width card)
- Ref code as pill badge
- Status as pill badge
- 4 key metrics in 2×2 mini-grid
- Full-width CTA button

### 7.2 Media Capture Button

```css
.capture-button {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--surface-card);
  border: 4px solid var(--accent-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 100ms var(--ease-spring);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.capture-button:active {
  transform: scale(0.92);
}

/* Inner circle (shutter style) */
.capture-button__inner {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-blue);
}
```

### 7.3 Compose Sheet

```
┌──────────────────────────────────┐
│ ✕ Cancel          New Post   ✓   │
├──────────────────────────────────┤
│                                  │
│ [📷 Camera]  [🖼️ Gallery]       │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Write your caption...        │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│ Campaign: [KLEst ▼]             │
│ Schedule: [Now ▼]               │
│                                  │
│ [  Share via...  →  ]           │
└──────────────────────────────────┘
```

### 7.4 Handle (Drag Indicator)

```css
.handle {
  width: 36px;
  height: 4px;
  background: var(--border-default);
  border-radius: var(--radius-full);
  margin: var(--space-2) auto;
  flex-shrink: 0;
}
```

Used on bottom sheets, draggable panels, and swipeable notification rows.

### 7.5 Bottom Sheet

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface-page);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: var(--space-2) var(--space-4) var(--space-6);
  padding-bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0px));
  box-shadow: var(--shadow-xl);
  z-index: 200;
  transform: translateY(100%);
  transition: transform 300ms var(--ease-out);
}
.bottom-sheet--open {
  transform: translateY(0);
}

/* Scrim backdrop */
.bottom-sheet-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 199;
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}
.bottom-sheet-scrim--visible {
  opacity: 1;
  pointer-events: auto;
}
```

### 7.6 Notification Card

```
┌──────────────────────────────────┐
│ 🔥  Engagement spike            │
│     "23 new comments in 15 min" │
│                          2m ago  │
└──────────────────────────────────┘
```

- Full width, no padding inside (content does the padding)
- Left icon in `--accent-blue-subtle` circle (32×32px)
- Unread state: left blue indicator bar (3px)
- Swipe left: reveal "Dismiss" action button
- Swipe right: reveal "Mark Read" action button

### 7.7 Loading Skeleton

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-alt) 25%,
    var(--surface-hover) 50%,
    var(--surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 8. Platform Considerations

| Concern | iOS | Android | Web (PWA) |
|---|---|---|---|
| Push notifications | APNs via Safari | FCM via Chrome/WebView | Web Push API |
| Haptics | CoreHaptics `UIFeedbackGenerator` | `VibrationEffect` + `View.performHapticFeedback` | `navigator.vibrate()` (limited) |
| Share sheet | `UIActivityViewController` | `Intent.createChooser` | Web Share API  (iOS Safari + Chrome Android) |
| Camera | `UIImagePickerController` / `AVFoundation` | `CameraX` / `Intent.ACTION_IMAGE_CAPTURE` | `navigator.mediaDevices.getUserMedia` |
| Bottom safe area | `env(safe-area-inset-bottom)` | `env(safe-area-inset-bottom)` | Same |
| Offline | `URLSession` background tasks | `WorkManager` | Service Worker Cache API |
| Gesture navigation | Swipe-back system gesture | System back button | CSS `overscroll-behavior` |

### Minimum OS Versions

| Platform | Min Version | Rationale |
|---|---|---|
| iOS | 15.0+ | Web Share API, Push API, `env(safe-area-*)` |
| Android | 10.0+ (API 29) | Dark mode support, edge-to-edge, haptic APIs |
| Web | Chrome 86+, Safari 15+ | Modern CSS, Web Push, Service Worker |

### App Shell Architecture (PWA)

```
index.html
├── <link rel="manifest">
├── <meta name="apple-mobile-web-app-capable" content="yes">
├── <meta name="apple-mobile-web-app-status-bar-style" content="default">
├── <meta name="theme-color" content="#ffffff">
│
├── App shell (static HTML)
│   ├── Top bar (sticky)
│   ├── Content area (dynamic, JS-rendered)
│   └── Tab bar (fixed bottom)
│
└── /sw.js  (Service Worker)
    ├── Cache static assets on install
    ├── Network-first for API calls
    ├── Cache-fallback for offline
    └── Push event handler → show notification
```

---

## 9. Current Component Audit

### Mobile-First Assessment of Existing SMMFactory Components

> **Methodology:** Each UI component from the current codebase (dashboard, hook studio, landing page) is evaluated against the Notion-warm mobile design principles. Scores: ✅ (pass), ⚠️ (needs work), ❌ (fails).

#### Dashboard (`dashboard/`)

| Component | Mobile Readiness | Issues | Fix Priority |
|---|---|---|---|
| **Top Bar** | ⚠️ | 52px height is too tall for mobile; dark bg should be white; text is monospace instead of Inter | High |
| **Summary Strip** | ❌ | auto-fit grid works but cards have dark bg, glow effects, and no touch-friendly padding; values in monospace | High |
| **Campaign Card** | ❌ | 420px min-width forces horizontal scroll on mobile; phase timeline dots are too small to tap; dark bg, shadow-glow, gradient borders | Critical |
| **Metrics Grid** | ❌ | 200px min-width, dark bg, monospace numbers, no touch states | High |
| **AG Prompt Panel** | ❌ | Fixed bottom with glass morphism absolutely does not work on mobile; covers screen real estate; dark bg | Critical |
| **Buttons** | ⚠️ | `--radius-sm` (6px) is too tight for mobile; font size 0.82rem is small; dark bg bg on ghost | Medium |
| **Phase Timeline** | ❌ | 26px dots are below minimum tap target (44px); connectors are thin lines; no touch events | Critical |

#### Hook Studio (`creative/hook-studio/`)

| Component | Mobile Readiness | Issues | Fix Priority |
|---|---|---|---|
| **Header** | ❌ | 56px tall, dark bg, gradient text logo, auto-scales badly below 768px | Medium |
| **3-Column Layout** | ❌ | 280px sidebar + 1fr center + 300px right panel = impossible below 900px; needs complete restack | Critical |
| **Drop Zone** | ⚠️ | 140px min-height, dashed border works but no haptic, no camera integration; full-width ok on mobile | High |
| **Image Strip** | ⚠️ | Works as scrollable list but 48px thumbnails small for touch; no swipe-to-delete | Medium |
| **Style Cards** | ❌ | Grid of cards with no touch adaptation; no bottom sheet for option selection | High |
| **Preview Panel** | ❌ | Fixed aspect preview at 180×320px; no pinch-to-zoom; no full-screen mode | Medium |
| **Generate Button** | ⚠️ | Full-width with max-width: 400px works okay; gradient bg not Notion-warm | Low |
| **Gallery** | ⚠️ | Grid of video cards with hover-to-play (no hover on mobile); fallback needed | Medium |

#### Landing Page (`landing-page/`)

| Component | Mobile Readiness | Issues | Fix Priority |
|---|---|---|---|
| **Navigation** | ⚠️ | Links list works on desktop but needs hamburger on mobile; `nav-links` flex-row overflows | High |
| **Hero Section** | ✅ | Uses `clamp()` for sizes, 100vh min-height, responsive padding — reasonably mobile-friendly | — |
| **USP Cards** | ✅ | `auto-fit, minmax(280px, 1fr)` grid collapses to single column on mobile — good | — |
| **Pricing Section** | ⚠️ | 2-column grid becomes stacked on mobile which is fine, but card has glass morphism | Low |
| **Review Cards** | ✅ | Same auto-fit grid; works on mobile | — |
| **Booking Form** | ⚠️ | Form grid `1fr 1fr` needs to collapse to single column; date inputs need native pickers | Medium |
| **Footer** | ✅ | Stacked, simple, responsive | — |

### Priority Fix Matrix

| Priority | Component | Estimated Effort | Impact |
|---|---|---|---|
| **P0 — Critical** | Campaign Card (redesign flat card + pill badges) | 4h | Unlocks mobile dashboard |
| **P0 — Critical** | AG Prompt (remove from mobile, replace with tab bar) | 2h | Unblocks all mobile navigation |
| **P0 — Critical** | Phase Timeline (replace dots with stacked pill status) | 3h | Makes campaign status touchable |
| **P1 — High** | Top Bar (shrink to 48px, white bg, Inter font) | 1h | Consistent header |
| **P1 — High** | Summary Strip (white bg card, subtle border, larger tap area) | 2h | Usable metrics overview |
| **P1 — High** | Hook Studio Layout (stack panels vertically on mobile) | 3h | Mobile creative tool |
| **P1 — High** | Style selection → bottom sheet (not grid cards) | 2h | Touch-friendly options |
| **P2 — Medium** | All buttons (standards: 44px min-height, 12px radius) | 1h | Touch target compliance |
| **P2 — Medium** | Drop zone → camera integration | 4h | Key mobile feature |
| **P2 — Medium** | Landing page nav hamburger | 1h | Mobile navigation |
| **P3 — Low** | Visual refresh (remove dark mode, apply Notion-warm tokens) | 3h | Design consistency |

### Total Migration Estimate

| Phase | Scope | Estimated Time |
|---|---|---|
| **Phase 1** | Create design tokens, CSS custom properties, base card/pill system | 4h |
| **Phase 2** | Redesign dashboard for mobile (campaign cards, summary strip, remove phase dots) | 8h |
| **Phase 3** | Bottom tab navigation + AG Prompt replacement | 4h |
| **Phase 4** | Camera integration + share sheet | 6h |
| **Phase 5** | Push notification infrastructure | 6h |
| **Phase 6** | Hook Studio mobile layout restack | 4h |
| **Phase 7** | Haptic feedback + animation polish | 3h |
| **Phase 8** | QA, touch target audit, accessibility pass | 4h |
| | **Total** | **~39h** |

---

## Appendix: Technology Recommendations

| Need | Recommendation | Why |
|---|---|---|
| Framework | React + Vite (or React Native if fully native) | Same component model as Notion-warm design |
| Mobile shell | PWA first (Service Workers + Web Push) | Zero app store friction; full feature parity |
| Camera | Capactior Camera plugin → native camera | Better than `getUserMedia` on iOS Safari |
| Haptics | `navigator.vibrate()` for web; CoreHaptics native | Works on modern browsers |
| Push | Firebase Cloud Messaging (FCM) | Single provider for both iOS and Android |
| State | Zustand or Jotai | Lightweight, async-friendly |
| Icons | Lucide React | Matches Notion's icon style |
| Charts | Recharts (React) or Chart.js | Lightweight, responsive |

---

> **Last updated:** July 2026  
> **Status:** Mobile design specification — ready for implementation
