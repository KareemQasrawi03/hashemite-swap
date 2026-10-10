'use client';

import { useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import { useApp } from './AppProvider';
import Spinner from './Spinner';

/** The owner's delete button. Asks whether the swap happened so completed swaps are counted. */
export default function OwnerDeleteButton({ id }: { id: string }) {
  const { t, removeListing, refresh, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function close(swapped: boolean) {
    setOpen(false);
    setBusy(true);
    try {
      await removeListing(id, swapped);
      toast(swapped ? t('swapped_ok') : t('deleted'));
    } catch {
      toast(t('del_fail'));
    }
    await refresh();
    setBusy(false);
  }

  return (
    <>
      <button className="btn btn-sm btn-danger" type="button" disabled={busy} aria-busy={busy} onClick={() => setOpen(true)}>
        {busy ? <Spinner size={16} /> : <Icon name="trash" size={16} />}
        <span>{t('del')}</span>
      </button>
      {open && (
        <Dialog title={t('swap_q')} description={t('swap_q_hint')} onClose={() => setOpen(false)}>
          <button className="btn" type="button" onClick={() => setOpen(false)}>{t('cancel')}</button>
          <button className="btn btn-danger" type="button" onClick={() => close(false)}>
            <Icon name="trash" size={16} />
            <span>{t('swap_no')}</span>
          </button>
          <button data-autofocus className="btn btn-primary" type="button" onClick={() => close(true)}>
            <Icon name="handshake" size={18} />
            <span>{t('swap_yes')}</span>
          </button>
        </Dialog>
      )}
    </>
  );
}
