import StudioMap from './StudioMap'

/** One map in Map Studio's frame, with its caption and legend on top. */
export default function StudioPanel({
  caption,
  legend,
  compact,
  divider,
  selected,
  dark,
  panelClass,
  onSelect,
  ...mapProps
}) {
  return (
    <div className="relative min-h-0 min-w-0 overflow-hidden" onPointerDown={onSelect}>
      <StudioMap {...mapProps} />

      {divider && <div className={`pointer-events-none absolute ${divider} ${dark ? 'bg-white/25' : 'bg-black/25'}`} />}
      {selected && <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-naija-500" />}

      {caption && (
        <p className={`pointer-events-none absolute left-3 top-3 max-w-[calc(100%-4rem)] truncate rounded-md border px-2 py-1 text-xs font-semibold backdrop-blur ${panelClass}`}>
          {caption}
        </p>
      )}

      {legend && (
        <div className={`absolute bottom-9 left-3 max-h-[55%] overflow-y-auto rounded-lg border px-3 py-2 text-xs backdrop-blur ${compact ? 'w-48' : 'w-56'} ${panelClass}`}>
          <p className={`mb-1.5 font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{legend.title}</p>
          <ul className="space-y-1">
            {legend.items.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="flex-1">{item.label}</span>
                {item.value != null && <span className="tabular-nums opacity-70">{item.value.toLocaleString('en-US')}</span>}
              </li>
            ))}
          </ul>
          {legend.note && <p className="mt-1.5 leading-snug opacity-70">{legend.note}</p>}
        </div>
      )}
    </div>
  )
}
