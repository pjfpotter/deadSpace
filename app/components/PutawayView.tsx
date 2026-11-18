import type { IncomingLine, Plan, Product } from "@/lib/model";

export default function PutawayView({
  plan,
  incoming,
  products,
}: {
  plan: Plan;
  incoming: IncomingLine[];
  products: Product[];
}) {
  const name = new Map(products.map((p) => [p.sku, p.name]));
  const lines = [...incoming].sort(
    (a, b) => a.expectedDate.localeCompare(b.expectedDate) || a.reference.localeCompare(b.reference),
  );

  return (
    <section aria-labelledby="putaway-heading" className="space-y-4">
      <div>
        <h2 id="putaway-heading" className="text-xl font-semibold">
          Next week&apos;s deliveries: which bin each one goes in
        </h2>
        <p className="mt-1 text-sm text-muted">
          Every delivery and production run is placed. Where a bin only becomes free after a merge,
          the merge is named so it is done first.
        </p>
      </div>

      {plan.unplaced.length > 0 && (
        <div role="alert" className="rounded-lg border border-bad bg-surface p-4">
          <h3 className="font-semibold text-bad">Not everything fits</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {plan.unplaced.map((u) => (
              <li key={`${u.reference}-${u.sku}`}>
                <strong>{u.reference}</strong>: {u.quantity} × {name.get(u.sku) ?? u.sku}. {u.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lines.map((line) => {
        const puts = plan.putaways.filter((p) => p.reference === line.reference && p.sku === line.sku);
        const placed = puts.reduce((s, p) => s + p.quantity, 0);
        return (
          <article key={`${line.reference}-${line.sku}`} className="rounded-lg border border-line bg-surface p-4">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-semibold">
                <span className="font-mono">{line.reference}</span>{" "}
                <span className="font-normal text-muted">{line.source.toLowerCase()}</span>
              </h3>
              <p className="text-sm text-muted">Due {line.expectedDate}</p>
            </header>
            <p className="mt-1 text-sm">
              <strong className="tabular-nums">{line.quantity}</strong> × {name.get(line.sku) ?? line.sku}{" "}
              <span className="font-mono text-xs text-muted">({line.sku})</span>
              {line.supplier ? <span className="text-muted"> from {line.supplier}</span> : null}
            </p>
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {puts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="font-mono text-xs text-muted">{p.id}</span>
                  <span>
                    <strong className="tabular-nums">{p.quantity}</strong> into{" "}
                    <span className="font-mono font-semibold">{p.to}</span>
                  </span>
                  <span className="text-muted">{p.topUp ? "tops up the bin already holding it" : "empty bin"}</span>
                  {p.madeRoomBy && (
                    <span className="rounded-full border border-warn px-2 py-0.5 text-xs text-warn">
                      after {p.madeRoomBy} frees it
                    </span>
                  )}
                </li>
              ))}
              {puts.length === 0 && <li className="py-2 text-sm text-bad">No bin found.</li>}
            </ul>
            {placed !== line.quantity && puts.length > 0 && (
              <p className="mt-2 text-xs text-bad">
                {line.quantity - placed} of {line.quantity} units could not be placed.
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
