"use client";

import { useMemo, useState } from "react";
import { assumptionRegister, openQuestions } from "@/lib/assumptions";
import { planLevers, type LeverStep } from "@/lib/make-room";
import type { Order, StoreData } from "@/lib/model";
import {
  analyse,
  buildTimeline,
  checkAssumptions,
  defaultAssumptions,
  type Analysis,
  type ClassNeed,
} from "@/lib/timeline";

// Everything is computed here in the browser from the sanitised fixtures: no network
// request, no LLM call. The arithmetic is lib/timeline.ts; any "it fits" is also placed
// by the real solver and checked by the validator (lib/make-room.ts).

const largeOf = (needs: ClassNeed[]) => needs.find((c) => c.size === "Large")!;

function WorkingTable({ analysis, index }: { analysis: Analysis; index: number }) {
  const snap = analysis.snapshots[index];
  const classes = analysis.needs[index];
  const l = largeOf(classes);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {snap.date}: {snap.label}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">Large bins needed on {snap.date}</caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-medium">Product</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Units</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Bin holds</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Working</th>
              <th scope="col" className="py-2 text-right font-medium">Bins</th>
            </tr>
          </thead>
          <tbody>
            {l.rows.map((r) => (
              <tr key={r.sku} className="border-b border-line">
                <th scope="row" className="py-2 pr-3 font-normal">
                  {r.name} <span className="font-mono text-xs text-muted">{r.sku}</span>
                </th>
                <td className="py-2 pr-3 text-right tabular-nums">{r.units}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{r.capacity}</td>
                <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums text-muted">
                  ⌈{r.units - r.lockedUnits} ÷ {r.capacity}⌉
                </td>
                <td className="py-2 text-right font-semibold tabular-nums">{r.bins}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={4} className="py-2 pr-3 text-right font-medium">
                Large bins needed / available
              </th>
              <td className={`py-2 text-right font-semibold tabular-nums ${l.short > 0 ? "text-bad" : "text-ok"}`}>
                {l.needed} / {l.available}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-muted">
        One product per bin, so each product rounds up to whole bins. Other size classes at this point:{" "}
        {classes
          .filter((c) => c.size !== "Large")
          .map((c) => `${c.size} ${c.needed}/${c.available}${c.fits ? "" : " (over)"}`)
          .join(", ")}
        .
      </p>
    </div>
  );
}

function DayTable({ analysis, title }: { analysis: Analysis; title: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="pb-2 text-left text-sm font-medium">{title}</caption>
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 font-medium">Date</th>
            <th scope="col" className="py-2 pr-3 font-medium">What happens</th>
            <th scope="col" className="py-2 text-right font-medium">Large bins</th>
          </tr>
        </thead>
        <tbody>
          {analysis.snapshots.map((s, i) => {
            const l = largeOf(analysis.needs[i]);
            return (
              <tr key={s.index} className="border-b border-line">
                <td className="whitespace-nowrap py-2 pr-3 tabular-nums">{s.date}</td>
                <td className="py-2 pr-3">
                  {s.label}
                  {s.shortfall && (
                    <span className="block text-xs text-bad">
                      {s.shortfall.orderRef} is {s.shortfall.short} short of stock.
                    </span>
                  )}
                </td>
                <td className={`whitespace-nowrap py-2 text-right font-semibold tabular-nums ${l.short > 0 ? "text-bad" : "text-ok"}`}>
                  {l.needed} of {l.available}
                  {l.short > 0 ? ` (${l.short} short)` : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Step({ step, n }: { step: LeverStep; n: number }) {
  const tone = step.needsDecision ? "text-warn" : step.applied ? "text-ok" : "text-muted";
  const status = step.needsDecision
    ? "Needs a decision"
    : step.kind === "existing-merges"
      ? "Already counted"
      : step.applied
        ? "Part of the answer"
        : step.alternative
          ? "Another way"
          : "Tried, not used";
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold">
          {n}. {step.title}
        </h4>
        <span className={`text-xs font-semibold ${tone}`}>{status}</span>
      </div>
      <p className="mt-1 text-sm">{step.detail}</p>
      {step.kind !== "existing-merges" && (
        <p className="mt-2 text-sm tabular-nums">
          Bins short at the peak: <strong>{step.shortBefore}</strong> → <strong>{step.shortAfter}</strong>
          {step.binsFreed > 0 ? ` (${step.binsFreed} freed)` : ""}
        </p>
      )}
      <p className="mt-1 text-xs text-muted">
        Who: {step.owner}.{step.deadline ? ` Latest date: ${step.deadline}.` : ""}
      </p>
    </li>
  );
}

export default function DecemberView({ data, orders }: { data: StoreData; orders: Order[] }) {
  const defaults = useMemo(() => defaultAssumptions(orders), [orders]);
  const [arrival, setArrival] = useState(defaults.benchArrival);
  const [lead, setLead] = useState(String(defaults.leadDays));
  const assumptions = { benchArrival: arrival, leadDays: Number(lead) };
  const problem = lead.trim() === "" ? "Enter the dispatch lead time in days." : checkAssumptions(data, orders, assumptions);

  const result = useMemo(() => {
    if (problem) return null;
    const timeline = buildTimeline(data, orders, { benchArrival: arrival, leadDays: Number(lead) });
    return { before: analyse(timeline), room: planLevers(timeline) };
  }, [data, orders, arrival, lead, problem]);

  const isDefault = arrival === defaults.benchArrival && lead === String(defaults.leadDays);
  const register = assumptionRegister(data, problem ? defaults : assumptions);

  let headline = "";
  let tone = "text-foreground";
  if (result) {
    const { before, room } = result;
    const l = largeOf(before.needs[before.peak.index]);
    if (before.peak.short === 0) {
      headline = "Yes. The stores can hold all three orders, with no change to the plan.";
      tone = "text-ok";
    } else if (room.fits) {
      headline = `Not as things stand: Large needs ${l.needed} bins on ${before.snapshots[before.peak.index].date} and we have ${l.available}. It can be made to fit with the steps below.`;
      tone = "text-warn";
    } else {
      headline = `No. Large needs ${l.needed} bins on ${before.snapshots[before.peak.index].date} and we have ${l.available}, and the steps below that keep the store rules do not close the gap. A decision is needed.`;
      tone = "text-bad";
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="dec-heading" className="space-y-3">
        <h2 id="dec-heading" className="text-xl font-semibold">
          Can the stores hold the December orders?
        </h2>
        {result ? (
          <p aria-live="polite" className={`text-lg font-semibold ${tone}`}>
            {headline}
          </p>
        ) : (
          <p role="alert" className="rounded-lg border border-bad bg-surface p-3 text-sm text-bad">
            {problem}
          </p>
        )}
        <p className="text-sm text-muted">
          CO-8801 (40 two-seat benches) and CO-8802 (16 folding chairs) are due on 4 Dec, CO-8803 (24
          three-seat benches) on 11 Dec. The two assumptions below are guesses; change them to see the
          answer move.
        </p>

        <form className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-end" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col gap-1 text-sm">
            Extra benches arrive (assumed)
            <input
              type="date"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className="min-h-11 rounded-md border border-line bg-background px-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:w-48">
            Orders leave this many days before delivery
            <input
              type="text"
              inputMode="numeric"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              className="min-h-11 rounded-md border border-line bg-background px-2"
            />
          </label>
          <button
            type="button"
            disabled={isDefault}
            onClick={() => {
              setArrival(defaults.benchArrival);
              setLead(String(defaults.leadDays));
            }}
            className="min-h-11 rounded-md border border-line px-4 font-semibold disabled:opacity-50"
          >
            Restore defaults
          </button>
        </form>
      </section>

      {result && (
        <>
          <section aria-labelledby="work-heading" className="space-y-3">
            <h3 id="work-heading" className="text-lg font-semibold">
              The working
            </h3>
            {result.before.peak.short > 0 ? (
              <>
                <p className="text-sm">
                  The worst moment is {result.before.snapshots[result.before.peak.index].date}. Large is over its bins on:{" "}
                  <strong>{result.before.overDates.Large.join(", ") || "no day"}</strong>.
                </p>
                <WorkingTable analysis={result.before} index={result.before.peak.index} />
              </>
            ) : (
              <WorkingTable analysis={result.before} index={result.before.peak.index} />
            )}
            <DayTable analysis={result.before} title="Day by day, with no changes" />
          </section>

          <section aria-labelledby="give-heading" className="space-y-3">
            <h3 id="give-heading" className="text-lg font-semibold">
              What has to give, in order
            </h3>
            {result.before.peak.short === 0 ? (
              <p className="text-sm text-muted">Nothing: the orders fit as planned.</p>
            ) : (
              <>
                <ol className="space-y-3">
                  {result.room.steps.map((s, i) => (
                    <Step key={s.kind} step={s} n={i + 1} />
                  ))}
                </ol>
                <p
                  className={`text-sm font-semibold ${result.room.fits ? "text-ok" : "text-bad"}`}
                  aria-live="polite"
                >
                  {result.room.fits
                    ? "With the steps marked Part of the answer, every size class fits on every date, and the real solver and the rules validator agree."
                    : result.room.shortAfter > 0
                      ? `Even with every step that keeps the store rules, ${result.room.shortAfter} bin${result.room.shortAfter === 1 ? " is" : "s are"} still short.`
                      : "The arithmetic fits, but the placement check found a problem:"}
                </p>
                {result.room.placementProblems.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-bad">
                    {result.room.placementProblems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {result.room.final.notes.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                    {result.room.final.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
                {result.room.fits && <DayTable analysis={result.room.after} title="Day by day, with the steps applied" />}
              </>
            )}
          </section>
        </>
      )}

      <section aria-labelledby="assume-heading" className="space-y-3">
        <h3 id="assume-heading" className="text-lg font-semibold">
          What we are unsure about
        </h3>
        <ul className="space-y-3">
          {register.map((r) => (
            <li key={r.id} className="rounded-lg border border-line bg-surface p-4 text-sm">
              <p className="font-medium">{r.assumption}</p>
              <p className="mt-1 text-muted">
                <span className="font-semibold">If wrong:</span> {r.effect}
              </p>
              <p className="mt-1 text-xs text-muted">
                Source: {r.source}. Can confirm: {r.owner}.
              </p>
            </li>
          ))}
        </ul>
        <h4 className="pt-2 font-semibold">Questions for the organiser</h4>
        <ul className="space-y-3">
          {openQuestions().map((q) => (
            <li key={q.id} className="rounded-lg border border-line bg-surface p-4 text-sm">
              <p className="font-medium">{q.question}</p>
              <p className="mt-1 text-muted">
                <span className="font-semibold">It would change:</span> {q.changes}
              </p>
              <p className="mt-1 text-xs text-muted">Ask: {q.owner}.</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
