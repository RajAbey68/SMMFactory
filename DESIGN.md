# SMMFactory — Design System (Notion-Warm)

> **Design Direction:** Notion-Warm — a friendly, accessible canvas inspired by Notion's design language. Warm white backgrounds, Notion Blue accents, generous whitespace, card-heavy layouts, and pill badges. The antithesis of the current dark cyber aesthetic.

---

## Table of Contents

1. [Philosophy & Principles](#1-philosophy--principles)
2. [Design Tokens](#2-design-tokens)
3. [Color Palette](#3-color-palette)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Border & Radius](#6-border--radius)
7. [Shadows & Elevation](#7-shadows--elevation)
8. [Iconography](#8-iconography)
9. [Component Library](#9-component-library)
10. [Accessibility](#10-accessibility)

---

## 1. Philosophy & Principles

| Principle | Description |
|---|---|
| **Canvas-first** | Backgrounds are warm white (#ffffff / #f6f5f4). Content breathes. |
| **Notion-like calm** | No gradients-for-gradients-sake. Flat color blocks with subtle borders. |
| **Card-heavy** | Almost everything is a card with rounded corners, border, and a soft shadow. |
| **Pill badges, not tags** | Status, labels, and metadata use pill-shaped chips. |
| **Generous whitespace** | 24–32px as the base gap unit. Never cramped. |
| **One accent color** | Notion Blue (#0075de) is the sole primary accent. Used deliberately and sparingly. |

### The Shift (from current dark/cyber)

| Current (dark) | Target (Notion-warm) |
|---|---|
| `--bg-primary: #0a0e1a` | `--bg-primary: #ffffff` |
| `--text-primary: #e8ecf4` | `--text-primary: #1d1d1f` |
| `--accent-blue: #3b82f6` | `--accent: #0075de` (Notion Blue) |
| Glass morphism, gradients | Flat surfaces, subtle borders |
| Tight spacing (12px gutters) | Generous spacing (24–32px) |
| Phase timeline dots (complex) | Stacked pill status badges |

---

## 2. Design Tokens

All tokens are defined as CSS custom properties on `:root`. The canonical values live in a shared `design-tokens.css` file (to be created).

```css
:root {
  /* ── Canvas ── */
  --surface-page: #ffffff;
  --surface-card: #ffffff;
  --surface-alt: #f6f5f4;
  --surface-hover: #efeeec;
  --surface-sidebar: #f6f5f4;

  /* ── Text ── */
  --text-primary: #1d1d1f;
  --text-secondary: #6b6b6f;
  --text-muted: #9e9ea0;
  --text-inverse: #ffffff;
  --text-link: #0075de;

  /* ── Accent ── */
  --accent-blue: #0075de;
  --accent-blue-hover: #0060ba;
  --accent-blue-subtle: rgba(0, 117, 222, 0.08);
  --accent-blue-glow: rgba(0, 117, 222, 0.15);
  --accent-green: #0f7b3e;
  --accent-green-subtle: rgba(15, 123, 62, 0.08);
  --accent-amber: #b86900;
  --accent-amber-subtle: rgba(184, 105, 0, 0.08);
  --accent-red: #d93838;
  --accent-red-subtle: rgba(217, 56, 56, 0.08);

  /* ── Borders ── */
  --border-light: #e9e8e6;
  --border-default: #d3d1cb;
  --border-hover: #b8b6b0;
  --border-focus: #0075de;

  /* ── Radius ── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px; /* pills */

  /* ── Shadows ── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.10);

  /* ── Typography ── */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
  --font-size-xs: 0.72rem;
  --font-size-sm: 0.82rem;
  --font-size-base: 0.92rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-3xl: 2.5rem;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0em;
  --letter-spacing-wide: 0.04em;

  /* ── Spacing ── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* ── Transitions ── */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;

  /* ── Breakpoints ── (for reference, used in media queries) */
  /* sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px */
}
```

---

## 3. Color Palette

### Primary Canvas

| Token | Hex | Usage |
|---|---|---|
| `--surface-page` | `#ffffff` | Main page backgrounds |
| `--surface-alt` | `#f6f5f4` | Sidebar, section alt, modal backdrops |
| `--surface-card` | `#ffffff` | Card faces |
| `--surface-hover` | `#efeeec` | Card hover, button hover |
| `--surface-inverse` | `#1d1d1f` | Dark mode toggle surface (future) |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#1d1d1f` | Headings, body copy |
| `--text-secondary` | `#6b6b6f` | Subtle body, descriptions |
| `--text-muted` | `#9e9ea0` | Placeholders, captions |
| `--text-link` | `#0075de` | Links, clickable text |
| `--text-inverse` | `#ffffff` | Text on dark or accent backgrounds |

### Semantic Accents

| Color | Hex | Surface/Tint | Usage |
|---|---|---|---|
| Notion Blue | `#0075de` | `rgba(0,117,222,0.08)` | Primary action, links, selected states |
| Green | `#0f7b3e` | `rgba(15,123,62,0.08)` | Success, active campaigns, verified |
| Amber | `#b86900` | `rgba(184,105,0,0.08)` | Warning, draft status, attention needed |
| Red | `#d93838` | `rgba(217,56,56,0.08)` | Error, failed campaigns, destructive actions |
| Purple | `#6941c6` | `rgba(105,65,198,0.08)` | Premium features, AI-generated content |
| Teal | `#0b7b7b` | `rgba(11,123,123,0.08)` | Analytics, data visualisation |

### Border Colors

| Token | Hex | Usage |
|---|---|---|
| `--border-light` | `#e9e8e6` | Cards in default state, table rows |
| `--border-default` | `#d3d1cb` | Input fields, active card borders |
| `--border-hover` | `#b8b6b0` | Hover state borders |
| `--border-focus` | `#0075de` | Focus ring, active selection |

---

## 4. Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
```

**Inter** at weights 400, 500, 600, 700 — loaded from Google Fonts via `<link>` or `@import`. No serif/display fonts unless brand-specific landing pages demand them.

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--font-size-3xl` | 2.5rem (40px) | 700 | 1.2 | Page title / hero |
| `--font-size-2xl` | 2rem (32px) | 700 | 1.2 | Section heading |
| `--font-size-xl` | 1.5rem (24px) | 600 | 1.3 | Card title / modal title |
| `--font-size-lg` | 1.25rem (20px) | 600 | 1.4 | Subheading / panel title |
| `--font-size-md` | 1rem (16px) | 500 | 1.5 | Body text / nav items |
| `--font-size-base` | 0.92rem (~15px) | 400 | 1.5 | Default body copy |
| `--font-size-sm` | 0.82rem (~13px) | 400 | 1.5 | Secondary text |
| `--font-size-xs` | 0.72rem (~11.5px) | 500 | 1.4 | Badges, labels, metadata |

**Line lengths:** Body text should not exceed 72 characters per line (use `max-width: 65ch`).

---

## 5. Spacing & Layout

### Grid

Use a **12-column flexible grid** for page layouts:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6); /* 24px */
}
```

### Page Layout

```
┌─────────────────────────────────────────┐
│  Top Bar (48px)                         │  ← sticky, subtle border-bottom
├────────┬────────────────────────────────┤
│        │                                │
│ Sidebar│  Main Content Area             │
│ (240px)│  • 12-col grid inside          │
 │        │  • max-width: 1200px           │
│        │  • generous padding: 32px      │
│        │                                │
└────────┴────────────────────────────────┘
```

### Spacing Scale

| Token | Pixels | Rem | Common Use |
|---|---|---|---|
| `--space-1` | 4px | 0.25rem | Icon-inset padding |
| `--space-2` | 8px | 0.5rem | Badge padding, small gaps |
| `--space-3` | 12px | 0.75rem | Button padding (x), chip gap |
| `--space-4` | 16px | 1rem | Card padding, form label gap |
| `--space-5` | 20px | 1.25rem | Section padding (tight) |
| `--space-6` | 24px | 1.5rem | Grid gap, base section padding |
| `--space-8` | 32px | 2rem | Page padding, modal padding |
| `--space-10` | 40px | 2.5rem | Section margin-top |
| `--space-12` | 48px | 3rem | Large section separation |
| `--space-16` | 64px | 4rem | Hero / landing page margin |

---

## 6. Border & Radius

### Border Width

All borders are **1px** unless on focus rings (2px). No multi-pixel borders.

### Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Buttons, inputs, small elements |
| `--radius-md` | 8px | Standard cards, panels |
| `--radius-lg` | 12px | Large cards, dialogs |
| `--radius-xl` | 16px | Modals, page-level containers |
| `--radius-full` | 9999px | Pills, badges, tags |

### Notion-Typical Card

```css
.card {
  background: var(--surface-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}
.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}
```

---

## 7. Shadows & Elevation

Shadows are subtle (Notion-like). No dramatic drops or glowing effects.

| Token | Offset | Blur | Spread | Color | Opacity | Used On |
|---|---|---|---|---|---|---|
| `--shadow-sm` | 0 1px | 2px | 0 | rgb(0,0,0) | 0.04 | Default cards |
| `--shadow-md` | 0 2px | 8px | 0 | rgb(0,0,0) | 0.06 | Hovered cards, dropdowns |
| `--shadow-lg` | 0 4px | 16px | 0 | rgb(0,0,0) | 0.08 | Modals, elevated panels |
| `--shadow-xl` | 0 8px | 32px | 0 | rgb(0,0,0) | 0.10 | Toast notifications, popovers |

**Rule:** When elevating, increase shadow and border simultaneously (e.g., `border-hover` + `shadow-md`).

---

## 8. Iconography

Use **Lucide** (Notion's own icon set) for consistency. Import from `lucide-react` (React) or `https://unpkg.com/lucide-static` (vanilla).

- **Size:** 16px for inline, 20px for buttons, 24px for empty states
- **Stroke width:** 1.5px (Lucide default)
- **Color:** inherit from text color of parent; use `--text-muted` for decorative icons

### Common Icons Map

| Concept | Lucide Icon |
|---|---|
| Campaigns | `megaphone` |
| Analytics | `bar-chart-3` |
| Calendar | `calendar` |
| Creative | `image` |
| Settings | `settings` |
| Search | `search` |
| Plus (new) | `plus` |
| More (menu) | `more-horizontal` |
| Check | `check` |
| X (close) | `x` |
| Arrow right | `arrow-right` |
| Chevron down | `chevron-down` |
| External link | `external-link` |

---

## 9. Component Library

### 9.1 Card (Base)

```css
.card {
  background: var(--surface-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base), border-color var(--transition-base);
}
.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}
```

### 9.2 Pill Badge

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
  line-height: var(--line-height-tight);
  white-space: nowrap;
}
.pill--default {
  background: var(--surface-alt);
  color: var(--text-secondary);
}
.pill--blue {
  background: var(--accent-blue-subtle);
  color: var(--accent-blue);
}
.pill--green {
  background: var(--accent-green-subtle);
  color: var(--accent-green);
}
.pill--amber {
  background: var(--accent-amber-subtle);
  color: var(--accent-amber);
}
.pill--red {
  background: var(--accent-red-subtle);
  color: var(--accent-red);
}
```

### 9.3 Button

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `--accent-blue` | `--text-inverse` | None | Slightly darker blue |
| Secondary | Transparent | `--text-primary` | `--border-default` | `--surface-hover` bg |
| Ghost | Transparent | `--text-secondary` | None | `--surface-hover` bg |
| Danger | Transparent | `--accent-red` | None | `--accent-red-subtle` bg |

### 9.4 Input

```css
.input {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
}
.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--accent-blue-glow);
}
```

### 9.5 Campaign Card (SMMFactory-specific)

```
┌──────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐ │
│ │ Ref: KLEst   Active          ⬆ Edit │ │
│ │ Ko Lake Villa — Easter Push          │ │
│ ├──────────────────────────────────────┤ │
│ │ 💡 Ideation  🔍 Research  🎨 Creative│ │
│ │ ✅ Done      ✅ Done      ● Active   │ │
│ ├──────────────────────────────────────┤ │
│ │ Budget: $2,500   Spent: $1,200       │ │
│ │ Impressions: 45K  CTR: 2.3%          │ │
│ │ Next: Launch creative review         │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 9.6 Top Bar

```css
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 var(--space-6);
  background: var(--surface-page);
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 100;
}
```

### 9.7 Sidebar (for settings / navigation)

```css
.sidebar {
  width: 240px;
  background: var(--surface-alt);
  border-right: 1px solid var(--border-light);
  padding: var(--space-4);
  height: 100%;
  overflow-y: auto;
}
```

### 9.8 Empty State

```
┌──────────────────────────────────┐
│                                  │
│         📷 (icon, 48px)         │
│                                  │
│   No campaigns yet               │
│   Create your first campaign     │
│   to get started.                │
│                                  │
│   [ + New Campaign ]             │
│                                  │
└──────────────────────────────────┘
```

### 9.9 Toast / Notification

```css
.toast {
  background: var(--surface-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  animation: slideIn 200ms ease;
}
```

---

## 10. Accessibility

| Requirement | Standard |
|---|---|
| Color contrast | All text combos ≥ 4.5:1 (AA) for body, ≥ 3:1 for large text |
| Focus indicators | 2px `--border-focus` ring with 4px offset on all interactive elements |
| Touch targets | ≥ 44×44px for all interactive elements |
| Reduced motion | `@media (prefers-reduced-motion)` — disable CSS animations, transitions |
| Font scaling | Use rem units; respect browser default font size |
| Screen reader | All icon-only buttons have `aria-label`, all images have `alt` text |

---

## Appendix A: Notion-Warm Dark Mode (Future)

A future dark variant should NOT invert the palette blindly. Instead, target warm dark tones:

| Token | Light | Dark |
|---|---|---|
| `--surface-page` | `#ffffff` | `#1a1a1a` |
| `--surface-alt` | `#f6f5f4` | `#232323` |
| `--surface-card` | `#ffffff` | `#2a2a2a` |
| `--text-primary` | `#1d1d1f` | `#e8e8e8` |
| `--text-secondary` | `#6b6b6f` | `#a0a0a0` |
| `--border-light` | `#e9e8e6` | `#333333` |
| `--accent-blue` | `#0075de` | `#4a9eff` |

---

## Appendix B: Migration Plan (current → Notion-warm)

1. **Create `design-tokens.css`** with the Notion-warm token set
2. **Audit all components** for hardcoded colors → replace with custom properties
3. **Redesign Campaign Card** — flat card with pill badges, remove phase timeline dots
4. **Redesign Top Bar** — shorter (48px), cleaner, white background
5. **Update Summary Strip** — use metric cards with subtle borders, remove glowing effects
6. **Flatten the AG Prompt** — remove glass morphism, use white card with border
7. **Add dark mode support** (optional, future)

---

> **Last updated:** July 2026  
> **Status:** Design specification — tokens ready for implementation
