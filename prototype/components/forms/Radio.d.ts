export interface RadioProps {
  label?: string; checked?: boolean; disabled?: boolean; name?: string;
  onChange?: (checked: boolean) => void;
}
export declare function Radio(props: RadioProps): JSX.Element;
