Fades in the current `<main>`'s top-level blocks as they enter the viewport (opacity + 18px rise, 350ms). Mount once near the app root and pass the current route as `trigger` so it re-runs on navigation. Honours prefers-reduced-motion.
\`\`\`jsx
<ScrollReveal trigger={page} />
\`\`\`
Reveals blocks already above the fold immediately — no blank first screen.