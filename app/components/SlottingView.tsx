import { SIZE_CLASSES } from "@/lib/model";
import { REACH_RULE, type Slotting } from "@/lib/slotting";

export default function SlottingView({ slotting }: { slotting: Slotting }) {
  return (
    <section aria-labelledby="slotting-heading" className="space-y-5">
      <div>
        <h2 id="slotting-heading" className="text-xl font-semibold">
          Fast movers
        </h2>
        <p className="mt-1 text-sm text-muted">
          Optional swaps that put the products picked most often in the bins that are easiest to reach.
          These are not part of the merge list or the delivery plan, and nothing here needs doing.
        </p>
        <p className="mt-1 text-xs text-muted">
          Easy to reach is an assumption: {REACH_RULE} A swap only happens between two single-product bins of the same
          size, and only if each product&apos;s stock fits the other bin. Picks are counted from outbound movements.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Suggested swaps ({slotting.swaps.length})</h3>
        {slotting.swaps.length === 0 ? (
          <p className="text-sm text-muted">No safe swap would make picking easier.</p>
        ) : (
          <ol className="space-y-3">
            {slotting.swaps.map((s) => (
              <li key={`${s.fast.from}-${s.slow.from}`} className="rounded-lg border border-line bg-surface p-4 text-sm">
                <p className="text-xs text-muted">{s.size}</p>
                <p>
                  Move <strong>{s.fast.quantity}</strong> × {s.fast.name} from{" "}
                  <span className="font-mono font-semibold">{s.fast.from}</span> to{" "}
                  <span className="font-mono font-semibold">{s.fast.to}</span>
                  <span className="text-muted"> ({s.fast.picks} picks)</span>.
                </p>
                <p>
                  Move <strong>{s.slow.quantity}</strong> × {s.slow.name} from{" "}
                  <span className="font-mono font-semibold">{s.slow.from}</span> to{" "}
                  <span className="font-mono font-semibold">{s.slow.to}</span>
                  <span className="text-muted"> ({s.slow.picks} picks)</span>.
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <details className="rounded-lg border border-line bg-surface px-4">
        <summary className="cursor-pointer py-3 text-sm font-semibold">Most picked, by size</summary>
        <div className="grid gap-4 pb-4 sm:grid-cols-2">
          {SIZE_CLASSES.map((size) => {
            const group = slotting.ranking.find((r) => r.size === size)!;
            return (
              <div key={size}>
                <h4 className="font-semibold">{size}</h4>
                <ol className="mt-1 text-sm">
                  {group.products.map((p) => (
                    <li key={p.sku} className="flex justify-between border-t border-line py-1">
                      <span>{p.name}</span>
                      <span className="tabular-nums text-muted">{p.picks}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
