"use client";

import { useEffect, useState } from "react";
import { browserStorage, loadTicks, saveTicks, type MinimalStorage } from "@/lib/progress";

export interface FloorStep {
  id: string;
  group: "fix" | "merge" | "delivery";
  text: string;
  detail: string; // e.g. "B-01-2 → B-01-1"
}

const GROUP_TITLES: Record<FloorStep["group"], string> = {
  fix: "First: fix the mixed bin",
  merge: "Merges: empty the part-full bins",
  delivery: "Deliveries: when each one arrives",
};

export default function FloorChecklist({ steps, hash }: { steps: FloorStep[]; hash: string }) {
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  const [storage, setStorage] = useState<MinimalStorage | null>(null);
  const [ready, setReady] = useState(false);

  // Load saved progress after mount (never during render, so server and client agree).
  // Browser storage only exists after hydration, so this is a one-off sync with an
  // external system. Reading it during render would make server and client disagree.
  useEffect(() => {
    const s = browserStorage();
    /* eslint-disable react-hooks/set-state-in-effect */
    setStorage(s);
    setTicks(loadTicks(s, hash, steps.map((x) => x.id)));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hash, steps]);

  function toggle(id: string) {
    setTicks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveTicks(storage, hash, next);
      return next;
    });
  }

  function clearAll() {
    const empty = new Set<string>();
    setTicks(empty);
    saveTicks(storage, hash, empty);
  }

  const done = steps.filter((s) => ticks.has(s.id)).length;
  const percent = steps.length === 0 ? 0 : Math.round((done / steps.length) * 100);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 border-b border-line bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Floor checklist</h2>
          <p className="text-sm font-semibold tabular-nums" aria-live="polite" data-testid="progress">
            {done} of {steps.length} done
          </p>
        </div>
        <div
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          aria-label="Steps done"
        >
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
        </div>
        {ready && storage === null && (
          <p className="mt-2 text-xs text-warn" role="status">
            This browser is blocking storage, so ticks will be lost if you reload.
          </p>
        )}
      </div>

      {(["fix", "merge", "delivery"] as const).map((group) => {
        const items = steps.filter((s) => s.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} aria-label={GROUP_TITLES[group]}>
            <h3 className="mb-2 text-sm font-semibold text-muted">{GROUP_TITLES[group]}</h3>
            <ol className="space-y-2">
              {items.map((s) => {
                const number = steps.indexOf(s) + 1;
                const checked = ticks.has(s.id);
                return (
                  <li key={s.id}>
                    <label
                      className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                        checked ? "border-line bg-track/50" : "border-line bg-surface"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(s.id)}
                        className="mt-0.5 h-7 w-7 shrink-0 accent-[var(--brand)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-mono text-xs text-muted">
                            {number}. {s.id}
                          </span>
                          <span className="font-mono text-sm font-semibold">{s.detail}</span>
                        </span>
                        <span className={`mt-1 block text-base ${checked ? "text-muted line-through" : ""}`}>
                          {s.text}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <button
        type="button"
        onClick={clearAll}
        disabled={done === 0}
        className="min-h-12 rounded-lg border border-line px-4 text-sm disabled:opacity-40"
      >
        Clear all ticks
      </button>
    </div>
  );
}
