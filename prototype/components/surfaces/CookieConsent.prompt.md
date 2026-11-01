CNIL-compliant cookie banner pinned to the bottom of the viewport. Refuse-all is exactly as prominent as Accept-all; analytics is opt-in and never pre-checked; choice persists in localStorage (`fa_consent`). Includes a "Manage preferences" panel.
\`\`\`jsx
<CookieConsent onNav={nav} />
\`\`\`
Privacy-respecting analytics only (Plausible/Fathom/Matomo). Reset by clearing the `fa_consent` key.