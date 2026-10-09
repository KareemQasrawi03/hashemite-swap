'use client';

import { useRef } from 'react';
import Icon from './Icon';
import ConfirmButton from './ConfirmButton';
import { useApp } from './AppProvider';
import { fmtPhone } from '@/lib/phone';
import type { Listing } from '@/lib/types';

export default function ListingCard({ l }: { l: Listing }) {
  const { t, nm, pick, lookups, isMine, removeListing, refresh, toast } = useApp();
  const phoneRef = useRef<HTMLSpanElement>(null);

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

  async function del() {
    try {
      await removeListing(l.id);
      toast(t('deleted'));
    } catch {
      toast(t('del_fail'));
    }
    refresh();
  }

  return (
    <article className="card">
      <div className="media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {l.image_url ? <img src={l.image_url} alt="" loading="lazy" /> : <Icon name={catIcon} size={44} />}
        {l.is_example ? (
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
          {mine && (
            <ConfirmButton
              className="btn btn-sm btn-danger"
              icon={<Icon name="trash" size={16} />}
              label={t('del')}
              confirmLabel={t('del_sure')}
              onConfirm={del}
            />
          )}
        </div>
      </div>
    </article>
  );
}
