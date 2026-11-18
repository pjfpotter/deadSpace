import { stockAfter } from "./apply";
import { lockedBins } from "./flags";
import { SIZE_CLASSES } from "./model";
import type { IncomingLine, Order, Plan, SizeClass, StockRow, StoreData } from "./model";
import { isIsoDate } from "./orders";
import { solve } from "./solve";
import { validatePlan } from "./validate";
import type { Violation } from "./validate";

/**
 * Dated view of the stores for the December orders.
 *
 * Day zero is the stock after the existing plan (merges and all six Incoming lines
 * done). From there: the extra benches arrive on an assumed date, and each customer
 * order leaves the stores on (delivery date - lead days). "Bins needed" is plain
 * arithmetic: ceil(units / bin capacity) per product (one product per bin) summed per
 * size class. Any placement shown as fitting is also built by the real solver and
 * checked by the validator (see `placeAt`).
 */

/** The product the brief says is still "coming off the line". */
export const BENCH_SKU = "FG-BEN-2S";
export const BENCH_REF = "EXTRA-2S";

export interface Assumptions {
  /** Date the extra benches arrive in the stores (assumed: the brief gives no date). */
  benchArrival: string;
  /** Days before the delivery date that an order leaves the stores. */
  leadDays: number;
}

export type EventKind = "receipt" | "dispatch";

export interface TimelineEvent {
  id: string;
  date: string;
  /** Order within one date: lower first. Receipts default to 0, dispatches to 1. */
  seq: number;
  kind: EventKind;
  sku: string;
  quantity: number;
  label: string;
  assumed?: boolean;
}

export interface Timeline {
  data: StoreData;
  assumptions: Assumptions;
  /** Stock by bin after the existing plan. */
  start: StockRow[];
  /** Date day zero is reached: the last Incoming line. */
  startDate: string;
  events: TimelineEvent[];
  /** Plain-English notes on what the levers changed (for display). */
  notes: string[];
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function lastKnownDate(data: StoreData): string {
  return data.incoming.reduce((max, l) => (l.expectedDate > max ? l.expectedDate : max), "");
}

const benchOrders = (orders: Order[]) => orders.filter((o) => o.sku === BENCH_SKU);

/** Default: the worst case that still meets the first bench order (arrive the day before delivery). */
export function defaultAssumptions(orders: Order[]): Assumptions {
  const first = benchOrders(orders)
    .map((o) => o.deliveryDate)
    .sort()[0];
  return { benchArrival: first ? addDays(first, -1) : "", leadDays: 1 };
}

/** An error message for unusable assumptions, or null when they are fine. */
export function checkAssumptions(data: StoreData, orders: Order[], a: Assumptions): string | null {
  if (!isIsoDate(a.benchArrival)) return "Enter the bench arrival date as a real date.";
  if (!Number.isInteger(a.leadDays) || a.leadDays < 0 || a.leadDays > 7) {
    return "Dispatch lead time must be a whole number of days from 0 to 7.";
  }
  const last = lastKnownDate(data);
  if (a.benchArrival <= last) {
    return `The benches follow the production runs already listed (the last is ${last}), so they cannot arrive on or before that date.`;
  }
  for (const o of benchOrders(orders)) {
    const leaves = addDays(o.deliveryDate, -a.leadDays);
    if (a.benchArrival > leaves) {
      return `${o.orderRef} leaves on ${leaves}, so the benches must arrive by then.`;
    }
  }
  return null;
}

const sortEvents = (events: TimelineEvent[]) =>
  [...events].sort((a, b) => a.date.localeCompare(b.date) || a.seq - b.seq || a.id.localeCompare(b.id));

/** Build the dated timeline. Throws if the assumptions are invalid (call `checkAssumptions` first). */
export function buildTimeline(data: StoreData, orders: Order[], assumptions: Assumptions): Timeline {
  const problem = checkAssumptions(data, orders, assumptions);
  if (problem) throw new Error(problem);

  const plan = solve(data);
  const events: TimelineEvent[] = [];
  const benchQty = benchOrders(orders).reduce((s, o) => s + o.quantity, 0);
  if (benchQty > 0) {
    events.push({
      id: BENCH_REF,
      date: assumptions.benchArrival,
      seq: 0,
      kind: "receipt",
      sku: BENCH_SKU,
      quantity: benchQty,
      label: `${benchQty} extra benches arrive from the line (date assumed)`,
      assumed: true,
    });
  }
  for (const o of orders) {
    events.push({
      id: o.orderRef,
      date: addDays(o.deliveryDate, -assumptions.leadDays),
      seq: 1,
      kind: "dispatch",
      sku: o.sku,
      quantity: o.quantity,
      label: `${o.orderRef} leaves for ${o.customerLabel}: ${o.quantity} × ${o.sku}`,
    });
  }
  return {
    data,
    assumptions,
    start: stockAfter(data, plan.steps),
    startDate: lastKnownDate(data),
    events: sortEvents(events),
    notes: [],
  };
}

export { sortEvents };

export interface Snapshot {
  /** 0 = day zero; n = after the nth event. */
  index: number;
  date: string;
  label: string;
  units: Record<string, number>;
  /** Set when a dispatch asked for more than was in the stores. */
  shortfall?: { orderRef: string; sku: string; short: number };
}

export function snapshots(t: Timeline): Snapshot[] {
  const units: Record<string, number> = {};
  for (const r of t.start) units[r.sku] = (units[r.sku] ?? 0) + r.quantity;
  const out: Snapshot[] = [
    { index: 0, date: t.startDate, label: "After the existing plan (merges and deliveries done)", units: { ...units } },
  ];
  t.events.forEach((e, i) => {
    let shortfall: Snapshot["shortfall"];
    if (e.kind === "receipt") {
      units[e.sku] = (units[e.sku] ?? 0) + e.quantity;
    } else {
      const have = units[e.sku] ?? 0;
      const take = Math.min(have, e.quantity);
      if (take < e.quantity) shortfall = { orderRef: e.id, sku: e.sku, short: e.quantity - take };
      units[e.sku] = have - take;
    }
    out.push({ index: i + 1, date: e.date, label: e.label, units: { ...units }, shortfall });
  });
  return out;
}

export const binsNeeded = (units: number, capacity: number): number =>
  units <= 0 ? 0 : Math.ceil(units / capacity);

export interface ProductNeed {
  sku: string;
  name: string;
  /** Units in the stores. */
  units: number;
  /** Units sitting in locked bins that stay where they are (not planned into); left out of the sum. */
  lockedUnits: number;
  capacity: number;
  /** ceil((units - lockedUnits) / capacity) */
  bins: number;
}

export interface ClassNeed {
  size: SizeClass;
  /** Bin capacity used for the sum (smallest among the usable bins). */
  capacity: number | null;
  rows: ProductNeed[];
  needed: number;
  /** Bins that can take stock: of this size class, known capacity, not over capacity. */
  available: number;
  short: number;
  fits: boolean;
}

/** Bins needed against bins available, per size class, for stock of `units` per SKU. */
export function classNeeds(t: Timeline, units: Record<string, number>): ClassNeed[] {
  const { data } = t;
  const locked = lockedBins(data);
  const lockedUnits = new Map<string, number>();
  for (const r of t.start) {
    if (locked.has(r.bin)) lockedUnits.set(r.sku, (lockedUnits.get(r.sku) ?? 0) + r.quantity);
  }
  return SIZE_CLASSES.map((size) => {
    const usable = data.bins.filter((b) => b.size === size && b.capacity !== null && !locked.has(b.code));
    const capacity = usable.length ? Math.min(...usable.map((b) => b.capacity as number)) : null;
    const rows: ProductNeed[] = [];
    for (const p of data.products.filter((x) => x.size === size)) {
      const total = units[p.sku] ?? 0;
      if (total <= 0) continue;
      const stuck = Math.min(total, lockedUnits.get(p.sku) ?? 0);
      rows.push({
        sku: p.sku,
        name: p.name,
        units: total,
        lockedUnits: stuck,
        capacity: capacity ?? 1,
        bins: binsNeeded(total - stuck, capacity ?? 1),
      });
    }
    const needed = rows.reduce((s, r) => s + r.bins, 0);
    const short = Math.max(0, needed - usable.length);
    return { size, capacity, rows, needed, available: usable.length, short, fits: short === 0 };
  });
}

export interface Analysis {
  snapshots: Snapshot[];
  needs: ClassNeed[][];
  peak: {
    index: number;
    /** Total bins short across classes at the peak (0 = it fits throughout). */
    short: number;
    /** The class most short at the peak, or null when it fits. */
    size: SizeClass | null;
  };
  /** Dates on which each size class needs more bins than it has. */
  overDates: Record<SizeClass, string[]>;
}

export function analyse(t: Timeline): Analysis {
  const snaps = snapshots(t);
  const needs = snaps.map((s) => classNeeds(t, s.units));
  let peak: Analysis["peak"] = { index: 0, short: 0, size: null };
  needs.forEach((classes, index) => {
    const short = classes.reduce((s, c) => s + c.short, 0);
    if (short > peak.short) {
      const worst = [...classes].sort((a, b) => b.short - a.short)[0];
      peak = { index, short, size: worst.size };
    }
  });
  const overDates = { Small: [], Medium: [], Large: [], Bulk: [] } as Record<SizeClass, string[]>;
  needs.forEach((classes, i) => {
    for (const c of classes) {
      if (c.short > 0 && !overDates[c.size].includes(snaps[i].date)) overDates[c.size].push(snaps[i].date);
    }
  });
  return { snapshots: snaps, needs, peak, overDates };
}

/**
 * Stock by bin at snapshot `index`, as store data the solver and validator understand.
 * Bench-style receipts that have arrived but not left are the data's Incoming lines.
 * A dispatch draws first from receipts not yet put away (they go straight out), then
 * from the least-full bins of that product, which is what frees bins soonest.
 */
export function stateAt(t: Timeline, index: number): StoreData {
  const rows = new Map<string, StockRow>();
  for (const r of t.start) rows.set(`${r.bin}\u0000${r.sku}`, { ...r });
  const pending: IncomingLine[] = [];

  for (const e of t.events.slice(0, index)) {
    if (e.kind === "receipt") {
      pending.push({
        reference: e.id,
        expectedDate: e.date,
        source: "Production run",
        supplier: "In-house production",
        sku: e.sku,
        quantity: e.quantity,
      });
      continue;
    }
    let left = e.quantity;
    for (const line of pending.filter((l) => l.sku === e.sku)) {
      const take = Math.min(line.quantity, left);
      line.quantity -= take;
      left -= take;
    }
    const holders = [...rows.values()]
      .filter((r) => r.sku === e.sku)
      .sort((a, b) => a.quantity - b.quantity || a.bin.localeCompare(b.bin));
    for (const r of holders) {
      if (left <= 0) break;
      const take = Math.min(r.quantity, left);
      r.quantity -= take;
      left -= take;
      if (r.quantity === 0) rows.delete(`${r.bin}\u0000${r.sku}`);
    }
  }

  return {
    ...t.data,
    stock: [...rows.values()],
    incoming: pending.filter((l) => l.quantity > 0),
  };
}

export interface Placement {
  data: StoreData;
  plan: Plan;
  violations: Violation[];
  /** Every arrived line is placed in full and the validator found nothing wrong. */
  fits: boolean;
}

/** Place the stock at snapshot `index` with the real solver and check it with the validator. */
export function placeAt(t: Timeline, index: number): Placement {
  const data = stateAt(t, index);
  const plan = solve(data);
  const violations = validatePlan(data, plan);
  return { data, plan, violations, fits: plan.unplaced.length === 0 && violations.length === 0 };
}
