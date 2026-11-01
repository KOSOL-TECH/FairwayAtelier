import { useId, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react';

export interface InputProps {
  label?: string; placeholder?: string; value?: string; type?: string;
  disabled?: boolean; required?: boolean;
  /** Error message; also renders the field in an error state */
  error?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
  name?: string;
  autoComplete?: string;
}

export function Input({ label, placeholder, value, onChange, onBlur, type = 'text', disabled = false, required = false, error, style, name, autoComplete }: InputProps) {
  const id = useId();
  const errId = `${id}-error`;
  return (
    <div className="fa-field" style={style}>
      {label && (
        <label className="fa-field__label" htmlFor={id}>
          {label}{required && <span className="fa-field__req" aria-hidden="true">*</span>}
        </label>
      )}
      <input id={id} className="fa-field__control" type={type} name={name} autoComplete={autoComplete}
        placeholder={placeholder} value={value} disabled={disabled} required={required} aria-required={required || undefined}
        aria-invalid={!!error} aria-describedby={error ? errId : undefined} onChange={onChange} onBlur={onBlur} />
      {error && <span id={errId} className="fa-field__error">{error}</span>}
    </div>
  );
}
