import type { Plan, Product } from "@/lib/model";

export interface EmptyCounts {
  now: number;
  afterMerges: number;
  afterDeliveries: number;
  spareAfterDeliveries: string[];
}

export default function MergesView({
  plan,
  products,
  empty,
}: {
  plan: Plan;
  products: Product[];
  empty: EmptyCounts;
}) {
  const name = new Map(products.map((p) => [p.sku, p.name]));
  const fixes = plan.moves.filter((m) => m.kind === "fix-mixed");
  const merges = plan.moves.filter((m) => m.kind === "merge");

  return (
    <div className="space-y-8">
      <section aria-labelledby="merges-heading" className="space-y-3">
        <div>
          <h2 id="merges-heading" className="text-xl font-semibold">
            Merges: what moves, and which bins it frees
          </h2>
          <p className="mt-1 text-sm text-muted">
            Each product moves once. Nothing is mixed, nothing goes over capacity, and sizes match.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Empty bins now" value={empty.now} />
          <Stat label="After the merges" value={empty.afterMerges} note={`${plan.freedBins.length} bins freed: ${plan.freedBins.join(", ")}`} />
          <Stat
            label="After next week's deliveries"
            value={empty.afterDeliveries}
            note={empty.spareAfterDeliveries.join(", ")}
          />
        </div>

        {fixes.length > 0 && (
          <MoveList title="Fix first: a bin holding two products" moves={fixes} name={name} />
        )}
        <MoveList title="Merges" moves={merges} name={name} />

        {plan.notes && plan.notes.length > 0 && (
          <div className="rounded-lg border border-line bg-surface p-4">
            <h3 className="text-sm font-semibold">Left as they are, and why</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {plan.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function MoveList({
  title,
  moves,
  name,
}: {
  title: string;
  moves: Plan["moves"];
  name: Map<string, string>;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4">
      <h3 className="pt-3 text-sm font-semibold">
        {title} ({moves.length})
      </h3>
      <ol className="divide-y divide-line">
        {moves.map((m) => (
          <li key={m.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
            <span className="font-mono text-xs text-muted">{m.id}</span>
            <span className="text-sm">
              Move <strong className="tabular-nums">{m.quantity}</strong> × {name.get(m.sku) ?? m.sku}{" "}
              <span className="font-mono text-xs text-muted">({m.sku})</span>
            </span>
            <span className="font-mono text-sm">
              {m.from} → {m.to}
            </span>
            {m.frees && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-brand-contrast">
                frees {m.frees}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
