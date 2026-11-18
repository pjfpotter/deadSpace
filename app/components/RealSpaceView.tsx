import type { RealSpace, SpaceClass } from "@/lib/real-space";

function Bar({ percent, label }: { percent: number | null; label: string }) {
  const width = percent === null ? 0 : Math.min(100, percent);
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-track"
      role="img"
      aria-label={percent === null ? `${label}: unknown` : `${label}: ${Math.round(percent)} percent`}
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
    </div>
  );
}

const fmt = (p: number | null) => (p === null ? "n/a" : `${Math.round(p)}%`);

function Card({ c, weight, volume }: { c: SpaceClass; weight: number; volume: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h3 className="font-semibold">{c.size}</h3>
      <div className="mt-3 space-y-3">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Full by units</span>
            <span className="font-semibold tabular-nums">{fmt(c.unitsPercent)}</span>
          </div>
          <Bar percent={c.unitsPercent} label="Full by units" />
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Full by estimated space</span>
            <span className="font-semibold tabular-nums">{fmt(c.spacePercent)}</span>
          </div>
          <Bar percent={c.spacePercent} label="Full by estimated space" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Assumed {weight} m³ per unit, {volume} m³ per bin. About {c.spaceUsedM3.toFixed(1)} of{" "}
        {c.spaceAvailableM3.toFixed(1)} m³ used.
      </p>
      {c.excludedBins.length > 0 && (
        <p className="mt-1 text-xs text-warn">{c.excludedBins.join(", ")} left out: capacity unknown.</p>
      )}
    </div>
  );
}

export default function RealSpaceView({ space }: { space: RealSpace }) {
  return (
    <section aria-labelledby="space-heading" className="space-y-5">
      <div>
        <h2 id="space-heading" className="text-xl font-semibold">
          Real space
        </h2>
        <p className="mt-1 text-sm text-muted">
          How full the stores are in estimated space, beside the fullness in units. For information only: the merge list
          and delivery plan still use capacity in units.
        </p>
        <p role="note" className="mt-2 rounded-md border border-warn bg-surface p-3 text-sm text-warn">
          These weights are assumptions. The data has no product or bin dimensions, so the space per unit and bin volumes
          below are illustrative guesses to be measured, not facts.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {space.classes.map((c) => (
          <Card key={c.size} c={c} weight={space.weights[c.size]} volume={space.binVolumes[c.size]} />
        ))}
      </div>
    </section>
  );
}
