'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from './AppProvider';

/** A destructive button that asks for confirmation in a dialog before calling onConfirm. */
export default function ConfirmButton({
  icon,
  label,
  confirmLabel,
  onConfirm,
  className = 'btn btn-danger',
}: {
  icon: ReactNode;
  label: string;
  /** Dialog title, e.g. "Confirm delete?" */
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    setTimeout(() => opener.current?.focus(), 0);
  }

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button ref={opener} className={className} type="button" onClick={() => setOpen(true)}>
        {icon}
        <span>{label}</span>
      </button>
      {open &&
        createPortal(
          <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && close()}>
            <div className="sheet confirm" role="alertdialog" aria-modal="true" aria-labelledby="cfm-title" aria-describedby="cfm-desc">
              <h2 id="cfm-title">{confirmLabel}</h2>
              <p id="cfm-desc" className="who">{t('confirm_hint')}</p>
              <div className="form-actions">
                <button ref={cancelRef} className="btn" type="button" onClick={close}>{t('cancel')}</button>
                <button
                  className="btn btn-danger-solid"
                  type="button"
                  onClick={() => {
                    close();
                    onConfirm();
                  }}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
