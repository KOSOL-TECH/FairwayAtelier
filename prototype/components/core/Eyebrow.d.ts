export interface EyebrowProps {
  /** Show flanking brass rules (—— LABEL ——) */
  rules?: boolean;
  tone?: 'ink' | 'brass';
  align?: 'center' | 'left';
  children?: React.ReactNode;
}
export declare function Eyebrow(props: EyebrowProps): JSX.Element;
