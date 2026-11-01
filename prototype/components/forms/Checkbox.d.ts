export interface CheckboxProps {
  label?: string; checked?: boolean; disabled?: boolean;
  onChange?: (checked: boolean) => void;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
