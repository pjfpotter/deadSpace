import { stockAfter } from "./apply";
import { computeFlags } from "./flags";
import type { Plan, StockRow, StoreData } from "./model";
import { stockByBin, unitsInBin } from "./store";
import { stepLabel, validatePlan } from "./validate";

// "Can we fit it?" check. Pure arithmetic on a stock state: no solver, no network.

export interface Allocation {
  bin: string;
  units: number;
  /** "top-up" fills spare room in a bin already holding the product; "empty" uses an empty bin. */
  how: "top-up" | "empty";
  /** The merge that emptied this bin, when it is free only because of the plan. */
  madeRoomBy?: string;
}

export interface Excluded {
  bin: string;
  reason: string;
}

export interface FitResult {
  fits: boolean;
  allocations: Allocation[];
  /** Units that could not be placed. */
  short: number;
  /** Right-size bins that were left out because they are flagged. */
  excluded: Excluded[];
}

export type FitCheck =
  | { error: string }
  | {
      sku: string;
      quantity: number;
      now: FitResult;
      /** Null when the plan breaks a store rule, so its state cannot be trusted. */
      afterMerges: FitResult | null;
      afterMergesNote?: string;
    };

/** Validate raw form input. Returns the whole number, or an error message. */
export function parseQuantity(raw: string | number): { quantity: number } | { error: string } {
  const text = String(raw).trim();
  if (text === "") return { error: "Enter a quantity." };
  const n = Number(text);
  if (!Number.isFinite(n)) return { error: "Quantity must be a number." };
  if (!Number.isInteger(n)) return { error: "Quantity must be a whole number." };
  if (n <= 0) return { error: "Quantity must be greater than zero." };
  return { quantity: n };
}

/** Room for `quantity` units of `sku` in one stock state. */
export function fitInState(data: StoreData, stock: StockRow[], sku: string, quantity: number): FitResult {
  const product = data.products.find((p) => p.sku === sku);
  if (!product) return { fits: false, allocations: [], short: quantity, excluded: [] };

  const byBin = stockByBin(stock);
  const flags = computeFlags(data);
  const blocked = new Map<string, string>();
  const why: Partial<Record<string, string>> = {
    "over-capacity": "over capacity",
    "unknown-capacity": "capacity unknown",
    "mixed-bin": "holds two products",
  };
  for (const f of flags) {
    const reason = why[f.kind];
    if (!reason) continue; // stale counts are flagged only, the bin is still usable
    const prev = blocked.get(f.bin);
    blocked.set(f.bin, prev ? `${prev}, ${reason}` : reason);
  }

  const topUps: Allocation[] = [];
  const empties: Allocation[] = [];
  const excluded: Excluded[] = [];

  for (const bin of [...data.bins].sort((a, b) => a.code.localeCompare(b.code))) {
    if (bin.size !== product.size) continue;
    const rows = byBin.get(bin.code) ?? [];
    const holdsOther = rows.length > 0 && !rows.some((r) => r.sku === sku);
    if (holdsOther) continue; // one product per bin

    const reason = blocked.get(bin.code);
    if (reason) {
      excluded.push({ bin: bin.code, reason });
      continue;
    }
    const capacity = bin.capacity as number; // unknown capacity is blocked above
    if (rows.length === 0) {
      empties.push({ bin: bin.code, units: capacity, how: "empty" });
    } else {
      const spare = Math.max(0, capacity - unitsInBin(rows));
      if (spare > 0) topUps.push({ bin: bin.code, units: spare, how: "top-up" });
    }
  }

  const allocations: Allocation[] = [];
  let left = quantity;
  for (const room of [...topUps, ...empties]) {
    if (left <= 0) break;
    const units = Math.min(room.units, left);
    allocations.push({ ...room, units });
    left -= units;
  }
  return { fits: left === 0, allocations, short: left, excluded };
}

/** Answer "does `quantity` of `sku` fit?" now and after the plan's merges and deliveries. */
export function checkFit(data: StoreData, plan: Plan, sku: string, quantity: number | string): FitCheck {
  if (!data.products.some((p) => p.sku === sku)) {
    return { error: sku ? `Unknown product "${sku}".` : "Choose a product." };
  }
  const q = parseQuantity(quantity);
  if ("error" in q) return q;

  const now = fitInState(data, data.stock, sku, q.quantity);

  if (validatePlan(data, plan).length > 0) {
    return {
      sku,
      quantity: q.quantity,
      now,
      afterMerges: null,
      afterMergesNote: "The plan breaks a store rule, so the after-merges answer is withheld.",
    };
  }

  const afterMerges = fitInState(data, stockAfter(data, plan.steps), sku, q.quantity);
  const freedBy = new Map<string, string>();
  for (const step of plan.steps) {
    if (step.type === "move" && step.frees) freedBy.set(step.frees, stepLabel(step));
  }
  for (const a of afterMerges.allocations) {
    const move = freedBy.get(a.bin);
    // Only credit the merge for bins that were not already free in the current count.
    const hadStock = data.stock.some((r) => r.bin === a.bin);
    if (a.how === "empty" && move && hadStock) a.madeRoomBy = move;
  }
  return { sku, quantity: q.quantity, now, afterMerges };
}
