'use client';

import { useState, type ReactNode } from 'react';
import Dialog from './Dialog';
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

  return (
    <>
      <button className={className} type="button" onClick={() => setOpen(true)}>
        {icon}
        <span>{label}</span>
      </button>
      {open && (
        <Dialog alert title={confirmLabel} description={t('confirm_hint')} onClose={() => setOpen(false)}>
          <button data-autofocus className="btn" type="button" onClick={() => setOpen(false)}>{t('cancel')}</button>
          <button
            className="btn btn-danger-solid"
            type="button"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        </Dialog>
      )}
    </>
  );
}
