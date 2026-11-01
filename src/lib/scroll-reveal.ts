/**
 * Fades each top-level block of <main> up from opacity 0 / translateY(18px) over
 * 350ms once its top passes 90% of the viewport height. Blocks already in view
 * (or scrolled past) show immediately. Reduced-motion users get no animation.
 */
export function initScrollReveal() {
  const main = document.querySelector('main');
  if (!main || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const line = () => window.innerHeight * 0.9;
  let pending = (Array.from(main.children) as HTMLElement[]).filter((el) => el.getBoundingClientRect().top >= line());
  if (pending.length === 0) return;

  const reveal = (el: HTMLElement) => {
    el.classList.remove('reveal-init');
    el.classList.add('reveal-in');
    io.unobserve(el);
  };
  // Reveal everything whose top has passed the line, including blocks skipped
  // over by a fast scroll or an anchor jump (they never "intersect").
  const sweep = () => {
    const limit = line();
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < limit) { reveal(el); return false; }
      return true;
    });
    if (pending.length === 0) { io.disconnect(); window.removeEventListener('scroll', onScroll); }
  };
  // At most ~10 rect reads per event, so no rAF throttle is needed
  const onScroll = () => sweep();

  const io = new IntersectionObserver(sweep, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
  pending.forEach((el) => { el.classList.add('reveal-init'); io.observe(el); });
  window.addEventListener('scroll', onScroll, { passive: true });
}
