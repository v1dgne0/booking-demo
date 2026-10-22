# Theme

## Token summary

- Colors: paper `#f5f0e8`; deep paper `#eae1d6`; ink `#30282a`; muted `#746a69`; berry `#843b4b`; dark berry `#61303b`; rose `#d8ada7`; line `#d9cec2`; white `#fffdf9`.
- Fonts: serif `Playfair Display`, Georgia; sans `Manrope`, DM Sans, Arial.
- Shadow: `0 24px 60px rgba(61, 43, 42, .09)`.
- Layout: max content width 1180px; breakpoints at 1050px, 800px, and 600px.
- Style system: plain CSS, no framework, package manager, or component library.

## Raw theme variables (`styles.css`)

```css
:root {
    --paper: #f5f0e8;
    --paper-deep: #eae1d6;
    --ink: #30282a;
    --muted: #746a69;
    --berry: #843b4b;
    --berry-dark: #61303b;
    --rose: #d8ada7;
    --line: #d9cec2;
    --white: #fffdf9;
    --serif: 'Playfair Display', Georgia, serif;
    --sans: 'Manrope', 'DM Sans', Arial, sans-serif;
    --shadow: 0 24px 60px rgba(61, 43, 42, .09)
}

:root {
    --serif: Georgia, "Times New Roman", serif;
    --sans: "Segoe UI", Arial, sans-serif
}
```

The second block is a later override in the same stylesheet and currently takes precedence for font stacks.
