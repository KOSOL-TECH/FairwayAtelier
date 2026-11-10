import { useId, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react';

export interface InputProps {
  label?: string; placeholder?: string; value?: string; type?: string;
  disabled?: boolean; required?: boolean;
  /** Error message; also renders the field in an error state */
  error?: string;
  /** A line of guidance under the field, e.g. the minimum length of a password */
  hint?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email';
}

export function Input({ label, placeholder, value, onChange, onBlur, type = 'text', disabled = false, required = false, error, hint, style, name, autoComplete, maxLength, inputMode }: InputProps) {
  const id = useId();
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="fa-field" style={style}>
      {label && (
        <label className="fa-field__label" htmlFor={id}>
          {label}{required && <span className="fa-field__req" aria-hidden="true">*</span>}
        </label>
      )}
      <input id={id} className="fa-field__control" type={type} name={name} autoComplete={autoComplete} maxLength={maxLength} inputMode={inputMode}
        placeholder={placeholder} value={value} disabled={disabled} required={required} aria-required={required || undefined}
        aria-invalid={!!error} aria-describedby={describedBy} onChange={onChange} onBlur={onBlur} />
      {hint && <span id={hintId} className="fa-field__hint">{hint}</span>}
      {error && <span id={errId} className="fa-field__error">{error}</span>}
    </div>
  );
}
