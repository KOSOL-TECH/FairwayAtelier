// Loads the design-system namespace: prefers the compiled _ds_bundle.js, falls back to
// fetching + transpiling the raw component sources so cards render before compilation.
window.addEventListener('unhandledrejection', function (e) { console.error('[ds-loader] rejection:', e.reason && (e.reason.stack || e.reason.message || String(e.reason))); });
if (window.Babel && Babel.availablePresets && Babel.availablePresets['react']) {
  Babel.registerPreset('classic-react', { presets: [[Babel.availablePresets['react'], { runtime: 'classic' }]] });
}
window.loadDS = async function (root, files, probe) {
  const findNS = () => {
    for (const k of Object.keys(window)) {
      try {
        const v = window[k];
        if (v && typeof v === 'object' && typeof v.Button === 'function' && (!probe || typeof v[probe] === 'function')) return v;
      } catch (e) {}
    }
    return null;
  };
  let ns = findNS();
  if (ns) return ns;
  try {
    const r = await fetch(root + '/_ds_bundle.js');
    if (r.ok) { (0, eval)(await r.text()); ns = findNS(); if (ns) return ns; }
  } catch (e) {}
  const fetchOne = async (f) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const r = await fetch(f, { cache: 'reload' });
        const t = await r.text();
        if (r.ok && t.length > 20 && t.trim() !== 'file not found') return t;
      } catch (e) {}
      await new Promise((res) => setTimeout(res, 150 * (attempt + 1)));
    }
    throw new Error('ds-loader: failed to fetch ' + f);
  };
  let src = '';
  for (const f of files) {
    let t = await fetchOne(f);
    t = t.replace(/^import[^\n]*$/gm, '').replace(/^export /gm, '');
    src += t + '\n';
  }
  const names = [...src.matchAll(/^function ([A-Z]\w*)/gm)].map((m) => m[1]);
  const code = Babel.transform(src, { presets: [['react', { runtime: 'classic' }]] }).code;
  return new Function('React', '"use strict";' + code + '\nreturn {' + names.join(',') + '};')(React);
};