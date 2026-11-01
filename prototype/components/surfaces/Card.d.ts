export interface CardProps {
  image?: string; imageAlt?: string;
  /** Uppercase brass label above title */
  eyebrow?: string;
  title?: string;
  /** Corner badge over image */
  badge?: string;
  footer?: React.ReactNode;
  hoverLift?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
