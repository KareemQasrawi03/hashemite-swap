'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { useApp } from './AppProvider';
import type { MsgKey } from '@/lib/i18n';

const ITEMS: { href: string; icon: string; label: MsgKey; push?: boolean }[] = [
  { href: '/', icon: 'home', label: 'nav_home' },
  { href: '/market', icon: 'swap', label: 'nav_market' },
  { href: '/settings', icon: 'sliders', label: 'nav_settings', push: true },
];

export default function Rail() {
  const { t } = useApp();
  const path = usePathname();
  return (
    <nav className="rail" aria-label={t('nav_label')}>
      <Link href="/" className="brand-mark" aria-label={t('nav_home')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={48} height={48} />
      </Link>
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={'rail-btn' + (it.push ? ' push' : '')}
          aria-current={path === it.href ? 'page' : undefined}
        >
          <Icon name={it.icon} size={24} />
          <span>{t(it.label)}</span>
        </Link>
      ))}
    </nav>
  );
}
