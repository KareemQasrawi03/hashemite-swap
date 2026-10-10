'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { useApp } from '@/components/AppProvider';
import type { MsgKey } from '@/lib/i18n';
import { useAdmin } from './AdminContext';

const ITEMS: { href: string; icon: string; label: MsgKey; count?: 'pending' | 'approved' | 'swapped' }[] = [
  { href: '/admin', icon: 'donut', label: 'adm_dash' },
  { href: '/admin/pending', icon: 'clock', label: 'adm_pending', count: 'pending' },
  { href: '/admin/published', icon: 'check', label: 'adm_live', count: 'approved' },
  { href: '/admin/swapped', icon: 'handshake', label: 'adm_swapped', count: 'swapped' },
];

export default function AdminSidebar() {
  const { t } = useApp();
  const { admin, counts, signOut } = useAdmin();
  const path = usePathname();

  return (
    <nav className="admin-side" aria-label={t('adm_nav')}>
      <Link href="/admin" className="admin-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={40} height={40} />
        <span>{t('admin_title')}</span>
      </Link>
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className="side-link" aria-current={path === it.href ? 'page' : undefined}>
          <Icon name={it.icon} size={20} />
          <span>{t(it.label)}</span>
          {it.count && counts[it.count] > 0 && <span className="side-badge">{counts[it.count]}</span>}
        </Link>
      ))}
      <div className="side-foot">
        <p className="side-user">{t('admin_hi', { u: admin })}</p>
        <Link href="/" className="side-link">
          <Icon name="globe" size={20} />
          <span>{t('adm_site')}</span>
        </Link>
        <button type="button" className="side-link" onClick={signOut}>
          <Icon name="logout" size={20} />
          <span>{t('admin_logout')}</span>
        </button>
      </div>
    </nav>
  );
}
