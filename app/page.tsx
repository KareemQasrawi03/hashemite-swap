'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import ListingCard from '@/components/ListingCard';
import { useApp } from '@/components/AppProvider';

export default function HomePage() {
  const { t, listings, openAdd } = useApp();

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
        <svg className="hero-art" viewBox="0 0 320 220" aria-hidden="true" focusable="false">
          <rect className="a-card" x="14" y="40" width="130" height="150" rx="18" />
          <rect className="a-card alt" x="176" y="30" width="130" height="150" rx="18" />
          <g className="a-ico" transform="translate(53 78) scale(2.2)">
            <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
            <path d="M8 7h7" />
          </g>
          <g className="a-ico" transform="translate(215 68) scale(2.2)">
            <rect x="6" y="6" width="12" height="12" rx="2" />
            <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
          </g>
          <rect className="a-bar" x="40" y="150" width="76" height="8" rx="4" />
          <rect className="a-bar" x="52" y="166" width="52" height="8" rx="4" />
          <rect className="a-bar" x="202" y="140" width="76" height="8" rx="4" />
          <rect className="a-bar" x="214" y="156" width="52" height="8" rx="4" />
          <circle className="a-disc" cx="160" cy="110" r="27" />
          <g className="a-sw" transform="translate(148 98)">
            <path d="M17 3l4 4-4 4" />
            <path d="M21 7H8" />
            <path d="M7 21l-4-4 4-4" />
            <path d="M3 17h13" />
          </g>
        </svg>
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
          {listings.slice(0, 3).map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
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
