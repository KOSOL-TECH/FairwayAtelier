export interface InputProps {
  label?: string; placeholder?: string; value?: string; type?: string;
  disabled?: boolean; required?: boolean;
  /** Error message; also renders the field in an error state */
  error?: string;
  onChange?: (e: any) => void; onBlur?: (e: any) => void; style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
