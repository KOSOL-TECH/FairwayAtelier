import React from 'react';
export function SiteHeader({ page, onNav }) {
  const items = [['Home', 'Home'], ['Experience', 'Experience'], ['Journey', 'Journey'], ['Dining & Golf', 'DiningGolf'], ['Availability', 'Availability'], ['Journal', 'Journal'], ['Enquire', 'Enquire']];
  const [w, setW] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on, { passive: true });
    return () => window.removeEventListener('resize', on);
  }, []);
  const mobile = w <= 1000;
  const goto = (route) => { setOpen(false); onNav(route); };
  const link = (label, route, big) => (
    <a key={route} href="#" onClick={(e) => { e.preventDefault(); goto(route); }}
      style={{ fontFamily: 'var(--font-sans)', fontSize: big ? 15 : 12, letterSpacing: big ? '0.18em' : '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        color: page === route ? 'var(--accent)' : 'var(--text-heading)',
        borderBottom: !big && page === route ? '1px solid var(--accent)' : '1px solid transparent',
        padding: big ? '14px 0' : '0 0 3px' }}>{label}</a>
  );
  return (
    <header style={{ background: 'var(--surface-page)', borderBottom: '1px solid var(--border-hairline)', position: 'sticky', top: 0, zIndex: 60 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', height: 84, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="../../assets/wordmark.png" alt="Fairway Atelier" style={{ height: 24, cursor: 'pointer' }} onClick={() => goto('Home')} />
        {!mobile && (
          <nav style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
            {items.map(([label, route]) => link(label, route, false))}
          </nav>
        )}
        {mobile && (
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, width: 40 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ display: 'block', height: 1.5, width: 24, background: 'var(--text-heading)',
                transition: 'transform var(--dur-fast) var(--ease-standard), opacity var(--dur-fast)',
                transform: open && i === 0 ? 'translateY(6.5px) rotate(45deg)' : open && i === 2 ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
                opacity: open && i === 1 ? 0 : 1 }}></span>
            ))}
          </button>
        )}
      </div>
      {mobile && open && (
        <nav style={{ borderTop: '1px solid var(--border-hairline)', background: 'var(--surface-page)', padding: '8px 40px 20px', display: 'flex', flexDirection: 'column' }}>
          {items.map(([label, route]) => (
            <React.Fragment key={route}>{link(label, route, true)}</React.Fragment>
          ))}
        </nav>
      )}
    </header>
  );
}
