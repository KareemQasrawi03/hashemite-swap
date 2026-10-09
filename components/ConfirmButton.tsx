'use client';

import { useEffect, useState, type ReactNode } from 'react';

/** A destructive button that needs two clicks: the first arms it (label changes), the second fires. Disarms after 3.5s. */
export default function ConfirmButton({
  icon,
  label,
  confirmLabel,
  onConfirm,
  className = 'btn btn-danger',
}: {
  icon: ReactNode;
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      className={className}
      type="button"
      data-armed={armed ? '1' : undefined}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
    >
      {icon}
      <span>{armed ? confirmLabel : label}</span>
    </button>
  );
}
