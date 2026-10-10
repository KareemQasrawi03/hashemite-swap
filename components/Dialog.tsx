'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * A small modal dialog rendered into <body>. Closes on Escape or a click on the backdrop,
 * focuses the element marked data-autofocus on open, and returns focus to the opener on close.
 */
export default function Dialog({
  title,
  description,
  onClose,
  children,
  alert = false,
}: {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  alert?: boolean;
}) {
  const id = useId();
  const sheet = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    sheet.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener?.isConnected) setTimeout(() => opener.focus(), 0);
    };
  }, []);

  return createPortal(
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={sheet}
        className="sheet confirm"
        role={alert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={id + 't'}
        aria-describedby={description ? id + 'd' : undefined}
      >
        <h2 id={id + 't'}>{title}</h2>
        {description && <p id={id + 'd'} className="who">{description}</p>}
        <div className="form-actions">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
