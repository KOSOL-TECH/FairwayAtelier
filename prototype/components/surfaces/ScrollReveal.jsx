import React from 'react';
// Reveals the top-level blocks of the current <main> as they scroll into view.
// Uses CSS classes (React never manages className on these JSX-styled sections, so
// the reveal survives re-renders) plus a throttled scroll listener (robust for normal
// scrolling, anchor jumps, and resizes alike). Honours prefers-reduced-motion.
export function ScrollReveal({ trigger }) {
  React.useEffect(() => {
    if (!document.getElementById('fa-reveal-style')) {
      const s = document.createElement('style');
      s.id = 'fa-reveal-style';
      s.textContent = [
        '.fa-reveal-init{opacity:0;transform:translateY(18px);}',
        '.fa-reveal-in{opacity:1 !important;transform:none !important;transition:opacity 350ms var(--ease-standard),transform 350ms var(--ease-standard);}',
        '@media (prefers-reduced-motion: reduce){.fa-reveal-init{opacity:1;transform:none;}.fa-reveal-in{transition:none;}}'
      ].join('');
      document.head.appendChild(s);
    }
    let pending = [];
    let ticking = false;
    const reveal = (el) => { el.classList.remove('fa-reveal-init'); el.classList.add('fa-reveal-in'); };
    const check = () => {
      ticking = false;
      const trigger = window.innerHeight * 0.9;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < trigger) { reveal(el); return false; }
        return true;
      });
      if (pending.length === 0) window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    const raf = requestAnimationFrame(() => {
      const main = document.querySelector('#root main');
      if (!main) return;
      const blocks = Array.from(main.children).filter((el) => el.nodeType === 1);
      blocks.forEach((el) => { el.classList.add('fa-reveal-init'); el.classList.remove('fa-reveal-in'); });
      pending = blocks.slice();
      check(); // reveal whatever is already in view — no blank first screen
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [trigger]);
  return null;
}
