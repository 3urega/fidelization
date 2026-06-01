# Style Guidelines

## Purpose

This document defines the visual and UI implementation rules for the application.

Its goal is to ensure that the UI is:

* Consistent
* Fully theme-driven
* Scalable for multi-tenant branding
* Free of hardcoded styling decisions

All UI development must strictly follow these rules.

---

# 1. No Hardcoded Colors

❌ Forbidden:

```tsx
className="bg-purple-600 text-gray-900"
```

```tsx
style={{ color: "#7C3AED" }}
```

---

✅ Required:

```tsx
className="bg-primary text-foreground"
```

or:

```tsx
style={{ color: "var(--color-primary)" }}
```

---

# 2. All Styling Must Be Theme-Based

All visual properties must come from:

* CSS variables
* Theme tokens
* Design system configuration

Allowed variables:

* `--color-primary`
* `--color-secondary`
* `--color-background`
* `--color-foreground`
* `--border-radius`
* `--font-family`

---

# 3. Component Design Rules

Components must be:

## 3.1 Stateless in appearance

UI components must NOT define their own colors or branding.

They only consume theme values.

## 3.2 Reusable across tenants

A component must look correct in:

* Coffee shop theme
* Bakery theme
* Minimal theme
* Dark theme (future)

---

# 4. Tailwind Usage Rules

Tailwind can be used ONLY for:

* layout (flex, grid)
* spacing (padding, margin)
* positioning
* typography structure

❌ NOT allowed:

* hardcoded colors
* hardcoded background colors
* hardcoded border colors

---

# 5. Design Consistency Rules

## Border Radius

Must always use:

```css
var(--border-radius)
```

No custom rounding per component.

---

## Spacing

Use Tailwind spacing scale consistently.

Do not create arbitrary spacing values unless justified.

---

## Typography

Font family must come from:

```css
var(--font-family)
```

No per-component font overrides.

---

# 6. Theming System Dependency

All UI components must assume:

* A ThemeProvider exists
* CSS variables are already injected
* Tenant branding may change at runtime

Never hardcode assumptions about colors or branding.

---

# 7. Dark Mode (Future Ready)

Even if not implemented yet:

* Components must remain theme-agnostic
* No logic tied to light/dark colors directly
* Colors must work in both modes automatically via tokens

---

# 8. Layout Principles

UI should follow:

* Mobile-first design
* Card-based structure
* Minimal visual noise
* High contrast for readability

---

# 9. Forbidden Patterns

Do NOT:

* Store colors inside components
* Create per-page styles with fixed branding
* Bypass theme system for “quick fixes”
* Use inline styles for visual design

---

# 10. Golden Rule

> If a UI decision is visual (color, radius, typography, background), it belongs to the theme system — not the component.

Components describe structure, not appearance.

---

# Summary

This project is:

* Theme-driven
* Multi-tenant
* Design-token based
* Component-agnostic in styling

All UI must adapt to tenant branding automatically without code changes.
