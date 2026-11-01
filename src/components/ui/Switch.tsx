import type { ReactNode } from 'react';
import { cx } from './cx';

export interface SwitchProps {
  label?: ReactNode; checked?: boolean; disabled?: boolean;
  onChange?: (checked: boolean) => void;
  /** Larger 44×24 track, used in the cookie preferences */
  large?: boolean;
  className?: string;
}

export function Switch({ label, checked = false, onChange, disabled = false, large = false, className }: SwitchProps) {
  return (
    <label className={cx('fa-choice', 'fa-choice--switch', large && 'fa-switch--lg', disabled && 'fa-choice--disabled', className)}>
      {label && <span className="fa-choice__text">{label}</span>}
      <span className="fa-switch">
        <input type="checkbox" role="switch" checked={checked} disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)} />
        <span className="fa-switch__track" aria-hidden="true" />
      </span>
    </label>
  );
}
