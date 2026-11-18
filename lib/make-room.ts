import { solve } from "./solve";
import {
  addDays,
  analyse,
  BENCH_REF,
  BENCH_SKU,
  placeAt,
  sortEvents,
  type Analysis,
  type Timeline,
  type TimelineEvent,
} from "./timeline";

/**
 * "What has to give" when the orders do not fit. Levers are tried in order of
 * disruption; each is applied to a copy of the timeline and the result is re-analysed,
 * so the combined answer is recomputed rather than added up.
 *
 *  1. merges already in the plan (already counted in day zero; shown for completeness)
 *  2. dispatch an order early, before the benches land
 *  3. split the bench delivery into batches that leave as they arrive, or
 *  4. cross-dock the benches (line to dock, never in a bin)
 *  5. changes that need a decision (never applied silently)
 */

export type LeverKind = "existing-merges" | "dispatch-early" | "split-receipt" | "cross-dock" | "rule-change";

export interface LeverStep {
  kind: LeverKind;
  title: string;
  detail: string;
  /** Who has to agree or do it. */
  owner: string;
  /** Latest date it can still be done, when there is one. */
  deadline?: string;
  /** True when it changes a store rule or layout and needs the stores manager's decision. */
  needsDecision: boolean;
  /** True when this step is part of the combined answer. */
  applied: boolean;
  /** True when it is another way to get the same result as the step before it. */
  alternative?: boolean;
  /** Total bins short at the peak before and after this step on its own. */
  shortBefore: number;
  shortAfter: number;
  /** shortBefore - shortAfter */
  binsFreed: number;
}

export interface RoomPlan {
  steps: LeverStep[];
  /** The timeline with every applied lever in place. */
  final: Timeline;
  before: Analysis;
  after: Analysis;
  /** Bins short at the peak with every applied lever. */
  shortAfter: number;
  /** True when the arithmetic fits at every date and the real solver and validator agree at every date. */
  fits: boolean;
  /** Why a result that fits on paper was not accepted (validator violations or unplaced stock). */
  placementProblems: string[];
}

const shortOf = (t: Timeline) => analyse(t).peak.short;
const withEvents = (t: Timeline, events: TimelineEvent[], note?: string): Timeline => ({
  ...t,
  events: sortEvents(events),
  notes: note ? [...t.notes, note] : t.notes,
});

interface Trial {
  timeline: Timeline;
  changed: boolean;
  detail: string;
  deadline?: string;
}

function dispatchEarly(t: Timeline): Trial {
  const target = addDays(t.assumptions.benchArrival, -1);
  if (target <= t.startDate) {
    return { timeline: t, changed: false, detail: "No earlier date is available before the benches arrive." };
  }
  let cur = t;
  const moved: string[] = [];
  for (const e of t.events.filter((x) => x.kind === "dispatch" && x.sku !== BENCH_SKU && x.date > target)) {
    const trial = withEvents(
      cur,
      cur.events.map((x) => (x.id === e.id ? { ...x, date: target } : x)),
    );
    if (shortOf(trial) < shortOf(cur)) {
      cur = withEvents(trial, trial.events, `${e.id} (${e.quantity} × ${e.sku}) dispatched on ${target} instead of ${e.date}.`);
      moved.push(`${e.id} (${e.quantity} × ${e.sku}) from ${e.date} to ${target}`);
    }
  }
  return moved.length
    ? { timeline: cur, changed: true, detail: `Send ${moved.join("; ")}, so the stock is out of its bins before the benches land.`, deadline: target }
    : { timeline: t, changed: false, detail: "Sending another order early does not free a bin in the class that is short." };
}

/** Split the bench receipt (and the bench orders' dispatches) into `k` batches that leave as they arrive. */
function splitReceipt(t: Timeline, k: number): Trial {
  const receipts = t.events.filter((e) => e.id === BENCH_REF);
  const dispatches = t.events.filter((e) => e.kind === "dispatch" && e.sku === BENCH_SKU);
  if (receipts.length !== 1 || dispatches.length === 0) {
    return { timeline: t, changed: false, detail: "There is no bench receipt to split." };
  }
  const r = receipts[0];
  const share = (total: number, i: number) => Math.floor(total / k) + (i < total % k ? 1 : 0);
  const rest = t.events.filter((e) => e !== r && !dispatches.includes(e));
  const events: TimelineEvent[] = [...rest];
  for (let i = 0; i < k; i++) {
    events.push({ ...r, id: r.id, seq: 2 * i, quantity: share(r.quantity, i), label: `${share(r.quantity, i)} benches arrive (batch ${i + 1} of ${k}, date assumed)` });
    for (const d of dispatches) {
      events.push({
        ...d,
        id: d.id,
        date: r.date,
        seq: 2 * i + 1,
        quantity: share(d.quantity, i),
        label: `${d.id} part ${i + 1} of ${k} leaves: ${share(d.quantity, i)} × ${d.sku}`,
      });
    }
  }
  const largest = share(r.quantity, 0);
  return {
    timeline: withEvents(t, events, `Benches arrive in ${k} batches of up to ${largest}, each leaving the day it arrives (${r.date}).`),
    changed: true,
    detail: `Ask production for ${k} batches of up to ${largest} benches, and ship each batch to the customer as it arrives (part-shipments), so no more than ${largest} extra benches sit in the stores at once.`,
    deadline: r.date,
  };
}

function crossDock(t: Timeline): Trial {
  const r = t.events.find((e) => e.id === BENCH_REF);
  if (!r) return { timeline: t, changed: false, detail: "There is no bench receipt to cross-dock." };
  let left = r.quantity;
  const events: TimelineEvent[] = [];
  for (const e of t.events) {
    if (e === r) continue;
    if (e.kind === "dispatch" && e.sku === BENCH_SKU && left > 0) {
      const take = Math.min(e.quantity, left);
      left -= take;
      if (e.quantity - take > 0) events.push({ ...e, quantity: e.quantity - take });
      continue;
    }
    events.push(e);
  }
  return {
    timeline: withEvents(t, events, `${r.quantity} benches go from the line straight to the dispatch dock and never enter a bin.`),
    changed: true,
    detail: `Take the ${r.quantity} benches from the line straight to the dispatch dock for the customer (no bin used). They must leave the day they arrive.`,
    deadline: r.date,
  };
}

/** Plan the levers for a timeline and verify the combined result. */
export function planLevers(t: Timeline): RoomPlan {
  const before = analyse(t);
  const freed = solve(t.data).freedBins;
  const steps: LeverStep[] = [
    {
      kind: "existing-merges",
      title: "Do the merges already in the plan",
      detail: `Already counted: the plan's merges free ${freed.length} bins (${freed.join(", ")}) before the December orders are added.`,
      owner: "Stores team",
      needsDecision: false,
      applied: true,
      shortBefore: before.peak.short,
      shortAfter: before.peak.short,
      binsFreed: 0,
    },
  ];

  let cur = t;
  const step = (kind: LeverKind, title: string, owner: string, trial: Trial, from: Timeline, applied: boolean, alternative = false): LeverStep => {
    const shortBefore = shortOf(from);
    const shortAfter = trial.changed ? shortOf(trial.timeline) : shortBefore;
    return {
      kind,
      title,
      detail: trial.detail,
      owner,
      deadline: trial.deadline,
      needsDecision: false,
      applied: applied && trial.changed,
      alternative,
      shortBefore,
      shortAfter,
      binsFreed: shortBefore - shortAfter,
    };
  };

  if (before.peak.short > 0) {
    const early = dispatchEarly(cur);
    steps.push(step("dispatch-early", "Dispatch an order early", "Customer, via sales, must agree an earlier delivery", early, cur, true));
    if (early.changed) cur = early.timeline;

    if (shortOf(cur) > 0) {
      const qty = cur.events.find((e) => e.id === BENCH_REF)?.quantity ?? 0;
      let best: Trial | null = null;
      for (let k = 2; k <= Math.min(qty, 8); k++) {
        const trial = splitReceipt(cur, k);
        if (!trial.changed) break;
        if (!best || shortOf(trial.timeline) < shortOf(best.timeline)) best = trial;
        if (shortOf(trial.timeline) === 0) break;
      }
      const dock = crossDock(cur);
      const splitFits = best && shortOf(best.timeline) === 0;
      const dockFits = dock.changed && shortOf(dock.timeline) === 0;
      const splitOwner = "Production (batch sizes) and the customer (part-shipments)";
      const dockOwner = "Production and dispatch (line to dock)";
      if (best && (splitFits || !dockFits)) {
        steps.push(step("split-receipt", "Split the bench delivery into batches", splitOwner, best, cur, true));
        steps.push(step("cross-dock", "Or cross-dock the benches", dockOwner, dock, cur, false, true));
        cur = best.timeline;
      } else if (dock.changed) {
        if (best) steps.push(step("split-receipt", "Split the bench delivery into batches", splitOwner, best, cur, false));
        steps.push(step("cross-dock", "Cross-dock the benches", dockOwner, dock, cur, true));
        cur = dock.timeline;
      }
    }

    const left = shortOf(cur);
    if (left > 0) {
      steps.push({
        kind: "rule-change",
        title: "A decision for the stores manager",
        detail: `Still ${left} bin${left === 1 ? "" : "s"} short. Options that change a rule or layout, not applied here: a temporary staging area for benches, or allowing Large goods in a Bulk bin that has been emptied first (no Bulk bin is free today: BULK-01 to BULK-03 hold stock and BULK-04 has unknown capacity).`,
        owner: "Stores manager",
        needsDecision: true,
        applied: false,
        shortBefore: left,
        shortAfter: left,
        binsFreed: 0,
      });
    }
  }

  const after = analyse(cur);
  const placementProblems: string[] = [];
  if (after.peak.short === 0) {
    after.snapshots.forEach((s, i) => {
      const p = placeAt(cur, i);
      for (const v of p.violations) placementProblems.push(`${s.date}: ${v.message}`);
      for (const u of p.plan.unplaced) placementProblems.push(`${s.date}: ${u.quantity} × ${u.sku} could not be placed (${u.reason})`);
    });
  }
  return {
    steps,
    final: cur,
    before,
    after,
    shortAfter: after.peak.short,
    fits: after.peak.short === 0 && placementProblems.length === 0,
    placementProblems,
  };
}
