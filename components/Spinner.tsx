/** Circular progress indicator. Decorative inside a labelled button; pass `label` when it stands alone. */
export default function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <span className="spin" role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
        <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** A centred spinner with a caption, for whole sections that are loading. */
export function Loader({ label }: { label: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <Spinner size={36} />
      <span>{label}</span>
    </div>
  );
}
