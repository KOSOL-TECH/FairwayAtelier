/**
 * @startingPoint section="Components" subtitle="Brass rectangular button — primary, secondary, ghost" viewport="700x200"
 */
export interface ButtonProps {
  /** 'primary' brass fill | 'secondary' brass outline | 'ghost' underlined text */
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
