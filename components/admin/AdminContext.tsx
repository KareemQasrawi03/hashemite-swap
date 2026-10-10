'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApp } from '@/components/AppProvider';
import { adminSignOut, fetchAllListings } from '@/lib/data';
import type { Listing } from '@/lib/types';

type Counts = { pending: number; approved: number; swapped: number };

type AdminCtx = {
  admin: string;
  rows: Listing[] | null;
  loadErr: boolean;
  load: () => Promise<void>;
  /** Runs an admin action, toasts the outcome, then reloads both the admin data and the public board. */
  act: (fn: () => Promise<void>, ok: string) => Promise<void>;
  /** Real listings only (example rows are left out of every count). */
  counts: Counts;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin(): AdminCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAdmin must be used inside <AdminProvider>');
  return c;
}

export function AdminProvider({ admin, onSignOut, children }: { admin: string; onSignOut: () => void; children: ReactNode }) {
  const { t, toast, refresh } = useApp();
  const [rows, setRows] = useState<Listing[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchAllListings());
      setLoadErr(false);
    } catch {
      setLoadErr(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, 30000);
    return () => clearInterval(id);
  }, [load]);

  const act = useCallback(
    async (fn: () => Promise<void>, ok: string) => {
      try {
        await fn();
        toast(ok);
      } catch {
        toast(t('action_fail'));
      }
      load();
      refresh();
    },
    [load, refresh, t, toast],
  );

  const counts = useMemo(() => {
    const c: Counts = { pending: 0, approved: 0, swapped: 0 };
    for (const r of rows ?? []) if (!r.is_example) c[r.status]++;
    return c;
  }, [rows]);

  const signOut = useCallback(async () => {
    await adminSignOut();
    onSignOut();
  }, [onSignOut]);

  return <Ctx.Provider value={{ admin, rows, loadErr, load, act, counts, signOut }}>{children}</Ctx.Provider>;
}
