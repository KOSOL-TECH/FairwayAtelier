export interface DialogProps {
  open?: boolean; onClose?: () => void;
  eyebrow?: string; title?: string;
  actions?: React.ReactNode; width?: number;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element;
