'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '@/components/AppProvider';
import { useAdmin } from '@/components/admin/AdminContext';
import StatusDonut from '@/components/admin/StatusDonut';
import { Loader } from '@/components/Spinner';
import AsyncButton from '@/components/AsyncButton';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export default function AdminDashboard() {
  const { t, nm, pick, lookups, lang } = useApp();
  const { rows, loadErr, load, counts } = useAdmin();

  const real = useMemo(() => (rows ?? []).filter((r) => !r.is_example), [rows]);
  const newThisWeek = real.filter((r) => Date.now() - Date.parse(r.created_at) < WEEK).length;
  const wentLive = counts.approved + counts.swapped;
  const rate = wentLive ? Math.round((counts.swapped / wentLive) * 100) : 0;

  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of real) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return lookups.categories
      .map((c) => ({ id: c.id, label: nm(c), n: m.get(c.id) ?? 0 }))
      .filter((c) => c.n > 0)
      .sort((a, b) => b.n - a.n);
  }, [real, lookups, nm]);
  const maxCat = Math.max(1, ...byCat.map((c) => c.n));

  const latestPending = real.filter((r) => r.status === 'pending').slice(0, 4);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('adm_dash')}</h1>
        </div>
      </div>

      {loadErr && (
        <div className="notice">
          <span>{t('net_err')}</span>
          <AsyncButton className="btn btn-sm" onClick={load}>{t('retry')}</AsyncButton>
        </div>
      )}

      {rows === null ? (
        !loadErr && <Loader label={t('loading')} />
      ) : (
        <>
          <div className="kpis">
            <Link href="/admin/pending" className="kpi kpi-link">
              <span className="l"><Icon name="clock" size={16} />{t('adm_pending')}</span>
              <span className="v">{counts.pending}</span>
            </Link>
            <div className="kpi">
              <span className="l"><Icon name="plus" size={16} />{t('adm_week')}</span>
              <span className="v">{newThisWeek}</span>
            </div>
            <div className="kpi">
              <span className="l"><Icon name="handshake" size={16} />{t('adm_rate')}</span>
              <span className="v">{rate}٪</span>
              <span className="h">{t('adm_rate_hint')}</span>
            </div>
          </div>

          <div className="dash-grid">
            <section className="panel card-pad" aria-labelledby="st-title">
              <h2 id="st-title">{t('adm_status')}</h2>
              <StatusDonut
                slices={[
                  { key: 'pending', label: 'adm_pending', value: counts.pending, color: 'var(--st-pending)' },
                  { key: 'approved', label: 'adm_live', value: counts.approved, color: 'var(--st-live)' },
                  { key: 'swapped', label: 'adm_swapped', value: counts.swapped, color: 'var(--st-swapped)' },
                ]}
              />
            </section>

            <section className="panel card-pad" aria-labelledby="cat-title">
              <h2 id="cat-title">{t('adm_by_cat')}</h2>
              {byCat.length ? (
                <ul className="bars">
                  {byCat.map((c) => (
                    <li key={c.id} className="bar-row">
                      <span className="bl">{c.label}</span>
                      <span className="bar-track"><span className="bar-fill" style={{ width: `${(c.n / maxCat) * 100}%` }} /></span>
                      <span className="bn">{c.n}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="who">{t('adm_empty_chart')}</p>
              )}
            </section>
          </div>

          <section className="panel card-pad" aria-labelledby="req-title">
            <div className="sec-head" style={{ marginBottom: 0 }}>
              <h2 id="req-title">{t('adm_latest')}</h2>
              {counts.pending > 0 && <Link className="link-btn" href="/admin/pending">{t('adm_review')}</Link>}
            </div>
            {latestPending.length ? (
              <ul className="req-list">
                {latestPending.map((r) => (
                  <li key={r.id} className="req">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.image_url ? <img src={r.image_url} alt="" /> : <span className="req-ph" />}
                    <div>
                      <div className="tt">{pick(r, 'title')}</div>
                      <small>{r.owner_name} · {new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB')}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="who">{t('adm_none')}</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
