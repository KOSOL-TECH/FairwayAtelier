import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

export interface TabsProps {
  tabs?: string[];
  /** Controlled active index */
  active?: number;
  onChange?: (index: number) => void;
  style?: CSSProperties;
  /** id prefix linking each tab to its panel: `${idBase}-panel-${i}` */
  idBase?: string;
  label?: string;
}

/** WAI-ARIA tablist: arrow keys, Home and End move between tabs. */
export function Tabs({ tabs = [], active, onChange, style, idBase, label }: TabsProps) {
  const [internal, setInternal] = useState(0);
  const auto = useId();
  const base = idBase ?? auto;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const idx = active !== undefined ? active : internal;
  const set = (i: number) => { setInternal(i); onChange?.(i); };
  const onKey = (e: KeyboardEvent) => {
    const last = tabs.length - 1;
    let next = -1;
    if (e.key === 'ArrowRight') next = idx === last ? 0 : idx + 1;
    else if (e.key === 'ArrowLeft') next = idx === 0 ? last : idx - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next < 0) return;
    e.preventDefault();
    set(next);
    refs.current[next]?.focus();
  };
  return (
    <div className="fa-tabs" role="tablist" aria-label={label} style={style} onKeyDown={onKey}>
      {tabs.map((t, i) => (
        <button key={t} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" className="fa-tabs__tab"
          id={`${base}-tab-${i}`} aria-selected={i === idx} aria-controls={`${base}-panel-${i}`} tabIndex={i === idx ? 0 : -1}
          onClick={() => set(i)}>{t}</button>
      ))}
    </div>
  );
}
