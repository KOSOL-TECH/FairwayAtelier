export interface BadgeProps {
  tone?: 'brass' | 'green' | 'stone' | 'inverse' | 'booking' | 'limited' | 'sold' | 'waitlist';
  /** Leading status dot */
  dot?: boolean;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
