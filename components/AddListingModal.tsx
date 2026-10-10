'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Icon from './Icon';
import Dialog from './Dialog';
import { useApp } from './AppProvider';
import { createListing, RateLimitError, uploadImage } from '@/lib/data';
import { resizePhoto } from '@/lib/image';
import { normPhone } from '@/lib/phone';
import { LS } from '@/lib/storage';

type ErrKey = 'title' | 'desc' | 'want' | 'college' | 'owner' | 'phone' | 'photo' | 'cat' | 'cond';

export default function AddListingModal() {
  const { addOpen } = useApp();
  // Mounting the form only while open resets its state on every open.
  return addOpen ? <AddListingForm /> : null;
}

function AddListingForm() {
  const { t, nm, lookups, toast, refresh, addToken, closeAdd } = useApp();

  const [title, setTitle] = useState('');
  const [cat, setCat] = useState(lookups.categories[0]?.id ?? '');
  const [cond, setCond] = useState(lookups.conditions[0]?.id ?? '');
  const [desc, setDesc] = useState('');
  const [want, setWant] = useState('');
  const [college, setCollege] = useState('');
  const [owner, setOwner] = useState('');
  const [phone, setPhone] = useState('');
  const [site, setSite] = useState(''); // honeypot
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [errs, setErrs] = useState<Partial<Record<ErrKey, string>>>({});
  const [busy, setBusy] = useState(false);

  // After a successful post the form is replaced by a note that the listing awaits admin review.
  const [posted, setPosted] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const id = setTimeout(() => titleRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAdd();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener('keydown', onKey);
    };
  }, [closeAdd]);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  function setErr(k: ErrKey, msg?: string) {
    setErrs((e) => ({ ...e, [k]: msg }));
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const blob = await resizePhoto(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setErr('photo');
    } catch {
      toast(t('photo_fail'));
    }
  }

  function removePhoto() {
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (site) return closeAdd();

    const next: Partial<Record<ErrKey, string>> = {};
    if (!title.trim()) next.title = t('e_req');
    if (!desc.trim()) next.desc = t('e_req');
    if (!want.trim()) next.want = t('e_req');
    if (!college) next.college = t('e_req');
    if (!cat) next.cat = t('e_req');
    if (!cond) next.cond = t('e_req');
    if (!owner.trim()) next.owner = t('e_req');
    const ph = normPhone(phone.trim());
    if (!ph) next.phone = t('e_phone');
    if (!photo) next.photo = t('e_photo');
    setErrs(next);
    if (Object.keys(next).length) {
      setTimeout(
        () => formRef.current?.querySelector<HTMLElement>('.field.bad input:not([disabled]), .field.bad select, .field.bad textarea, .field.bad button')?.focus(),
        0,
      );
      return;
    }

    const now = Date.now();
    if (now - LS.get<number>('hu.last', 0) < 30000) return toast(t('wait'));

    setBusy(true);
    try {
      const image_url = await uploadImage(photo!.blob);
      const { id, edit_token } = await createListing({
        title: title.trim(),
        description: desc.trim(),
        want: want.trim(),
        category: cat,
        condition: cond,
        college,
        owner_name: owner.trim(),
        phone: ph!,
        image_url,
      });
      addToken(id, edit_token);
      LS.set('hu.last', now);
      refresh();
      setPosted(true);
    } catch (err) {
      toast(err instanceof RateLimitError ? t('wait') : t('post_fail'));
      setBusy(false);
    }
  }

  const fieldCls = (k: ErrKey, extra = '') => `field${extra}${errs[k] ? ' bad' : ''}`;

  if (posted) {
    return (
      <Dialog title={t('review_title')} description={t('review_hint')} onClose={closeAdd}>
        <button data-autofocus className="btn btn-primary" type="button" onClick={closeAdd}>{t('ok')}</button>
      </Dialog>
    );
  }

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && closeAdd()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="formTitle">
        <div className="sheet-head">
          <h2 id="formTitle">{t('form_title')}</h2>
          <button className="xbtn" type="button" aria-label={t('cancel')} onClick={closeAdd}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <form ref={formRef} onSubmit={submit} noValidate>
          <div className="form-grid">
            <div className={fieldCls('title', ' full')}>
              <label htmlFor="f-title">{t('f_title')}</label>
              <input id="f-title" ref={titleRef} required maxLength={80} autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} />
              <span className="err">{errs.title}</span>
            </div>
            <div className={fieldCls('cat')}>
              <label htmlFor="f-cat">{t('f_cat')}</label>
              <select id="f-cat" required value={cat} onChange={(e) => setCat(e.target.value)}>
                {lookups.categories.map((c) => (
                  <option key={c.id} value={c.id}>{nm(c)}</option>
                ))}
              </select>
            </div>
            <div className={fieldCls('cond')}>
              <label htmlFor="f-cond">{t('f_cond')}</label>
              <select id="f-cond" required value={cond} onChange={(e) => setCond(e.target.value)}>
                {lookups.conditions.map((c) => (
                  <option key={c.id} value={c.id}>{nm(c)}</option>
                ))}
              </select>
            </div>
            <div className={fieldCls('desc', ' full')}>
              <label htmlFor="f-desc">{t('f_desc')}</label>
              <textarea id="f-desc" required maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} />
              <span className="err">{errs.desc}</span>
            </div>
            <div className={fieldCls('want', ' full')}>
              <label htmlFor="f-want">{t('f_want')}</label>
              <input id="f-want" required maxLength={120} autoComplete="off" placeholder={t('f_want_ph')} value={want} onChange={(e) => setWant(e.target.value)} />
              <span className="err">{errs.want}</span>
            </div>
            <div className={fieldCls('college', ' full')}>
              <label htmlFor="f-college">{t('f_college')}</label>
              <select id="f-college" required value={college} onChange={(e) => setCollege(e.target.value)}>
                <option value="">{t('f_choose')}</option>
                {lookups.colleges.map((c) => (
                  <option key={c.id} value={c.id}>{nm(c)}</option>
                ))}
              </select>
              <span className="err">{errs.college}</span>
            </div>
            <div className={fieldCls('owner', ' full')}>
              <label htmlFor="f-owner">{t('f_owner')}</label>
              <input id="f-owner" required maxLength={40} autoComplete="name" value={owner} onChange={(e) => setOwner(e.target.value)} />
              <span className="err">{errs.owner}</span>
            </div>

            <div className={fieldCls('phone', ' full')}>
              <label htmlFor="f-phone">{t('f_phone')}</label>
              <input id="f-phone" required inputMode="tel" dir="ltr" maxLength={20} autoComplete="tel" placeholder="07X XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <small>{t('f_phone_hint')}</small>
              <span className="err">{errs.phone}</span>
            </div>

            <p className="pubnote full">{t('f_review')} {t('f_public')}</p>
            <div className="hp" aria-hidden="true">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} />
              </label>
            </div>
            <div className={fieldCls('photo', ' full')}>
              <span className="lbl">{t('f_photo')}</span>
              <div className="photo-row">
                <button className="btn btn-sm" type="button" onClick={() => fileRef.current?.click()}>
                  <Icon name="camera" size={18} />
                  <span>{t('f_photo_pick')}</span>
                </button>
                {photo && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" />
                    <button className="btn btn-sm" type="button" onClick={removePhoto}>{t('f_photo_remove')}</button>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
              </div>
              <span className="err">{errs.photo}</span>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 18 }}>
            <button className="btn" type="button" onClick={closeAdd}>{t('cancel')}</button>
            <button className="btn btn-primary" type="submit" disabled={busy}>{t('publish')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
