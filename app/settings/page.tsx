'use client';

import Icon from '@/components/Icon';
import ConfirmButton from '@/components/ConfirmButton';
import { useApp } from '@/components/AppProvider';
import type { Lang, Theme } from '@/lib/types';

const THEMES: { id: Theme; icon?: string; label: 't_light' | 't_dark' | 't_auto' }[] = [
  { id: 'light', icon: 'sun', label: 't_light' },
  { id: 'dark', icon: 'moon', label: 't_dark' },
  { id: 'auto', label: 't_auto' },
];
const LANGS: { id: Lang; label: string }[] = [
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'English' },
];

export default function SettingsPage() {
  const { t, theme, setTheme, lang, setLang, myIds, removeListing, refresh, toast } = useApp();

  async function clearMine() {
    try {
      for (const id of myIds()) await removeListing(id);
      toast(t('cleared'));
    } catch {
      toast(t('del_fail'));
    }
    refresh();
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1>{t('set_title')}</h1>
        </div>
      </div>
      <div className="panel">
        <div className="setting">
          <div className="txt">
            <h2>{t('set_theme')}</h2>
            <p>{t('set_theme_hint')}</p>
          </div>
          <div className="seg" role="group" aria-label={t('set_theme')}>
            {THEMES.map((th) => (
              <button key={th.id} type="button" aria-pressed={theme === th.id} onClick={() => setTheme(th.id)}>
                {th.icon && <Icon name={th.icon} size={18} />}
                <span>{t(th.label)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <div className="txt">
            <h2>{t('set_lang')}</h2>
            <p>{t('set_lang_hint')}</p>
          </div>
          <div className="seg" role="group" aria-label={t('set_lang')}>
            {LANGS.map((l) => (
              <button key={l.id} type="button" aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <div className="txt">
            <h2>{t('set_data')}</h2>
            <p>{t('set_data_hint')}</p>
          </div>
          <ConfirmButton
            icon={<Icon name="trash" size={18} />}
            label={t('clear_mine')}
            confirmLabel={t('clear_sure')}
            onConfirm={clearMine}
          />
        </div>
      </div>
      <p className="about">{t('about')}</p>
    </div>
  );
}
