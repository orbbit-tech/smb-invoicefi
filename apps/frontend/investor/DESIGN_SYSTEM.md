# Orbbit Invest - Clean Dashboard Design System

This document outlines the design system principles and implementation guidelines for the Orbbit Invest investor application, following "Clean Dashboard Design" best practices.

## Design Principles

### 1. Neutral Base with Brand Accents
- **Primary Teal**: Used sparingly for CTAs, active states, and brand moments
- **Slate Palette**: Clean, professional neutral base for all UI elements
- **Semantic Colors**: Success (green), warning (amber), destructive (red) - all calibrated for clarity

### 2. Clear Visual Hierarchy
- Consistent typography scale from xs (12px) to 3xl (30px)
- Strategic use of font weights (regular, medium, semibold, bold)
- Proper line heights for readability

### 3. Consistent 8px Spacing Grid
All spacing is based on multiples of 8px for visual rhythm and balance.

## Color System

### Brand Colors
```css
--primary: hsl(180, 85%, 32%)        /* Orbbit Teal - Main brand */
--primary-foreground: hsl(0, 0%, 100%)
```

### Neutral Palette (Slate)
```css
--background: hsl(0, 0%, 100%)
--foreground: hsl(215, 20%, 17%)     /* Deep professional gray */
--muted: hsl(210, 20%, 98%)          /* Subtle backgrounds */
--muted-foreground: hsl(215, 16%, 47%)
--border: hsl(214, 32%, 91%)         /* Clean borders */
```

### Semantic Colors
```css
--success: hsl(142, 71%, 45%)        /* Professional green */
--warning: hsl(38, 92%, 50%)         /* Golden amber */
--destructive: hsl(0, 72%, 51%)      /* Balanced red */
```

## Typography

### Scale
- **text-3xl (30px)**: Page titles
- **text-2xl (24px)**: Section headers
- **text-xl (20px)**: Card titles, subsection headers
- **text-lg (18px)**: Emphasized body text
- **text-base (16px)**: Body text (default)
- **text-sm (14px)**: Secondary text, descriptions
- **text-xs (12px)**: Captions, helper text

### Font Weights
- **font-normal (400)**: Regular text
- **font-medium (500)**: Slightly emphasized labels
- **font-semibold (600)**: Section headers, important labels
- **font-bold (700)**: Page titles, major emphasis

### Line Heights
- **leading-tight (1.25)**: Headings
- **leading-snug (1.375)**: Subheadings
- **leading-normal (1.5)**: Body text (default)
- **leading-relaxed (1.625)**: Comfortable reading

## Spacing System

All spacing follows an 8px grid:

### Key Spacing Values
- **space-2 (8px)**: Tight spacing between related elements
- **space-4 (16px)**: Standard gaps between elements, grid gaps
- **space-6 (24px)**: Card padding, section internal spacing
- **space-8 (32px)**: Section spacing, page margins
- **space-12 (48px)**: Major section breaks

### Usage Guidelines
```tsx
// Card padding
<Card className="p-6">  {/* 24px padding */}

// Element gaps
<div className="grid gap-4">  {/* 16px gaps */}

// Section spacing
<div className="space-y-8">  {/* 32px between sections */}

// Page padding
<div className="px-8 py-8">  {/* 32px padding */}
```

## Component Patterns

### Cards
```tsx
// Standard card with consistent padding
<Card className="p-6 transition-all duration-200 hover:shadow-md">
  <div className="text-sm font-medium text-muted-foreground mb-2">
    Label
  </div>
  <div className="text-3xl font-bold text-foreground leading-tight">
    Value
  </div>
</Card>
```

### MetricCard
```tsx
<MetricCard
  title="Total Value Locked"
  value="$2.1M"
  description="All time"
  iconType="trending-up"
  interactive={false}
/>
```

### Navigation Active States
- Background: `bg-primary/10`
- Text: `text-primary`
- Left border accent: `before:w-1 before:bg-primary`
- Shadow: `shadow-sm`

### Buttons
```tsx
// Primary CTA
<Button className="font-semibold">
  Action
</Button>

// Secondary
<Button variant="outline" className="font-semibold">
  Secondary Action
</Button>
```

## Layout Guidelines

### Max Width Container
All content uses `max-w-7xl` (1400px) for optimal readability

### Horizontal Padding
- Desktop: `px-8` (32px)
- Mobile: `px-4` (16px)

### Header
- Height: `h-20` (80px)
- Border bottom: `border-b border-border`
- Backdrop blur for depth

## Interactive States

### Hover Effects
```tsx
// Cards
transition-all duration-200 hover:shadow-md

// Interactive metrics
hover:scale-[1.02]

// Buttons (handled by UI library)
```

### Focus States
All interactive elements use the `ring` color (primary teal) for focus indication

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators on all interactive elements
- Semantic HTML structure
- ARIA labels where appropriate

## Best Practices

### Do's
✅ Use consistent 24px (p-6) card padding
✅ Maintain 8px spacing multiples
✅ Apply subtle hover effects for interactivity
✅ Use semantic color meanings correctly
✅ Follow typography hierarchy strictly

### Don'ts
❌ Mix different padding values arbitrarily
❌ Use primary color for everything
❌ Create custom spacing that breaks the 8px grid
❌ Overuse animations or transitions
❌ Ignore mobile responsiveness

## Component Checklist

When creating new components:

1. **Spacing**: Uses 8px grid multiples?
2. **Typography**: Follows established scale?
3. **Colors**: Uses design tokens, not hardcoded values?
4. **Hover States**: Subtle and professional?
5. **Accessibility**: Proper contrast and focus states?
6. **Responsiveness**: Works on mobile and desktop?
7. **Consistency**: Matches existing patterns?

## Resources

### Files
- Color system: `libs/frontend/ui/src/theme/globals.css`
- Typography & spacing: `libs/frontend/ui/src/theme/theme.css`
- UI components: `libs/frontend/ui/src/component/`

### Examples
- Dashboard Home: `apps/frontend/investor/src/app/(dashboard)/(main)/page.tsx`
- Marketplace: `apps/frontend/investor/src/app/(dashboard)/marketplace/page.tsx`
- Portfolio: `apps/frontend/investor/src/app/(dashboard)/portfolio/page.tsx`

---

**Last Updated**: 2025-10-09
**Version**: 1.0
