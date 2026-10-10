'use client';

import { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import type { MsgKey } from '@/lib/i18n';

export type DonutSlice = { key: string; label: MsgKey; value: number; color: string };

const SIZE = 200;
const R = 80;
const STROKE = 26;
const C = 2 * Math.PI * R;
const GAP = 3; // surface gap between segments, in px along the ring

/**
 * Part-to-whole ring for a handful of statuses. The centre shows the total, or the hovered/focused
 * slice; the legend beside it lists every value, so nothing relies on colour alone.
 */
export default function StatusDonut({ slices }: { slices: DonutSlice[] }) {
  const { t } = useApp();
  const [active, setActive] = useState<string | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const nonZero = slices.filter((s) => s.value > 0).length;
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const shown = slices.find((s) => s.key === active);

  let offset = 0;
  const arcs = slices.map((s) => {
    const len = total ? (s.value / total) * C : 0;
    const visible = Math.max(0, len - (nonZero > 1 ? GAP : 0));
    const arc = { ...s, dash: `${visible} ${C - visible}`, offset: -offset };
    offset += len;
    return arc;
  });

  const summary = slices.map((s) => `${t(s.label)}: ${s.value}`).join('، ');

  return (
    <div className="donut-wrap">
      <div className="donut">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label={summary}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" style={{ stroke: 'var(--surface-2)' }} strokeWidth={STROKE} />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map(
              (a) =>
                a.value > 0 && (
                  <circle
                    key={a.key}
                    className={'dseg' + (active && active !== a.key ? ' dim' : '')}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    style={{ stroke: a.color }}
                    strokeWidth={STROKE}
                    strokeDasharray={a.dash}
                    strokeDashoffset={a.offset}
                    onMouseEnter={() => setActive(a.key)}
                    onMouseLeave={() => setActive(null)}
                  />
                ),
            )}
          </g>
        </svg>
        <div className="donut-center" aria-hidden="true">
          {total === 0 ? (
            <span>{t('adm_empty_chart')}</span>
          ) : shown ? (
            <>
              <b>{shown.value}</b>
              <span>{t(shown.label)} · {pct(shown.value)}٪</span>
            </>
          ) : (
            <>
              <b>{total}</b>
              <span>{t('adm_total')}</span>
            </>
          )}
        </div>
      </div>

      <ul className="legend">
        {slices.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              aria-pressed={active === s.key}
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(s.key)}
              onBlur={() => setActive(null)}
            >
              <span className="sw" style={{ background: s.color }} />
              <span>{t(s.label)}</span>
              <span className="n">{s.value}</span>
              <span className="p">{pct(s.value)}٪</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
