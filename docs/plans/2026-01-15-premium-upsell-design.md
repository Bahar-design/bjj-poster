# Premium Upsell Flow Design

**Date:** 2026-01-15
**Status:** Approved
**Tone:** Subtle & Sophisticated - Gold accents, soft animations, premium feel without being pushy

## Overview

Implement premium upsell touchpoints throughout the builder flow to alert non-paid users about services available when they upgrade. The goal is education and awareness, not aggressive conversion.

## Components

### 1. Enhanced QuotaBadge

**Location:** Builder header (`components/builder/quota-badge.tsx`)

**Behavior by usage threshold:**
- **< 50%:** No change - passive display
- **≥ 50%:** Clickable, subtle gold border, tooltip with "Running low? Upgrade for more"
- **≥ 80%:** Crown icon fades in, tooltip: "1 poster left · Upgrade to Pro"

**Visual:**
- Gold border: `border-gold-500/30`
- Crown icon: 12px, `text-gold-500/70`
- Hover reveals tooltip with "View Plans →" link
- Transition: `transition-all duration-300`

**Analytics:** `quota_badge_upgrade_clicked`

---

### 2. Premium Feature Teaser Strip

**Location:** Builder page, below header, above form (`components/builder/premium-feature-strip.tsx`)

**Content:**
```
🔒 HD Export  ·  🔒 No Watermark  ·  🔒 Background Removal  →  Unlock with Pro
```

**Visual:**
- Height: ~40px
- Background: `bg-surface-900/50`, `border border-surface-800`
- Lock icons: 12px, `text-surface-500`
- Feature text: `text-surface-400`, text-xs
- CTA: `text-gold-500` with hover glow
- Entrance: fade-in + translate-y, staggered after header

**Behavior:**
- Only shown to free tier users
- Dismissible (X button), persisted to localStorage for session
- Reappears next visit

**Analytics:** `feature_teaser_viewed`, `feature_teaser_clicked`, `feature_teaser_dismissed`

---

### 3. Template Premium Badges

**Location:** Template cards (`components/builder/template-selector/template-card.tsx`)

**Data Change:**
- Add `tier?: 'free' | 'pro' | 'premium'` to Template type (defaults to `'free'`)

**Visual:**
- Badge position: Top-left corner
- Pro: `bg-gold-500/20 text-gold-400 border border-gold-500/30`, text-xs, rounded-full
- Premium: Same + tiny Crown icon (10px)
- Locked overlay on hover: `bg-surface-950/40` with centered lock icon
- Template preview remains visible (not blurred)

**Behavior:**
- Free user clicks Pro/Premium template → `UpgradePrompt` modal (existing component)
- Template remains unselected until upgrade or free template selected
- Source: `template_selection`

**Data:** Hardcode 2-3 templates as `pro` tier initially

---

### 4. Output Quality Preview Card

**Location:** Builder page, above Generate button (`components/builder/output-quality-card.tsx`)

**Content:**
```
Your poster
720p · Watermarked

────────────────────

⚡ Pro: 1080p HD · No watermark
👑 Premium: 4K Ultra HD · Custom branding
                                 Compare →
```

**Visual:**
- Card: `bg-surface-900/30 border border-surface-800 rounded-lg p-4`
- "Your poster": `text-surface-400` with amber undertone
- Divider: `border-dashed border-surface-700`
- Pro/Premium: `text-surface-300` with tier icons
- "Compare →": `text-gold-500 text-sm` → `/pricing`

**Behavior:**
- Static, no dismiss (informational)
- Only shown for `subscriptionTier === 'free'`

**Analytics:** `output_preview_compare_clicked`

---

### 5. Strategic Upgrade Banners

**Location:** Contextual moments in builder flow

**Trigger 1: After Photo Upload**
- Location: Below uploaded photo preview
- Message: "Great shot! Pro users get automatic background removal"
- "Learn more" → `/pricing`
- Auto-dismisses after 8 seconds

**Trigger 2: After 2nd Poster (Dashboard)**
- Location: Dashboard welcome section
- Message: "You're on a roll! Upgrade for unlimited posters"
- Shown once when `postersThisMonth === 2`

**Visual:**
- Reuse `UpgradePrompt` with `variant="banner"`
- Animation: `animate-in slide-in-from-top-2`
- Dismissible with fade-out

**State:**
- Track shown banners in component state (not persisted)
- Keys: `photo_upload_banner`, `second_poster_banner`
- Once dismissed/auto-hidden, doesn't reappear in session

**Analytics:** `contextual_banner_viewed`, `contextual_banner_clicked`, `contextual_banner_dismissed`

---

## Files to Create/Modify

**New Files:**
- `components/builder/premium-feature-strip.tsx`
- `components/builder/output-quality-card.tsx`

**Modified Files:**
- `components/builder/quota-badge.tsx` - Add upgrade behavior
- `components/builder/template-selector/template-card.tsx` - Add tier badges
- `components/builder/photo-upload/photo-upload-zone.tsx` - Add contextual banner
- `app/builder/page.tsx` - Add feature strip and output card
- `app/dashboard/page.tsx` - Add second poster banner
- `lib/types/api.ts` - Add `tier` to Template type

---

## Design Principles

1. **Educate, don't shame** - "Here's what you get" not "You're missing out"
2. **Respect user choice** - Dismissible where appropriate
3. **Progressive disclosure** - More urgency only as limits approach
4. **Visual consistency** - Gold accents tie into championship aesthetic
5. **Non-blocking** - Never interrupt the creation flow
