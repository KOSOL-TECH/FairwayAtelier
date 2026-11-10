export interface ChipOption {
  value: string;
  label: string;
}

export interface ChipsProps {
  /** id of the element that names the group (the question) */
  labelledBy: string;
  options: readonly ChipOption[];
  /** The selected values */
  value: readonly string[];
  /** Several may be chosen. Otherwise choosing one replaces the other, and choosing it again clears it. */
  multiple?: boolean;
  onChange: (value: string[]) => void;
  /** Taps are ignored (while a save is under way). The buttons stay focusable, so keyboard focus is not lost. */
  disabled?: boolean;
}

/** A group of toggle buttons for a choice question: one tap to choose, one more to clear. */
export function Chips({ labelledBy, options, value, multiple = false, onChange, disabled = false }: ChipsProps) {
  const toggle = (v: string) => {
    if (disabled) return;
    const on = value.includes(v);
    if (multiple) onChange(on ? value.filter((x) => x !== v) : [...value, v]);
    else onChange(on ? [] : [v]);
  };
  return (
    <div className="fa-chips" role="group" aria-labelledby={labelledBy}>
      {options.map((o) => (
        <button key={o.value} type="button" className="fa-chip" aria-pressed={value.includes(o.value)} aria-disabled={disabled || undefined}
          onClick={() => toggle(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
