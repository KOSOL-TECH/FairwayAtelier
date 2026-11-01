import React from 'react';
// Injects one global responsive stylesheet. Because the site is built with inline
// styles, these rules use attribute selectors (matching the serialized style string)
// plus longhand !important to override inline shorthands at tablet/mobile widths.
// This keeps every screen's authoring simple while making the whole site responsive.
export function ResponsiveStyles() {
  React.useEffect(() => {
    if (document.getElementById('fa-responsive')) return;
    const s = document.createElement('style');
    s.id = 'fa-responsive';
    s.textContent = `
/* ---- Tablet ---- */
@media (max-width: 960px) {
  #root [style*="grid-template-columns: repeat(3"] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  #root [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  #root [style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
  #root [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
  #root [style*="grid-template-columns: minmax(0px, 1fr) minmax(0px, 1fr)"] { grid-template-columns: 1fr !important; }
  #root [style*="grid-template-columns: 2fr 1fr 1fr 1fr"] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  #root [style*="grid-template-columns: minmax(0px, 1.1fr)"] { grid-template-columns: 1fr !important; }
  /* stacked hero/split images shouldn't force a tall min-height once stacked */
  #root [style*="minHeight: 340"], #root [style*="min-height: 340px"] { min-height: 240px !important; }
}
/* ---- Mobile ---- */
@media (max-width: 620px) {
  #root section, #root main > section, #root main, #root footer, #root header > div, #root header > nav {
    padding-left: 22px !important; padding-right: 22px !important;
  }
  #root [style*="grid-template-columns: repeat(2"] { grid-template-columns: 1fr !important; }
  #root [style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
  #root [style*="grid-template-columns: repeat(4"] { grid-template-columns: 1fr !important; }
  #root [style*="grid-template-columns: 2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 28px !important; }
  #root [style*="grid-template-columns: 1.4fr 1fr auto"] { grid-template-columns: 1fr !important; gap: 8px !important; }
  #root [style*="grid-template-columns: 120px 1fr"] { grid-template-columns: 84px 1fr !important; gap: 16px !important; }
  #root [style*="grid-template-columns: 200px 1fr"] { grid-template-columns: 1fr !important; gap: 2px !important; }
  /* Journal side-by-side post cards → stack image over text */
  #root [style*="grid-template-columns: 150px 1fr"] { grid-template-columns: 1fr !important; }
  #root [style*="grid-template-columns: 150px 1fr"] img { min-height: 200px !important; }
  /* faded hero villa engravings: keep from overflowing small screens */
  #root [style*="width: 420px"] { width: 200px !important; opacity: 0.32 !important; }
  /* generous section rhythm compressed a touch */
  #root [style*="padding: 92px"] { padding-top: 60px !important; padding-bottom: 56px !important; }
  #root [style*="padding: 88px"], #root [style*="padding: 84px"], #root [style*="padding: 80px"], #root [style*="padding: 76px"] { padding-top: 56px !important; padding-bottom: 56px !important; }
}`;
    document.head.appendChild(s);
  }, []);
  return null;
}
