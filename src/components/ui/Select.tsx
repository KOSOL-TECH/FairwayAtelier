import { useId, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react';
import { cx } from './cx';

export interface SelectProps {
  label?: string; options?: string[]; value?: string;
  /** Leading empty option label */
  placeholder?: string;
  disabled?: boolean; required?: boolean;
  /** Error message; also renders the field in an error state */
  error?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: FocusEvent<HTMLSelectElement>) => void;
  style?: CSSProperties;
  name?: string;
}

export function Select({ label, options = [], value, onChange, onBlur, disabled = false, required = false, error, placeholder, style, name }: SelectProps) {
  const id = useId();
  const errId = `${id}-error`;
  return (
    <div className="fa-field" style={style}>
      {label && (
        <label className="fa-field__label" htmlFor={id}>
          {label}{required && <span className="fa-field__req" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="fa-select-wrap">
        <select id={id} name={name} className={cx('fa-field__control', 'fa-select', !value && 'fa-select--empty')}
          value={value} disabled={disabled} required={required} aria-required={required || undefined}
          aria-invalid={!!error} aria-describedby={error ? errId : undefined} onChange={onChange} onBlur={onBlur}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      {error && <span id={errId} className="fa-field__error">{error}</span>}
    </div>
  );
}
