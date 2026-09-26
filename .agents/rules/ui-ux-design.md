# UI/UX & Design Architecture Guidelines (UI/UX Pro Max)

## Core Directives
1. **Always Use High-Fidelity UI Design**:
   - Apply the `ui-ux-pro-max` and `ui-styling` design systems for all frontend work.
   - For all UI tasks (landing pages, storefronts, product cards, checkouts, cart sheets, dashboards), adhere to modern design tokens, harmonic color palettes, micro-interactions, responsive typography, and WCAG 2.2 AA accessibility.

2. **Visual Standards for Blush & Budget (ecomXbangladesh)**:
   - **Modern Aesthetic**: Clean luxury/wellness/e-commerce vibe with subtle glassmorphism, soft border radiuses, and crisp contrast.
   - **No Raw Placeholders or Emojis as Icons**: Always use `lucide-react` SVG icons.
   - **Interactive States**:
     - `cursor-pointer` on all clickable items.
     - Smooth transitions (`duration-200 ease-in-out`) for hover, active, and focus-visible states.
     - Visible focus rings for keyboard navigation accessibility.
   - **Responsive Optimization**: Mobile-first design (375px, 768px, 1024px, 1440px) with responsive touch targets (minimum 44x44px).

3. **CLI Search Capabilities**:
   - For targeted component guidelines, run:
     `python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <ux|style|color|chart|icons|landing>`
   - For framework and stack-specific optimization:
     `python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack html-tailwind`
