'use client';

import { useState, type ReactNode } from 'react';
import Spinner from './Spinner';

/** A button whose async action swaps its icon for a spinner and blocks repeat clicks until it settles. */
export default function AsyncButton({
  onClick,
  icon,
  children,
  className = 'btn',
}: {
  onClick: () => Promise<unknown> | void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      await onClick();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={className} type="button" disabled={busy} aria-busy={busy} onClick={run}>
      {busy ? <Spinner size={16} /> : icon}
      <span>{children}</span>
    </button>
  );
}
