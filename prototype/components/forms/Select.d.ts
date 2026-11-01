export interface SelectProps {
  label?: string; options?: string[]; value?: string;
  /** Leading empty option label */
  placeholder?: string;
  disabled?: boolean; required?: boolean;
  /** Error message; also renders the field in an error state */
  error?: string;
  onChange?: (e: any) => void; onBlur?: (e: any) => void; style?: React.CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;
