import type { RunOut, RunOutRow } from "@/lib/run-out";

const STATUS_LABEL: Record<RunOutRow["status"], string> = {
  "out-of-stock": "Out of stock",
  "at-risk": "Running low",
  unknown: "No usage history",
  ok: "OK",
};

const STATUS_STYLE: Record<RunOutRow["status"], string> = {
  "out-of-stock": "text-bad",
  "at-risk": "text-warn",
  unknown: "text-muted",
  ok: "text-ok",
};

function cover(row: RunOutRow): string {
  return row.coverDays === null ? "Unknown" : `${row.coverDays.toFixed(1)} days`;
}

function Row({ row }: { row: RunOutRow }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">
          {row.name} <span className="font-mono text-xs font-normal text-muted">{row.sku}</span>
        </h3>
        <p className={`text-sm font-semibold ${STATUS_STYLE[row.status]}`}>{STATUS_LABEL[row.status]}</p>
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-muted">Counted</dt>
          <dd className="tabular-nums">{row.counted} units</dd>
        </div>
        <div>
          <dt className="text-muted">Used per day</dt>
          <dd className="tabular-nums">{row.dailyUse > 0 ? row.dailyUse.toFixed(1) : "none recorded"}</dd>
        </div>
        <div>
          <dt className="text-muted">Cover</dt>
          <dd className="tabular-nums">{cover(row)}</dd>
        </div>
      </dl>
      {row.incoming.length > 0 && (
        <p className="mt-2 text-sm">
          Coming:{" "}
          {row.incoming.map((l, i) => (
            <span key={l.reference}>
              {i > 0 && "; "}
              <span className="tabular-nums">{l.quantity}</span> due {l.expectedDate} ({l.reference})
            </span>
          ))}
        </p>
      )}
    </li>
  );
}

export default function RunOutView({ runOut }: { runOut: RunOut }) {
  const flagged = runOut.rows.filter((r) => r.status === "out-of-stock" || r.status === "at-risk");
  const rest = runOut.rows.filter((r) => r.status === "unknown" || r.status === "ok");

  return (
    <section aria-labelledby="runout-heading" className="space-y-5">
      <div>
        <h2 id="runout-heading" className="text-xl font-semibold">
          What might run out
        </h2>
        <p className="mt-1 text-sm text-muted">
          Cover is the counted stock divided by the average units that left per day. Flagged when under{" "}
          {runOut.threshold} days, or when nothing is counted.
        </p>
        <p className="mt-1 text-xs text-muted">
          Based on {runOut.historyDays} working days of movements ({runOut.firstDate} to {runOut.lastDate}), days with at
          least one movement. The movement records do not reconcile exactly to the stock count, so treat cover as a
          guide. The count is used as the truth.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">At risk ({flagged.length})</h3>
        {flagged.length === 0 ? (
          <p className="text-sm text-muted">Nothing is running low.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {flagged.map((r) => (
              <Row key={r.sku} row={r} />
            ))}
          </ul>
        )}
      </div>

      <details className="rounded-lg border border-line bg-surface px-4">
        <summary className="cursor-pointer py-3 text-sm font-semibold">Everything else ({rest.length})</summary>
        <ul className="grid gap-3 pb-4 md:grid-cols-2">
          {rest.map((r) => (
            <Row key={r.sku} row={r} />
          ))}
        </ul>
      </details>
    </section>
  );
}
