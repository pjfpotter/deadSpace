"use client";

import { useState } from "react";
import { checkFit, type FitCheck as FitCheckResult, type FitResult } from "@/lib/fit";
import type { Plan, StoreData } from "@/lib/model";

// The answer is computed in the browser from the sanitised store data and the stored plan.
// There is no network request, no solver run and no LLM call.

function ResultCard({
  title,
  note,
  result,
  name,
}: {
  title: string;
  note: string;
  result: FitResult | null;
  name: string;
}) {
  if (!result) {
    return (
      <div className="rounded-lg border border-line bg-surface p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-warn">Not shown: the plan breaks a store rule.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-muted">{note}</p>
      <p className={`mt-2 text-lg font-semibold ${result.fits ? "text-ok" : "text-bad"}`}>
        {result.fits ? "It fits" : `Does not fit: ${result.short} units short`}
      </p>
      {result.allocations.length > 0 ? (
        <ul className="mt-2 divide-y divide-line border-t border-line text-sm">
          {result.allocations.map((a) => (
            <li key={a.bin} className="py-2">
              <span className="font-mono font-semibold">{a.bin}</span>:{" "}
              <span className="tabular-nums">{a.units}</span> × {name}{" "}
              <span className="text-muted">({a.how === "top-up" ? "tops up an existing bin" : "empty bin"})</span>
              {a.madeRoomBy ? <p className="text-xs text-muted">Free only after: {a.madeRoomBy}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No usable room for this product.</p>
      )}
      {result.excluded.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          Left out because they are flagged:{" "}
          {result.excluded.map((e) => `${e.bin} (${e.reason})`).join(", ")}.
        </p>
      )}
    </div>
  );
}

export default function FitCheck({ data, plan }: { data: StoreData; plan: Plan }) {
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [answer, setAnswer] = useState<FitCheckResult | null>(null);

  const products = [...data.products].sort((a, b) => a.name.localeCompare(b.name));
  const name = (s: string) => data.products.find((p) => p.sku === s)?.name ?? s;

  return (
    <section aria-labelledby="fit-heading" className="space-y-4">
      <div>
        <h2 id="fit-heading" className="text-xl font-semibold">
          Can we fit it?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Pick a product and a quantity. We check the room the store rules allow, now and after the
          merges. Next week&apos;s deliveries are counted as already taking their room. This only
          answers the question; it changes nothing in the plan.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setAnswer(checkFit(data, plan, sku, qty));
        }}
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Product
          <select
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="min-h-11 rounded-md border border-line bg-background px-2"
          >
            <option value="">Choose a product…</option>
            {products.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.name} ({p.sku}, {p.size})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-32">
          Quantity
          <input
            type="text"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="min-h-11 rounded-md border border-line bg-background px-2"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-md bg-brand px-4 font-semibold text-brand-contrast"
        >
          Check
        </button>
      </form>

      {answer && "error" in answer && (
        <p role="alert" className="rounded-lg border border-bad bg-surface p-3 text-sm text-bad">
          {answer.error}
        </p>
      )}

      {answer && !("error" in answer) && (
        <div aria-live="polite" className="space-y-3">
          <p className="text-sm">
            <strong className="tabular-nums">{answer.quantity}</strong> × {name(answer.sku)}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <ResultCard title="Now" note="Latest count" result={answer.now} name={name(answer.sku)} />
            <ResultCard
              title="After merges"
              note="After the merges and next week's deliveries"
              result={answer.afterMerges}
              name={name(answer.sku)}
            />
          </div>
          {answer.afterMergesNote && <p className="text-sm text-warn">{answer.afterMergesNote}</p>}
        </div>
      )}
    </section>
  );
}
