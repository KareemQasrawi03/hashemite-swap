'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useApp } from '@/components/AppProvider';
import { adminSignIn, currentAdmin, NotAdminError } from '@/lib/data';
import { AdminProvider } from './AdminContext';
import AdminSidebar from './AdminSidebar';
import Spinner, { Loader } from '@/components/Spinner';

/** Gate for every /admin page: login screen until an admin is signed in, then sidebar + page. */
export default function AdminShell({ children }: { children: ReactNode }) {
  const { t, configured } = useApp();
  // undefined = still checking the saved session.
  const [admin, setAdmin] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!configured) return setAdmin(null);
    currentAdmin().then(setAdmin, () => setAdmin(null));
  }, [configured]);

  if (!configured || admin == null) {
    return (
      <div className="admin-gate">
        <div className="gate-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gate-logo" src="/logo.webp" alt="" width={96} height={96} />
          <h1>{t('admin_title')}</h1>
          {!configured ? (
            <div className="notice"><span>{t('not_configured')}</span></div>
          ) : admin === undefined ? (
            <Loader label={t('loading')} />
          ) : (
            <LoginForm onDone={setAdmin} />
          )}
        </div>
      </div>
    );
  }

  return (
    <AdminProvider admin={admin} onSignOut={() => setAdmin(null)}>
      <div className="admin-shell">
        <AdminSidebar />
        <main className="admin-main" id="main">
          <div className="wrap">{children}</div>
        </main>
      </div>
    </AdminProvider>
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
    <form className="login" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="a-user">{t('admin_user')}</label>
        <input id="a-user" dir="ltr" autoComplete="username" autoCapitalize="none" value={user} onChange={(e) => setUser(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="a-pass">{t('admin_pass')}</label>
        <input id="a-pass" type="password" dir="ltr" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy}>
        {busy && <Spinner size={18} />}
        <span>{t('admin_login')}</span>
      </button>
    </form>
  );
}
