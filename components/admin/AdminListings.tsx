'use client';

import Icon from '@/components/Icon';
import ConfirmButton from '@/components/ConfirmButton';
import ListingCard from '@/components/ListingCard';
import { useApp } from '@/components/AppProvider';
import { adminDeleteListing, approveListing } from '@/lib/data';
import type { MsgKey } from '@/lib/i18n';
import type { Listing } from '@/lib/types';
import { useAdmin } from './AdminContext';

/** One admin list page: every listing with the given status and the actions that fit it. */
export default function AdminListings({ status, title }: { status: Listing['status']; title: MsgKey }) {
  const { t } = useApp();
  const { rows, loadErr, load, act } = useAdmin();
  const list = rows?.filter((r) => r.status === status) ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t(title)}</h1>
          {rows && <p>{t('count', { n: list.length })}</p>}
        </div>
      </div>

      {loadErr && (
        <div className="notice">
          <span>{t('net_err')}</span>
          <button className="btn btn-sm" type="button" onClick={load}>{t('retry')}</button>
        </div>
      )}

      {rows === null ? (
        !loadErr && <p className="who">{t('loading')}</p>
      ) : !list.length ? (
        <div className="empty"><h3>{t('adm_none')}</h3></div>
      ) : (
        <div className="grid">
          {list.map((l) => (
            <ListingCard
              key={l.id}
              l={l}
              actions={
                <div className="admin-actions">
                  {status === 'pending' && (
                    <button className="btn btn-sm btn-primary" type="button" onClick={() => act(() => approveListing(l.id), t('approved_ok'))}>
                      <Icon name="check" size={16} />
                      <span>{t('approve')}</span>
                    </button>
                  )}
                  <ConfirmButton
                    className="btn btn-sm btn-danger"
                    icon={<Icon name="trash" size={16} />}
                    label={status === 'pending' ? t('reject') : t('del')}
                    confirmLabel={status === 'pending' ? t('reject_sure') : t('del_sure')}
                    onConfirm={() => act(() => adminDeleteListing(l.id), t('deleted'))}
                  />
                </div>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
