import { cx } from './cx';

export interface CheckboxProps {
  label?: string; checked?: boolean; disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, checked = false, onChange, disabled = false }: CheckboxProps) {
  return (
    <label className={cx('fa-choice', 'fa-choice--checkbox', disabled && 'fa-choice--disabled')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="fa-choice__box" aria-hidden="true" />
      <span className="fa-choice__text">{label}</span>
    </label>
  );
}
