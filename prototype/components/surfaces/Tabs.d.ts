export interface TabsProps {
  tabs?: string[];
  /** Controlled active index */
  active?: number;
  onChange?: (index: number) => void;
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
