'use client';

import { useRef, useState, type ReactNode } from 'react';
import Icon from './Icon';
import OwnerDeleteButton from './OwnerDeleteButton';
import { useApp } from './AppProvider';
import { fmtPhone } from '@/lib/phone';
import type { Listing } from '@/lib/types';
import Spinner from './Spinner';

/** `actions` replaces the owner's delete button (used by the admin page). */
export default function ListingCard({ l, actions }: { l: Listing; actions?: ReactNode }) {
  const { t, nm, pick, lookups, isMine, toast } = useApp();
  const phoneRef = useRef<HTMLSpanElement>(null);
  const [imgReady, setImgReady] = useState(false);

  const cat = lookups.categories.find((c) => c.id === l.category) ?? lookups.categories[lookups.categories.length - 1];
  const col = lookups.colleges.find((c) => c.id === l.college);
  const cond = lookups.conditions.find((c) => c.id === l.condition);
  const catIcon = cat?.icon ?? 'box';
  const mine = isMine(l.id);
  const desc = pick(l, 'description');

  function copyPhone() {
    const fallback = () => {
      try {
        const r = document.createRange();
        r.selectNodeContents(phoneRef.current!);
        const s = getSelection()!;
        s.removeAllRanges();
        s.addRange(r);
      } catch {}
      toast(t('copy_fail'));
    };
    try {
      navigator.clipboard.writeText(l.phone!).then(() => toast(t('copied')), fallback);
    } catch {
      fallback();
    }
  }

  return (
    <article className="card">
      <div className="media">
        {l.image_url ? (
          <>
            {!imgReady && <Spinner size={28} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={l.image_url}
              alt=""
              loading="lazy"
              className={imgReady ? undefined : 'loading'}
              ref={(el) => { if (el?.complete && el.naturalWidth) setImgReady(true); }}
              onLoad={() => setImgReady(true)}
              onError={() => setImgReady(true)}
            />
          </>
        ) : (
          <Icon name={catIcon} size={44} />
        )}
        {l.status === 'pending' ? (
          <span className="tag pending">{t('tag_pending')}</span>
        ) : l.status === 'swapped' ? (
          <span className="tag swapped">{t('tag_swapped')}</span>
        ) : l.is_example ? (
          <span className="tag">{t('tag_ex')}</span>
        ) : mine ? (
          <span className="tag mine">{t('tag_mine')}</span>
        ) : null}
      </div>
      <div className="cbody">
        <h3>{pick(l, 'title')}</h3>
        <div className="meta">
          {cat && (
            <span>
              <Icon name={catIcon} size={15} />
              {nm(cat)}
            </span>
          )}
          {cond && <span>{nm(cond)}</span>}
          {col && (
            <span>
              <Icon name="cap" size={15} />
              {nm(col)}
            </span>
          )}
        </div>
        {desc && <p className="desc">{desc}</p>}
        <div className="want">
          <Icon name="swap" size={18} />
          <div>
            <small>{t('want')}</small>
            <span className="v">{pick(l, 'want')}</span>
          </div>
        </div>
        <div className="contact">
          {l.owner_name && (
            <div className="who">
              {t('by')} {l.owner_name}
            </div>
          )}
          {l.is_example || !l.phone ? (
            <div className="phone-row">
              <span className="phone ex">07X XXX XXXX</span>
              <span className="who">{t('ex_phone')}</span>
            </div>
          ) : (
            <div className="phone-row">
              <span className="phone" ref={phoneRef}>
                {fmtPhone(l.phone)}
              </span>
              <button className="btn btn-sm" type="button" onClick={copyPhone}>
                <Icon name="copy" size={16} />
                <span>{t('copy')}</span>
              </button>
              <a className="btn btn-sm" href={`https://wa.me/962${l.phone.slice(1)}`} target="_blank" rel="noopener noreferrer">
                <Icon name="chat" size={16} />
                <span>{t('whatsapp')}</span>
              </a>
            </div>
          )}
          {actions ?? (mine && <OwnerDeleteButton id={l.id} />)}
        </div>
      </div>
    </article>
  );
}
