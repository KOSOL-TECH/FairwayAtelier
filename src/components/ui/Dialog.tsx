import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';

export interface DialogProps {
  open?: boolean; onClose?: () => void;
  eyebrow?: string; title?: string;
  actions?: ReactNode; width?: number;
  children?: ReactNode;
}

/** Modal on the native <dialog>: focus is trapped, Esc closes, focus returns to the opener. */
export function Dialog({ open = false, onClose, eyebrow, title, children, actions, width = 520 }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="fa-dialog" aria-labelledby={title ? titleId : undefined}
      style={{ '--dialog-w': `${width}px` } as CSSProperties}
      onClose={() => onClose?.()}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="fa-dialog__frame">
        <button type="button" className="fa-dialog__close" aria-label="Close" onClick={() => onClose?.()} />
        {eyebrow && <div className="fa-dialog__eyebrow label">{eyebrow}</div>}
        {title && <h2 id={titleId} className="fa-dialog__title">{title}</h2>}
        <div className="fa-dialog__body">{children}</div>
        {actions && <div className="fa-dialog__actions">{actions}</div>}
      </div>
    </dialog>
  );
}
