'use client';

import { useApp } from './AppProvider';

export default function Toast() {
  const { toastMsg } = useApp();
  return (
    <div className="toast" role="status" aria-live="polite" hidden={!toastMsg}>
      {toastMsg}
    </div>
  );
}
