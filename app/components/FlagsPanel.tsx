import type { Flag, FlagKind } from "@/lib/model";

const TITLES: Record<FlagKind, string> = {
  "mixed-bin": "Two products in one bin",
  "over-capacity": "Over capacity",
  "unknown-capacity": "Capacity unknown",
  "stale-count": "Count out of date",
};

// Most serious first. Stale counts are shown last and collapsed because there are many.
const ORDER: FlagKind[] = ["mixed-bin", "over-capacity", "unknown-capacity", "stale-count"];

export default function FlagsPanel({ flags }: { flags: Flag[] }) {
  return (
    <section aria-labelledby="flags-heading" className="space-y-4">
      <div>
        <h2 id="flags-heading" className="text-xl font-semibold">
          Data problems and what we did about them
        </h2>
        <p className="mt-1 text-sm text-muted">
          The stock count is treated as truth and is never changed. Bins that are over capacity or
          have no capacity are locked: they keep their stock but never receive any.
        </p>
      </div>

      {ORDER.map((kind) => {
        const items = flags.filter((f) => f.kind === kind);
        if (items.length === 0) return null;
        const body = (
          <ul className="divide-y divide-line">
            {items.map((f) => (
              <li key={f.id} className="py-3">
                <p className="font-mono text-sm font-semibold">{f.bin}</p>
                <p className="mt-0.5 text-sm">{f.detail}</p>
                <p className="mt-1 text-sm text-muted">
                  <span className="font-semibold text-foreground">Decision: </span>
                  {f.decision}
                </p>
              </li>
            ))}
          </ul>
        );
        return kind === "stale-count" ? (
          <details key={kind} className="rounded-lg border border-line bg-surface px-4">
            <summary className="cursor-pointer py-3 text-sm font-semibold">
              {TITLES[kind]} ({items.length})
            </summary>
            {body}
          </details>
        ) : (
          <div key={kind} className="rounded-lg border border-line bg-surface px-4">
            <h3 className="pt-3 text-sm font-semibold">
              {TITLES[kind]} ({items.length})
            </h3>
            {body}
          </div>
        );
      })}
    </section>
  );
}
