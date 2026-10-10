'use client';

import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import ListingCard from '@/components/ListingCard';
import { useApp } from '@/components/AppProvider';
import { Loader } from '@/components/Spinner';
import AsyncButton from '@/components/AsyncButton';

export default function MarketPage() {
  const { t, nm, pick, lookups, listings, loaded, loadErr, configured, refresh, openAdd } = useApp();
  const [q, setQ] = useState('');
  const [college, setCollege] = useState('');
  const [cat, setCat] = useState('');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return listings.filter((l) => {
      if (college && l.college !== college) return false;
      if (cat && l.category !== cat) return false;
      if (needle) {
        const hay = [pick(l, 'title'), pick(l, 'description'), pick(l, 'want'), l.owner_name].join(' ').toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [listings, q, college, cat, pick]);

  function reset() {
    setQ('');
    setCollege('');
    setCat('');
  }

  const chips = [{ id: '', label: t('all_cats') }, ...lookups.categories.map((c) => ({ id: c.id, label: nm(c) }))];

  let body;
  if (!configured) {
    body = null;
  } else if (!loaded) {
    body = loadErr ? null : <Loader label={t('loading')} />;
  } else if (!list.length) {
    body = (
      <div className="empty" style={{ gridColumn: '1/-1' }}>
        <Icon name="search" size={32} />
        <h3>{t('empty_t')}</h3>
        <p>{t('empty_d')}</p>
        <button className="btn" type="button" onClick={reset}>{t('reset')}</button>
      </div>
    );
  } else {
    body = list.map((l) => <ListingCard key={l.id} l={l} />);
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1>{t('market_title')}</h1>
          <p>{t('market_sub')}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openAdd}>
          <Icon name="plus" size={18} />
          <span>{t('add_item')}</span>
        </button>
      </div>

      {!configured ? (
        <div className="notice"><span>{t('not_configured')}</span></div>
      ) : loadErr ? (
        <div className="notice">
          <span>{t('net_err')}</span>
          <AsyncButton className="btn btn-sm" onClick={refresh}>{t('retry')}</AsyncButton>
        </div>
      ) : null}

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            autoComplete="off"
            placeholder={t('search_ph')}
            aria-label={t('search_ph')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select aria-label={t('college')} value={college} onChange={(e) => setCollege(e.target.value)}>
          <option value="">{t('all_colleges')}</option>
          {lookups.colleges.map((c) => (
            <option key={c.id} value={c.id}>{nm(c)}</option>
          ))}
        </select>
      </div>

      <div className="chips" role="group">
        {chips.map((c) => (
          <button key={c.id || 'all'} className="chip" type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="count" aria-live="polite">{configured && loaded ? t('count', { n: list.length }) : ''}</div>
      <div className="grid">{body}</div>
    </div>
  );
}
