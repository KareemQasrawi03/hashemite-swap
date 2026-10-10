'use client';

import { useState, type ReactNode } from 'react';
import Dialog from './Dialog';
import Spinner from './Spinner';
import { useApp } from './AppProvider';

/** A destructive button that asks for confirmation in a dialog, then shows a spinner while onConfirm runs. */
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
  onConfirm: () => Promise<unknown> | void;
  className?: string;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setOpen(false);
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className={className} type="button" disabled={busy} aria-busy={busy} onClick={() => setOpen(true)}>
        {busy ? <Spinner size={16} /> : icon}
        <span>{label}</span>
      </button>
      {open && (
        <Dialog alert title={confirmLabel} description={t('confirm_hint')} onClose={() => setOpen(false)}>
          <button data-autofocus className="btn" type="button" onClick={() => setOpen(false)}>{t('cancel')}</button>
          <button className="btn btn-danger-solid" type="button" onClick={confirm}>
            {icon}
            <span>{label}</span>
          </button>
        </Dialog>
      )}
    </>
  );
}
