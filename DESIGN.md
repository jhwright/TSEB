# Design System — Threshold Singers East Bay (TSEB)

## Product Context
- **What this is:** Mobile-first web app for coordinating volunteer bedside singing at care facilities
- **Who it's for:** Women in their 60s who coordinate outreach, scheduling, and singer assignments
- **Space/industry:** Volunteer coordination, nonprofit, bedside singing (Threshold Choir network)
- **Project type:** Mobile-first web app (no build step, static HTML + Supabase)

## Aesthetic Direction
- **Direction:** Organic/Natural
- **Decoration level:** Minimal — typography and color do the work, no decorative elements
- **Mood:** Warm, approachable, trustworthy. Like a well-organized community bulletin board, not a tech product. Every screen should feel like someone is guiding you by the hand.
- **Reference sites:** None — this fills a genuine gap. No existing choir or volunteer management tool targets this demographic.

## Typography
- **Display/Hero:** Source Serif 4 — warm serif for headers. Feels human and literary, not corporate. Signals "we're people, not software." Pairs with the choir's identity of warmth and care.
- **Body:** Source Sans 3 — clean, highly legible, designed for UI. Excellent at 18px+ for aging eyes. Free on Google Fonts.
- **UI/Labels:** Source Sans 3 Semibold
- **Data/Tables:** Source Sans 3 with font-variant-numeric: tabular-nums
- **Code:** N/A (no code displayed in this app)
- **Loading:** Google Fonts CDN: `https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:wght@400;600;700&display=swap`
- **Scale:**
  - xs: 13px — badges, timestamps
  - sm: 15px — secondary labels, card details
  - base: 18px — body text, form inputs (minimum readable size for 60+ users)
  - lg: 20px — card titles, section headers
  - xl: 24px — page titles
  - 2xl: 28px — hero/display text
  - 3xl: 36px — large display (used sparingly)

## Color
- **Approach:** Restrained — one accent + warm neutrals. Color is rare and meaningful.
- **Primary:** `#4a6741` — Threshold Choir green. Trust, nature, calm. Used for header, active tab, primary buttons, focus indicators.
- **Primary Light:** `#e8f0e6` — subtle green tint for active tab background, success highlights.
- **Accent:** `#C67B3C` — warm amber. Urgency without alarm. Used for overdue items, follow-up callouts, CTAs that need attention. Deliberate departure from clinical blue/green palettes.
- **Accent Light:** `#FFF3E0` — warm background tint for overdue cards and warning callouts.
- **Background:** `#FAF8F5` — warm off-white. Not stark white. Reduces eye strain, easier on aging eyes.
- **Surface:** `#FFFFFF` — white cards on warm background for visual lift.
- **Text:** `#1A1A1A` — near-black. 7:1+ contrast ratio on both backgrounds (WCAG AAA).
- **Muted:** `#6B7280` — cool gray for secondary text. 4.5:1 on white (WCAG AA).
- **Border:** `#E5E5E0` — warm gray for card borders and dividers.
- **Semantic:**
  - Success: `#2D6A4F` / light: `#e8f5e9`
  - Warning: `#C67B3C` / light: `#FFF3E0` (same as accent)
  - Error: `#B91C1C` / light: `#FEE2E2`
  - Info: `#1E5F8A` / light: `#E0F2FE`
- **Dark mode:** Not planned for v1. If added later: reduce saturation 10-20%, use `#1A1A1A` background, `#2A2A2A` surfaces, lighten text to `#F0EDE8`.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — more padding than typical. Accommodates larger touch targets (min 48px) and reduces visual crowding for older users.
- **Scale:** 2xs(4) xs(8) sm(12) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **Card padding:** 20px (comfortable reading area)
- **Form input padding:** 14px 16px (large enough for easy tapping)
- **Section spacing:** 48px between major sections, 16px between cards

## Layout
- **Approach:** Grid-disciplined, single-column on mobile
- **Mobile (375px):** Full-width cards, single column. This is the primary viewport.
- **Tablet (640px):** 2-column card grid for outreach and singers. Schedule stays single column.
- **Desktop (1024px):** Centered container, max-width 768px. No sidebar — keep the mobile mental model.
- **Max content width:** 480px mobile, 768px desktop
- **Border radius:** sm(6px) for buttons/inputs, md(12px) for cards, lg(16px) for modals/containers
- **Navigation:** 3 bottom-aligned tabs (Outreach, Schedule, Singers). Always visible. Text + icon labels. Active tab: green text + green bottom border + light green background.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension. Seniors find unexpected or bouncy animation disorienting.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(100ms) for button press, short(150ms) for toast appear, medium(200ms) for page transitions
- **Specific animations:**
  - Button press: `transform: scale(0.98)` over 100ms
  - Toast banner: slide in from top, 150ms ease-out. Auto-dismiss after 4 seconds with fade-out.
  - Full-screen form: slide in from right, 200ms ease-out. Back: slide out to right.
  - Tab switch: instant (no animation — seniors expect immediate response to taps)
- **Reduced motion:** Respect `prefers-reduced-motion: reduce`. Disable all animations except opacity changes.

## Accessibility
- **Contrast:** 7:1 minimum for all text (WCAG AAA)
- **Touch targets:** 48x48px minimum, 12px spacing between targets
- **Focus indicators:** 3px outline in primary green (#4a6741), visible on all interactive elements
- **Keyboard:** Tab through interactive elements, Enter/Space to activate, Escape to close
- **ARIA:** nav landmark for tabs, main for content, role="dialog" for forms, descriptive aria-labels on all buttons
- **Font size:** Never below 13px. Body text 18px minimum.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Initial design system created | Created by /design-consultation based on office-hours product context and design review decisions |
| 2026-03-23 | Source Serif 4 for display | Warm serif signals "people, not software" — deliberate departure from sans-serif-only app convention |
| 2026-03-23 | Warm amber (#C67B3C) accent | Urgency without alarm. Deliberate departure from clinical blue/green palettes common in care/health apps |
| 2026-03-23 | Warm off-white (#FAF8F5) background | Reduces eye strain for aging eyes. Standard for health/care apps but rarely done in web apps |
| 2026-03-23 | No dark mode in v1 | Primary users don't typically use dark mode. Can be added as Phase 2 |
| 2026-03-23 | Minimal motion only | Evidence-based: unexpected motion is disorienting for seniors. Only functional transitions |
