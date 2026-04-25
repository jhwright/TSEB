# Design System — Threshold Singers East Bay (TSEB)

## Product Context
- **What this is:** Mobile-first web app for coordinating volunteer bedside singing at care facilities
- **Who it's for:** Coordinators (often women in their 60s) who manage outreach, scheduling, and singer assignments
- **Space/industry:** Volunteer coordination, nonprofit, bedside singing (Threshold Choir network)
- **Project type:** Mobile-first web app (no build step, static HTML + Supabase)

## Aesthetic Direction
- **Direction:** **Plainchant** — warm manuscript, cream paper, ochre accent
- **Mood:** Quiet, contemplative, handcrafted. Feels like a chapter ledger, not a tech product. Italic Spectral display copy gives the app a literary, prayerful feel.
- **Decoration level:** Minimal, near-flat. No drop shadows except the FAB and map pins. Borders and dotted dividers do the visual work.
- **Reference:** Manuscript page; bone parchment; pen-and-ink ledger.
- **Source:** Design handoff `design_handoff_tseb_redesign/TSEB Alternative Designs v4.html` (Plainchant lead direction).

## Tokens (CSS variables)

All tokens are scoped under `.dir-plainchant` on `<body>`. Tokens are also aliased in `:root` for legacy compatibility.

```css
.dir-plainchant {
  --paper:    #f7f1e6;   /* base background */
  --paper-2:  #efe6d4;   /* card hover, subtle band */
  --paper-3:  #e6dcc4;   /* avatar fill, deepest paper */
  --ink:      #271d12;   /* primary text */
  --ink-soft: #5d4f3c;   /* secondary text */
  --ink-faint:#8c7e6a;   /* tertiary text, eyebrow */
  --rule:     #b9a886;   /* primary divider */
  --rule-soft:#d4c5a4;   /* dotted/inner divider */
  --accent:     #a36a2c; /* warm ochre — primary action color */
  --accent-soft:#e3c790; /* accent tint */
  --accent-deep:#7a4c1a; /* accent on hover, links */
  --warning:    #a83c2a; /* overdue / urgent */
  --warning-soft:#e9b8ad;
  --radius: 1px;         /* near-square corners throughout */
}
```

## Status pill colors

Status hues are constants — same across all directions.

| Status      | Hex        | Use                          |
|-------------|------------|------------------------------|
| Active      | `#6f7d5e`  | sage — currently singing     |
| Talking     | `#c79436`  | ochre — in conversation      |
| Site Visit  | `#b58348`  | warm tan — visit scheduled   |
| Initial     | `#7a8aa3`  | cool blue — first contact    |
| Hold        | `#8e8576`  | warm gray — paused           |
| Previous    | `#6c6557`  | graphite — past relationship |
| Inactive    | `#a4674a`  | rust — closed                |

## Typography

- **Display / body:** **Spectral** — italic for headlines and decorative copy, regular for body. Loaded weights: 300/400/500/600.
- **UI / labels / buttons / smcaps:** **Inter** — 400/500/600. Used in eyebrow text, smcaps labels, button text, status pills.
- **Mono / phone numbers:** **JetBrains Mono** — 400/500. Used for `tel:` numbers and any tabular data.
- **Fallbacks:** Cormorant Garamond + Cardo are loaded for the Vespers/Nightfall directions; not used in Plainchant.
- **Loading:** Single Google Fonts CDN call in `<head>`.
- **Type scale (px):**
  - Eyebrow / smcaps: 9–11 (letter-spacing .18–.22em, uppercase)
  - Body: 13–15
  - Sub-display (italic): 17–22
  - Display (italic): 24–48
  - Hero (italic): 60+ (sign-in only, used sparingly)

## Spacing & rhythm

- **Base unit:** 4px
- **Card horizontal padding:** 22px
- **Card vertical padding:** 14–18px
- **Section dividers:**
  - Inner row: `1px dotted var(--rule)`
  - Section: `1px solid var(--rule)`
  - App header bottom: `3px double var(--rule)` (Plainchant signature)

## Borders & corners

- **Radius:** 1–2px on buttons/inputs/cards (intentionally near-square — manuscript-feel)
- **Pills (status, chips):** `999px` (capsule)
- **Avatars:** `50%` (circle)

## Shadows

The aesthetic is flat. Two exceptions:
- Map pin: `0 2px 8px rgba(0,0,0,.12)`
- FAB: `0 4px 14px rgba(0,0,0,.12)`

## Layout

- **Approach:** Mobile-first, single-column. Fixed phone-style frame on tablet/desktop.
- **Mobile (default):** 390px content width, full-bleed cards.
- **Tablet (640px+):** Cream surround (`--paper-2`), 480px max-width centered phone column.
- **Desktop (1024px+):** Same — centered 480px column. No sidebar.
- **Phone frame (when shown):** 390 × 780px in design canvas; production lets it grow with viewport.
- **Tab bar:** 72px tall, fixed bottom, `1px solid var(--rule)` top border, active tab gets a 2px `var(--accent)` top accent.
- **FAB:** 52px circle, bottom-right, 18px right + 88px bottom (clears tab bar).

## Navigation

- **3 tabs:** Outreach (I) · Schedule (II) · Singers (III).
- **Tab icons:** Roman numerals in italic Spectral display — part of the manuscript aesthetic.
- **Active state:** ink color text + 2px ochre top border. Inactive: `--ink-faint` text, no border.

## Forms

- **Inputs:** Borderless, `1px solid var(--ink)` underline only. No rounded boxes.
- **Focus:** underline color shifts to `var(--accent)`.
- **Labels:** eyebrow smcaps (Inter 10px, .22em letter-spacing).
- **Textareas:** italic Spectral body in `--ink-soft` for placeholder voice.
- **Primary action:** full-width `.btn .btn-accent` at the bottom — ochre fill, paper text, smcaps.

## Buttons

- **Default:** transparent, `1px solid var(--rule)`, smcaps Inter 11px.
- **Accent / primary:** ochre fill (`var(--accent)`), paper text. Hover deepens to `--accent-deep`.
- **Status pills:** outlined capsule with colored dot. Active state inverts to ink fill / paper text.

## Motion

- **Approach:** Minimal-functional. Only transitions that aid comprehension.
- **Durations:** micro (100ms) for button press, short (150ms) toast, medium (200ms) page transition.
- **Specific:**
  - Button press: `transform: scale(0.98)` over 100ms
  - Toast: slide down + fade, 200ms ease-out, auto-dismiss 4s
  - Modal: slide in from right, 200ms ease-out
  - Tab switch: instant
- **Reduced motion:** All animations disabled when `prefers-reduced-motion: reduce`.

## Accessibility

- **Contrast:** ink on paper exceeds 7:1 (WCAG AAA) for body text. `--ink-soft` on paper passes AA at 4.5:1+.
- **Touch targets:** 44x44px minimum (tab bar entries are 72px tall, comfortably above).
- **Focus indicators:** 2px outline in `var(--accent)`, offset 2px.
- **Keyboard:** Tab, Enter/Space to activate, Escape to close modals.
- **ARIA:** `nav` for tabs, `main` for content, descriptive `aria-label`s on icon-only buttons, `aria-hidden` on decorative SVG.
- **Min font size:** 13px (italic body footnote). Body text 15–17px.

## Assets

- **No raster images.** All visuals are inline SVG glyphs or Leaflet tiles.
- **Sign-in glyph:** Concentric circles + crosshairs + italic "ts" centered.
- **Map tiles:** CartoDB Light. Custom `divIcon` pins with italic display number + smcaps date.

## Decisions Log

| Date       | Decision                                              | Rationale                                                                 |
|------------|-------------------------------------------------------|---------------------------------------------------------------------------|
| 2026-03-23 | Initial system created (Source Serif + green)         | First-pass design tied to office-hours product context                    |
| 2026-04-25 | Replaced with **Plainchant** manuscript direction     | Per design handoff — three explored directions, Plainchant chosen as lead |
| 2026-04-25 | Spectral italic for display, Inter for UI             | Manuscript feel without sacrificing UI legibility                         |
| 2026-04-25 | Cream paper `#f7f1e6` background                      | Warmer than off-white; reduces eye strain; aligns with manuscript aesthetic |
| 2026-04-25 | Ochre `#a36a2c` accent (replaces green)               | Warm, prayerful; deliberate departure from clinical care-app palettes     |
| 2026-04-25 | Roman numeral tab icons in italic Spectral            | Reinforces manuscript identity in the navigation chrome                   |
| 2026-04-25 | 1–2px radii throughout (near-square)                  | Manuscript-page feel; rounded corners would soften the typographic voice  |
| 2026-04-25 | No dark mode in v1 (Nightfall available as alt)       | Coordinators don't typically use dark mode; can ship later if requested   |
