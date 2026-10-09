'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Icon from '@/components/Icon';
import ConfirmButton from '@/components/ConfirmButton';
import ListingCard from '@/components/ListingCard';
import { useApp } from '@/components/AppProvider';
import {
  adminDeleteListing,
  adminSignIn,
  adminSignOut,
  approveListing,
  currentAdmin,
  fetchAllListings,
  NotAdminError,
} from '@/lib/data';
import type { Listing } from '@/lib/types';

type Tab = 'pending' | 'approved';

export default function AdminPage() {
  const { t, configured } = useApp();
  // undefined = still checking the saved session.
  const [admin, setAdmin] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!configured) return setAdmin(null);
    currentAdmin().then(setAdmin, () => setAdmin(null));
  }, [configured]);

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1>{t('admin_title')}</h1>
        </div>
      </div>
      {!configured ? (
        <div className="notice"><span>{t('not_configured')}</span></div>
      ) : admin === undefined ? (
        <p className="who">{t('loading')}</p>
      ) : admin === null ? (
        <LoginForm onDone={setAdmin} />
      ) : (
        <Dashboard admin={admin} onSignOut={() => setAdmin(null)} />
      )}
    </div>
  );
}

function LoginForm({ onDone }: { onDone: (u: string) => void }) {
  const { t } = useApp();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user.trim() || !pass) return setErr(t('e_req'));
    setBusy(true);
    setErr('');
    try {
      await adminSignIn(user, pass);
      onDone(user.trim().toLowerCase());
    } catch (e) {
      setErr(e instanceof NotAdminError ? t('admin_not') : t('admin_bad'));
      setBusy(false);
    }
  }

  return (
    <form className="panel login" style={{ padding: 18 }} onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="a-user">{t('admin_user')}</label>
        <input id="a-user" dir="ltr" autoComplete="username" autoCapitalize="none" value={user} onChange={(e) => setUser(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="a-pass">{t('admin_pass')}</label>
        <input id="a-pass" type="password" dir="ltr" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{t('admin_login')}</button>
    </form>
  );
}

function Dashboard({ admin, onSignOut }: { admin: string; onSignOut: () => void }) {
  const { t, toast, refresh } = useApp();
  const [rows, setRows] = useState<Listing[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');

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

  async function act(fn: () => Promise<void>, ok: string) {
    try {
      await fn();
      toast(ok);
    } catch {
      toast(t('action_fail'));
    }
    load();
    refresh(); // keep the public board in sync
  }

  async function signOut() {
    await adminSignOut();
    onSignOut();
  }

  const pending = rows?.filter((r) => r.status === 'pending') ?? [];
  const approved = rows?.filter((r) => r.status === 'approved') ?? [];
  const list = tab === 'pending' ? pending : approved;

  return (
    <>
      <div className="setting panel">
        <p className="who">{t('admin_hi', { u: admin })}</p>
        <button className="btn btn-sm" type="button" onClick={signOut}>{t('admin_logout')}</button>
      </div>

      {loadErr && (
        <div className="notice">
          <span>{t('net_err')}</span>
          <button className="btn btn-sm" type="button" onClick={load}>{t('retry')}</button>
        </div>
      )}

      <div className="tabs" role="group">
        <button className="chip" type="button" aria-pressed={tab === 'pending'} onClick={() => setTab('pending')}>
          {t('admin_pending', { n: pending.length })}
        </button>
        <button className="chip" type="button" aria-pressed={tab === 'approved'} onClick={() => setTab('approved')}>
          {t('admin_approved', { n: approved.length })}
        </button>
      </div>

      {rows === null ? (
        !loadErr && <p className="who">{t('loading')}</p>
      ) : !list.length ? (
        <div className="empty"><h3>{t('admin_none')}</h3></div>
      ) : (
        <div className="grid">
          {list.map((l) => (
            <ListingCard
              key={l.id}
              l={l}
              actions={
                <div className="admin-actions">
                  {l.status === 'pending' && (
                    <button className="btn btn-sm btn-primary" type="button" onClick={() => act(() => approveListing(l.id), t('approved_ok'))}>
                      <Icon name="shield" size={16} />
                      <span>{t('approve')}</span>
                    </button>
                  )}
                  <ConfirmButton
                    className="btn btn-sm btn-danger"
                    icon={<Icon name="trash" size={16} />}
                    label={l.status === 'pending' ? t('reject') : t('del')}
                    confirmLabel={l.status === 'pending' ? t('reject_sure') : t('del_sure')}
                    onConfirm={() => act(() => adminDeleteListing(l.id), t('deleted'))}
                  />
                </div>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
