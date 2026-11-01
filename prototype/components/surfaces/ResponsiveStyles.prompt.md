Injects one global responsive stylesheet for the website UI kit. Because screens use inline styles, it overrides layout at tablet (≤960px) and mobile (≤620px) via attribute selectors on the serialized `style` string plus longhand `!important`. Mount once near the app root.
\`\`\`jsx
<ResponsiveStyles />
\`\`\`
Stacks multi-column grids, reduces side padding/section rhythm, shrinks the hero engraving, and stacks Journal post cards. Pair with the `clamp()` display type in tokens/typography.css.