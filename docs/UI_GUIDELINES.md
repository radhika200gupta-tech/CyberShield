# UI Guidelines

## Color System
Defined in `src/index.css` via CSS variables mapped to Tailwind configuration:
- **Primary**: Brand blue/cyan (`--color-primary`, `--color-accent`)
- **Backgrounds**: Deep dark tones (`--color-bg`, `--color-surface`)
- **Semantic**: Success (Green), Danger (Red), Warning (Amber)

## Typography
- **Display**: Space Grotesk (used for headings, highly stylized numbers)
- **Body**: Inter (used for standard text, UI elements, data)
- **Monospace**: JetBrains Mono (used for code blocks, hashes, technical data)

## Buttons
Always use the `src/components/common/Button.jsx` component.
- Supports variants: `primary`, `secondary`, `outline`, `ghost`, `danger`.
- Supports sizes: `sm`, `md`, `lg`.

## Cards
Always use the `src/components/common/Card.jsx` component for content boundaries.
- Provides consistent glassmorphism effects, borders, and hover states.

## Spacing and Layout
- Use Tailwind's standard spacing scale (`p-4`, `m-6`, `gap-4`).
- Main dashboard content is capped at a max-width and centered.

## Responsive Rules
- **Mobile First**: Default Tailwind classes apply to mobile.
- **sm (Tablet)**: Adjust padding and grid layouts.
- **lg (Desktop)**: Sidebar becomes sticky, mobile menu hides.

## Component Reuse Rules
- Check `src/components/common` before building anything new.
- If a component is used across multiple features, move it to `common`.
- Do not duplicate components inside feature folders.
