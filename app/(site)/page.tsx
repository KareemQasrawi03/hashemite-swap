'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import ListingCard from '@/components/ListingCard';
import { useApp } from '@/components/AppProvider';
import { Loader } from '@/components/Spinner';

export default function HomePage() {
  const { t, listings, openAdd, configured, loaded, loadErr } = useApp();

  return (
    <div className="wrap">
      <div className="hero">
        <svg className="hero-pat" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="star" width="56" height="56" patternUnits="userSpaceOnUse">
              <path className="pat-line" d="M28 4l7 17 17 7-17 7-7 17-7-17-17-7 17-7z" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#star)" />
        </svg>
        <div>
          <div className="kicker">{t('hero_kicker')}</div>
          <h1>{t('hero_title')}</h1>
          <p className="sub">{t('hero_sub')}</p>
          <div className="actions">
            <Link className="btn btn-primary" href="/market">
              <Icon name="search" size={18} />
              <span>{t('cta_browse')}</span>
            </Link>
            <button className="btn" type="button" onClick={openAdd}>
              <Icon name="plus" size={18} />
              <span>{t('cta_add')}</span>
            </button>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-logo" src="/logo.webp" alt="مقايضة الهاشمية" width={300} height={300} />
      </div>

      <div>
        <div className="sec-head">
          <h2>{t('how_title')}</h2>
        </div>
        <ol className="steps">
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <span className="step-n">{n}</span>
              <h3>{t(`s${n}_t`)}</h3>
              <p>{t(`s${n}_d`)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="sec-head">
          <h2>{t('latest')}</h2>
          <Link className="link-btn" href="/market">{t('see_all')}</Link>
        </div>
        <div className="grid">
          {configured && !loaded && !loadErr ? (
            <Loader label={t('loading')} />
          ) : (
            listings.slice(0, 3).map((l) => <ListingCard key={l.id} l={l} />)
          )}
        </div>
      </div>

      <div className="tips">
        <Icon name="shield" size={24} />
        <div>
          <h3>{t('tips_title')}</h3>
          <ul>
            <li>{t('tip1')}</li>
            <li>{t('tip2')}</li>
            <li>{t('tip3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
