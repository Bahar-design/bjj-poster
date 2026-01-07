# AthleteInfoFields Component Design

**Issue:** ODE-68 - UI-BLD-004: Athlete Info Form Fields
**Date:** 2026-01-07

## Summary

Create form fields for athlete name, belt rank, and team with real-time validation and auto-save to Zustand store with localStorage persistence.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Vertical stack | Simple, mobile-friendly, consistent with form conventions |
| Belt indicator | Colored circle + text | Accessible, works at small sizes |
| Validation timing | On blur + submit | Standard UX, doesn't interrupt typing |
| Auto-save feedback | Silent (none) | Less visual noise, transparent persistence |

## Component Structure

**Location:** `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`

```
┌─────────────────────────────────┐
│ Athlete Name *                  │
│ ┌─────────────────────────────┐ │
│ │ [text input]                │ │
│ └─────────────────────────────┘ │
│ (error message if invalid)      │
│                                 │
│ Belt Rank *                     │
│ ┌─────────────────────────────┐ │
│ │ ● White            ▼        │ │
│ └─────────────────────────────┘ │
│                                 │
│ Team (Optional)                 │
│ ┌─────────────────────────────┐ │
│ │ [text input]                │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Field Specifications

### Athlete Name
- Type: Text input
- Required: Yes
- Max length: 50 characters
- Validation: On blur, show inline error

### Belt Rank
- Type: Select dropdown
- Required: Yes (always has selection)
- Default: "white"
- Options with color indicators:

| Value | Display | Color (Tailwind) |
|-------|---------|------------------|
| white | White | `bg-gray-100 border` |
| blue | Blue | `bg-blue-600` |
| purple | Purple | `bg-purple-600` |
| brown | Brown | `bg-amber-800` |
| black | Black | `bg-black` |
| red-black | Red/Black | gradient `from-red-600 to-black` |
| red | Red | `bg-red-600` |

### Team
- Type: Text input
- Required: No (optional)
- Max length: 50 characters

## Validation Schema

**Location:** `apps/web/lib/validations/athlete-info.ts`

```typescript
const athleteInfoSchema = z.object({
  athleteName: z.string()
    .min(1, 'Athlete name is required')
    .max(50, 'Name must be 50 characters or less'),
  beltRank: z.enum(['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red']),
  team: z.string()
    .max(50, 'Team must be 50 characters or less')
    .optional()
    .or(z.literal(''))
});
```

## Data Flow

```
User types → Local state (immediate) → Debounce 300ms → store.setField() → localStorage
```

**On Mount:**
- Store auto-rehydrates from localStorage
- Local state initializes from store values

**On Change:**
- Local state updates immediately (responsive UI)
- Debounced sync to Zustand store after 300ms
- No visible save indicator

## Accessibility

- Labels linked via `htmlFor`/`id`
- Required fields: `aria-required="true"`
- Error messages: `aria-describedby` linking
- Belt dropdown: Keyboard navigable (Radix Select)

## Error Handling

- Inline error messages below fields in `text-destructive`
- Error clears when user starts typing
- Re-validates on blur
- Whitespace-only names treated as empty (trimmed)

## Testing Strategy

**Test File:** `apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

### Test Cases

1. **Rendering**
   - All three fields render with labels
   - Belt dropdown shows all 7 options
   - Team shows "(Optional)" indicator

2. **Validation**
   - Error on empty athlete name (blur)
   - Error on name > 50 chars
   - Error on team > 50 chars
   - No error for empty team

3. **Store Integration**
   - Fields initialize from store
   - Debounced updates call `setField`
   - Belt selection updates immediately

4. **Accessibility**
   - Labels associated with inputs
   - Errors linked via aria-describedby

## Files to Create/Modify

| File | Action |
|------|--------|
| `apps/web/components/builder/athlete-info/athlete-info-fields.tsx` | Create |
| `apps/web/components/builder/athlete-info/index.ts` | Create |
| `apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx` | Create |
| `apps/web/lib/validations/athlete-info.ts` | Create |
| `apps/web/components/builder/index.ts` | Modify (add export) |
