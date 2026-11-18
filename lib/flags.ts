import type { Flag, StoreData } from "./model";
import { stockByBin, unitsInBin } from "./store";

/** Counts more than this many days older than the newest count are flagged as stale. */
export const STALE_DAYS = 5;

function daysBetween(older: string, newer: string): number {
  return Math.round((Date.parse(newer) - Date.parse(older)) / 86_400_000);
}

/**
 * Find data problems and state how the plan handles each one.
 *
 * Policy (careful): the stock count is truth and is never altered. Bins that are
 * over capacity or have unknown capacity are "locked": they keep their counted
 * stock but never receive anything. A mixed bin has its minority product moved
 * out first. Stale counts are only flagged.
 */
export function computeFlags(data: StoreData, staleDays = STALE_DAYS): Flag[] {
  const byBin = stockByBin(data.stock);
  const productName = new Map(data.products.map((p) => [p.sku, p.name]));
  const flags: Flag[] = [];

  const newest = data.stock.reduce((max, r) => (r.lastCounted > max ? r.lastCounted : max), "");

  for (const bin of data.bins) {
    const rows = byBin.get(bin.code) ?? [];
    const units = unitsInBin(rows);

    if (rows.length > 1) {
      const parts = rows.map((r) => `${r.quantity} × ${r.sku}`).join(" and ");
      const minority = [...rows].sort((a, b) => a.quantity - b.quantity)[0];
      flags.push({
        id: `mixed-bin:${bin.code}`,
        kind: "mixed-bin",
        bin: bin.code,
        detail: `${bin.code} holds two products (${parts}); the rules allow one product per bin.`,
        decision: `Move the ${minority.quantity} ${productName.get(minority.sku) ?? minority.sku} (${minority.sku}) out first, into a bin that already holds only that product and has room.`,
      });
    }

    if (bin.capacity === null) {
      flags.push({
        id: `unknown-capacity:${bin.code}`,
        kind: "unknown-capacity",
        bin: bin.code,
        detail: `${bin.code} has no capacity value; it holds ${units} units.`,
        decision:
          "Locked: its counted stock is kept and counted as used, but no delivery or merge is planned into it, and it is left out of the capacity percentages until someone confirms its capacity.",
      });
    } else if (units > bin.capacity) {
      flags.push({
        id: `over-capacity:${bin.code}`,
        kind: "over-capacity",
        bin: bin.code,
        detail: `${bin.code} holds ${units} units but its capacity is ${bin.capacity} (${units - bin.capacity} over).`,
        decision:
          "Locked: the count is treated as truth and is not changed. Nothing is added to this bin. Someone should recount it or check its capacity.",
      });
    }

    if (rows.length > 0 && newest) {
      const oldest = rows.reduce((min, r) => (r.lastCounted < min ? r.lastCounted : min), rows[0].lastCounted);
      const age = daysBetween(oldest, newest);
      if (age > staleDays) {
        flags.push({
          id: `stale-count:${bin.code}`,
          kind: "stale-count",
          bin: bin.code,
          detail: `${bin.code} was last counted on ${oldest}, ${age} days before the newest count (${newest}).`,
          decision: "Flagged only. The count is still used as truth; recount before relying on this bin.",
        });
      }
    }
  }

  return flags;
}

/**
 * Bins that must never receive stock: over capacity, or capacity unknown.
 * They may still be emptied.
 */
export function lockedBins(data: StoreData): Set<string> {
  const locked = new Set<string>();
  for (const f of computeFlags(data)) {
    if (f.kind === "over-capacity" || f.kind === "unknown-capacity") locked.add(f.bin);
  }
  return locked;
}
