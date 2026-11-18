import type { StoreData } from "./model";
import { lastKnownDate, type Assumptions } from "./timeline";

/** One thing the December answer relies on, and what changes if it is wrong. */
export interface RegisterEntry {
  id: string;
  assumption: string;
  source: "Brief" | "Data" | "Our guess";
  /** What happens to the bin count if this is wrong. */
  effect: string;
  /** Who can confirm it. */
  owner: string;
}

export interface OpenQuestion {
  id: string;
  question: string;
  /** Which part of the answer an answer would change. */
  changes: string;
  owner: string;
}

const staleBins = (data: StoreData) =>
  [...new Set(data.stock.filter((r) => r.lastCounted <= "2026-11-07").map((r) => r.bin))].sort();

export function assumptionRegister(data: StoreData, a: Assumptions): RegisterEntry[] {
  const last = lastKnownDate(data);
  const stale = staleBins(data);
  return [
    {
      id: "bench-arrival",
      assumption: `The 40 extra 2-seat benches arrive on ${a.benchArrival || "an unknown date"}, the day before CO-8801 is delivered by default.`,
      source: "Our guess",
      effect: `The brief only says "in the weeks after" the production runs on the Incoming list (the last is ${last}). Earlier arrival means the benches take bins for longer; the peak height stays the same.`,
      owner: "Production planner",
    },
    {
      id: "lead-days",
      assumption: `Each order leaves the stores ${a.leadDays} day${a.leadDays === 1 ? "" : "s"} before its delivery date.`,
      source: "Our guess",
      effect: "A longer lead time makes orders leave earlier and shortens the time Large is over capacity; a zero lead time delivers from the stores on the day.",
      owner: "Dispatch",
    },
    {
      id: "orders-from-stock",
      assumption: "The three orders are customers taking stock out. The folding chairs and the 3-seat benches are met from stock on hand (including WO-1033); only the 2-seat benches come off the line.",
      source: "Our guess",
      effect: "If the chairs or 3-seat benches also need new production, they arrive as receipts and Large needs more bins, not fewer.",
      owner: "Organiser / sales",
    },
    {
      id: "no-other-outbound",
      assumption: "No other stock leaves or arrives between now and 11 December. Movement history is not used.",
      source: "Data",
      effect: "The movement history does not reconcile to the stock count, so we do not forecast from it. Other orders would free bins (good) or other deliveries would take them (bad).",
      owner: "Stores manager",
    },
    {
      id: "large-only-large",
      assumption: "Large goods only go in Large bins. A bench is never put in a small-goods bin.",
      source: "Brief",
      effect: "This is the store rule the brief asks us to respect. Relaxing it is a decision for the stores manager (see the open questions).",
      owner: "Stores manager",
    },
    {
      id: "one-product-per-bin",
      assumption: "One product per bin, so a few units of a product still use a whole bin.",
      source: "Data",
      effect: "This is why the bins run out before the units do: the folding chairs need a bin even at 4 units.",
      owner: "Stores manager",
    },
    {
      id: "capacity-units",
      assumption: "Bin capacity is a number of units (Large: 30), not a volume. A bench is one unit.",
      source: "Data",
      effect: "If a bench takes more room than a planter or a table, a 30-unit bin may really hold fewer benches and more bins are needed.",
      owner: "Stores manager",
    },
    {
      id: "stale-counts",
      assumption: `The counts are right, including ${stale.join(" and ")}, which were last counted on 7 November.`,
      source: "Data",
      effect: "The 29 two-seat benches and 12 tables rest on these counts. Recount before the benches land: a different 2S total can change its bin count.",
      owner: "Stores team",
    },
    {
      id: "plan-first",
      assumption: "The existing plan's merges and putaways are carried out before the benches arrive.",
      source: "Our guess",
      effect: "Without the merges, Large has one more bin in use and the shortfall is larger.",
      owner: "Stores team",
    },
  ];
}

export function openQuestions(): OpenQuestion[] {
  return [
    {
      id: "bench-date",
      question: "When exactly do the 40 benches come off the line, and can they come in batches?",
      changes: "Whether the split or cross-dock lever is possible, and how long Large is over capacity.",
      owner: "Production planner",
    },
    {
      id: "bench-promised",
      question: "Is the existing 2-seat bench stock (29) already promised to other customers?",
      changes: "If it is, those 29 leave too and 2S needs fewer bins; if CO-8801 can be filled from it, fewer benches need to be stored.",
      owner: "Sales",
    },
    {
      id: "bulk-for-large",
      question: "May Large goods go in a Bulk bin, if one is emptied first?",
      changes: "The decision lever: it could take the remaining shortfall without splitting the delivery. It breaks the size-class rule, so it is never applied here.",
      owner: "Stores manager",
    },
    {
      id: "orders-source",
      question: "Do the chairs and 3-seat benches come from stock, or from new production?",
      changes: "The whole reading of the brief: receipts instead of dispatches would increase the bins needed.",
      owner: "Organiser",
    },
  ];
}
