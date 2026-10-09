'use client';

import { useApp } from './AppProvider';

export default function Footer() {
  const { t } = useApp();
  return <p className="foot">{t('foot')}</p>;
}
