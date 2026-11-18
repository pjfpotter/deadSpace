import type { Fullness, SizeFullness } from "@/lib/fullness";

function Bar({ percent }: { percent: number | null }) {
  const width = percent === null ? 0 : Math.min(100, percent);
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-track"
      role="img"
      aria-label={percent === null ? "Capacity unknown" : `${Math.round(percent)} percent full`}
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
    </div>
  );
}

function SizeCard({ s }: { s: SizeFullness }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{s.size}</h3>
        <p className="text-2xl font-semibold tabular-nums">
          {s.percent === null ? "n/a" : `${Math.round(s.percent)}%`}
        </p>
      </div>
      <div className="mt-2">
        <Bar percent={s.percent} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Bins</dt>
        <dd className="text-right tabular-nums">{s.bins}</dd>
        <dt className="text-muted">Units in bins</dt>
        <dd className="text-right tabular-nums">
          {s.unitsInKnownBins} of {s.knownCapacity}
        </dd>
        <dt className="text-muted">Empty bins</dt>
        <dd className="text-right tabular-nums">{s.emptyBins.length}</dd>
        <dt className="text-muted">Under half full</dt>
        <dd className="text-right tabular-nums">{s.underHalfBins.length}</dd>
      </dl>
      {s.excludedBins.length > 0 && (
        <p className="mt-3 text-xs text-warn">
          {s.excludedBins.join(", ")} left out of the percentage: capacity unknown (
          {s.unitsUsed - s.unitsInKnownBins} units are in it).
        </p>
      )}
    </div>
  );
}

export default function FullnessView({ fullness }: { fullness: Fullness }) {
  const { overall, bySize } = fullness;
  const underHalf = [...overall.underHalfBins].sort((a, b) => a.bin.localeCompare(b.bin));

  return (
    <section aria-labelledby="fullness-heading" className="space-y-5">
      <div>
        <h2 id="fullness-heading" className="text-xl font-semibold">
          How full the stores are
        </h2>
        <p className="mt-1 text-sm text-muted">
          From the latest stock count. Capacity is counted in units.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Space used"
          value={overall.percent === null ? "n/a" : `${Math.round(overall.percent)}%`}
          note={`${overall.unitsInKnownBins} of ${overall.knownCapacity} units`}
          primary
        />
        <Stat label="Empty bins" value={String(overall.emptyBins.length)} note={overall.emptyBins.join(", ") || "none"} />
        <Stat
          label="Bins under half full"
          value={String(underHalf.length)}
          note={`of ${overall.bins - overall.emptyBins.length} bins holding stock`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bySize.map((s) => (
          <SizeCard key={s.size} s={s} />
        ))}
      </div>

      <details className="rounded-lg border border-line bg-surface px-4">
        <summary className="cursor-pointer py-3 text-sm font-semibold">
          Bins under half full ({underHalf.length})
        </summary>
        <div className="overflow-x-auto pb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 pr-4 font-medium">Bin</th>
                <th className="py-1 pr-4 font-medium">Size</th>
                <th className="py-1 pr-4 text-right font-medium">Units</th>
                <th className="py-1 text-right font-medium">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {underHalf.map((b) => (
                <tr key={b.bin} className="border-t border-line">
                  <td className="py-1 pr-4 font-mono">{b.bin}</td>
                  <td className="py-1 pr-4">{b.size}</td>
                  <td className="py-1 pr-4 text-right tabular-nums">{b.units}</td>
                  <td className="py-1 text-right tabular-nums">{b.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function Stat({
  label,
  value,
  note,
  primary = false,
}: {
  label: string;
  value: string;
  note: string;
  primary?: boolean;
}) {
  return (
    <div
      className={
        primary
          ? "rounded-md bg-header p-4 text-white"
          : "rounded-md border border-line bg-surface p-4"
      }
    >
      <p className={`text-sm ${primary ? "text-white/70" : "text-muted"}`}>{label}</p>
      <p className="mt-1 text-4xl font-extrabold tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${primary ? "text-white/70" : "text-muted"}`}>{note}</p>
    </div>
  );
}
