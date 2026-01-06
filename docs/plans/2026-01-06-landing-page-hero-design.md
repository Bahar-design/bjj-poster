# Landing Page Hero & CTA Design

**Issue:** ODE-62 - UI-LND-001: Landing Page Hero & CTA
**Date:** 2026-01-06
**Status:** Approved

## Summary

Create an engaging landing page with hero section, example posters, "How It Works" steps, and CTA to drive signups.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Example images | Local static with Next.js Image | Best LCP performance |
| Hero layout | Split (text left, posters right) | Classic SaaS pattern, CTA visible |
| Poster arrangement | Fanned/overlapping cards | Visual interest, implies variety |
| How It Works | Horizontal steps with icons | Scannable, familiar pattern |
| Social proof | Simple text badge | Practical for MVP |

## Page Structure

```
┌─────────────────────────────────────────┐
│  Hero Section (full viewport height)    │
│  ┌─────────────────┬───────────────────┐│
│  │  Text Content   │  Poster Display   ││
│  │  - Badge        │  (fanned cards)   ││
│  │  - H1 Headline  │                   ││
│  │  - Subheadline  │                   ││
│  │  - CTA Button   │                   ││
│  └─────────────────┴───────────────────┘│
├─────────────────────────────────────────┤
│  "How It Works" Section                 │
│  ┌─────────┬─────────┬─────────┐        │
│  │ Step 1  │ Step 2  │ Step 3  │        │
│  └─────────┴─────────┴─────────┘        │
├─────────────────────────────────────────┤
│  Footer CTA (secondary)                 │
└─────────────────────────────────────────┘
```

## Hero Section

### Content
- **Badge:** "Free to use" pill badge above headline
- **H1:** "Create Tournament Posters in Minutes"
- **Subheadline:** "Design professional BJJ competition posters with your photos. No design skills needed."
- **Primary CTA:** "Get Started Free" button -> `/auth/signup`

### Styling
- Dark background (`primary-900`)
- White headline text with `font-display`
- Gold accent on badge (`accent-gold`)
- Primary button using shadcn Button component

## Fanned Poster Display

### Arrangement
Three poster images with fanned effect:
- Rotations: -6deg, 0deg, +6deg (back to front)
- Slight horizontal/vertical offsets for depth
- Box shadow for card depth effect
- Aspect ratio: 3:4

### Images
- Location: `public/images/examples/poster-1.jpg`, `poster-2.jpg`, `poster-3.jpg`
- Size: ~600x800px source images
- Next.js `Image` with `priority` for LCP
- Placeholder: `blur` with generated blur data URL

### Interactions
- Desktop hover: slight scale increase
- Front poster lifts on hover

### Mobile
- Scale down proportionally
- Below 640px: stack below hero text

## How It Works Section

### Steps
1. **Upload Photo** (Camera icon) - "Add your athlete photo or use one from your gallery"
2. **Choose Template** (Palette icon) - "Pick from professionally designed tournament layouts"
3. **Download & Share** (Download icon) - "Export high-quality images ready for print or social media"

### Styling
- Background: `primary-800` for section separation
- Icons: Lucide icons at 48px in circular containers
- Icon containers: `primary-700` background with gold border
- Step numbers: Small badge on icon containers
- Connecting arrows: Dashed lines between steps (hidden on mobile)
- Padding: `py-20`

### Mobile
- Stack vertically at < 768px
- Arrows become downward-pointing

## Footer CTA Section

- Centered text: "Ready to create your first poster?"
- Large CTA button: "Get Started Free" -> `/auth/signup`
- Background: `primary-900`
- Padding: `py-16`

## Accessibility (WCAG 2.1 AA)

- Semantic HTML: `<main>`, `<section>`, `<h1>`/`<h2>` hierarchy
- All images: Descriptive `alt` text
- CTA buttons: Clear, descriptive text
- Focus states: Visible ring on interactive elements
- Color contrast: White on `primary-900` = ~12:1 ratio
- Skip link: Hidden link to main content

## Performance (LCP < 2.5s)

- Hero poster images: `priority` prop
- Next.js Image: Automatic WebP/AVIF, responsive srcset
- Fonts: `display: swap` configured
- Minimal client components
- Appropriate image sizes per viewport

## Files to Create/Modify

- `apps/web/app/page.tsx` - Main landing page
- `apps/web/public/images/examples/` - Poster placeholder images
- `apps/web/components/landing/` - Landing page components (optional extraction)
