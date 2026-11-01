import { cx } from './cx';

export interface RadioProps {
  label?: string; checked?: boolean; disabled?: boolean; name?: string;
  onChange?: (checked: boolean) => void;
  value?: string;
}

export function Radio({ label, checked = false, onChange, disabled = false, name, value }: RadioProps) {
  return (
    <label className={cx('fa-choice', 'fa-choice--radio', disabled && 'fa-choice--disabled')}>
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)} />
      <span className="fa-choice__box" aria-hidden="true" />
      <span className="fa-choice__text">{label}</span>
    </label>
  );
}
