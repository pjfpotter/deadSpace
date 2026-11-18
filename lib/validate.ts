import { lockedBins } from "./flags";
import type { Plan, Step, StoreData } from "./model";

/**
 * Independent rules checker. It knows nothing about how a plan was made: it takes
 * the starting data and a plan's ordered `steps` and checks them against the
 * store rules, so it can check solver output, AI output or a hand-written plan.
 *
 * Rules checked:
 *  - valid bins, products and quantities
 *  - no move takes more than a bin holds when it happens
 *  - one product per bin at every step (a step may not land in a bin still holding another product)
 *  - size class matches, in the final state
 *  - capacity is not exceeded (a bin that was already over capacity may not get worse)
 *  - no stock is added to a locked bin (over capacity, or capacity unknown)
 *  - no bin is both a source and a destination for the same product (no stock moved twice)
 *  - every incoming line is placed in full or reported as unplaced
 *  - the plan's `moves` and `putaways` agree with its `steps`
 */

export type Rule =
  | "unknown-bin"
  | "unknown-product"
  | "bad-quantity"
  | "insufficient-stock"
  | "one-product-per-bin"
  | "capacity"
  | "size-class"
  | "locked-bin-receipt"
  | "chained-move"
  | "incoming-accounting"
  | "plan-consistency";

export interface Violation {
  rule: Rule;
  message: string;
  bin?: string;
  sku?: string;
}

const key = (bin: string, sku: string) => `${bin}\u0000${sku}`;

export function stepLabel(s: Step): string {
  return s.type === "move"
    ? `move ${s.quantity} × ${s.sku} from ${s.from} to ${s.to}`
    : `put away ${s.quantity} × ${s.sku} (${s.reference}) into ${s.to}`;
}

/** Stock per bin and product after applying steps in order. Throws nothing; bad steps are skipped. */
export function applySteps(data: StoreData, steps: Step[]): Map<string, number> {
  const state = new Map<string, number>();
  for (const r of data.stock) state.set(key(r.bin, r.sku), (state.get(key(r.bin, r.sku)) ?? 0) + r.quantity);
  for (const s of steps) {
    if (!Number.isInteger(s.quantity) || s.quantity <= 0) continue;
    if (s.type === "move") {
      const have = state.get(key(s.from, s.sku)) ?? 0;
      if (have < s.quantity) continue;
      state.set(key(s.from, s.sku), have - s.quantity);
    }
    state.set(key(s.to, s.sku), (state.get(key(s.to, s.sku)) ?? 0) + s.quantity);
  }
  return state;
}

export function validatePlan(data: StoreData, plan: Plan): Violation[] {
  const v: Violation[] = [];
  const bins = new Map(data.bins.map((b) => [b.code, b]));
  const products = new Map(data.products.map((p) => [p.sku, p]));
  const locked = lockedBins(data);
  const steps = plan.steps;

  // --- plan consistency: moves/putaways listed must be exactly the steps ---
  const stepIds = new Set(steps.map((s) => s.id));
  const listedIds = new Set([...plan.moves.map((m) => m.id), ...plan.putaways.map((p) => p.id)]);
  if (stepIds.size !== steps.length) {
    v.push({ rule: "plan-consistency", message: "Two steps share the same id." });
  }
  for (const id of listedIds) {
    if (!stepIds.has(id)) v.push({ rule: "plan-consistency", message: `${id} is listed but is not in the ordered steps.` });
  }
  for (const id of stepIds) {
    if (!listedIds.has(id)) v.push({ rule: "plan-consistency", message: `${id} is in the ordered steps but is not listed as a move or putaway.` });
  }

  // --- step-by-step checks, in order ---
  const state = new Map<string, number>();
  for (const r of data.stock) state.set(key(r.bin, r.sku), (state.get(key(r.bin, r.sku)) ?? 0) + r.quantity);
  const initialBinUnits = new Map<string, number>();
  for (const r of data.stock) initialBinUnits.set(r.bin, (initialBinUnits.get(r.bin) ?? 0) + r.quantity);

  const initiallyMixed = new Set<string>();
  {
    const first = new Map<string, string>();
    for (const r of data.stock) {
      const f = first.get(r.bin);
      if (f === undefined) first.set(r.bin, r.sku);
      else if (f !== r.sku) initiallyMixed.add(r.bin);
    }
  }

  for (const s of steps) {
    const label = stepLabel(s);
    let ok = true;

    if (!Number.isInteger(s.quantity) || s.quantity <= 0) {
      v.push({ rule: "bad-quantity", message: `Cannot ${label}: quantity must be a whole number above zero.`, sku: s.sku });
      ok = false;
    }
    if (!products.has(s.sku)) {
      v.push({ rule: "unknown-product", message: `Cannot ${label}: ${s.sku} is not a known product.`, sku: s.sku });
      ok = false;
    }
    if (!bins.has(s.to)) {
      v.push({ rule: "unknown-bin", message: `Cannot ${label}: ${s.to} is not a known bin.`, bin: s.to });
      ok = false;
    }
    if (s.type === "move" && !bins.has(s.from)) {
      v.push({ rule: "unknown-bin", message: `Cannot ${label}: ${s.from} is not a known bin.`, bin: s.from });
      ok = false;
    }
    if (locked.has(s.to)) {
      v.push({
        rule: "locked-bin-receipt",
        message: `Cannot ${label}: ${s.to} is locked (over capacity or capacity unknown) and must not receive stock.`,
        bin: s.to,
        sku: s.sku,
      });
    }
    if (!ok) continue;

    if (s.type === "move") {
      const have = state.get(key(s.from, s.sku)) ?? 0;
      if (have < s.quantity) {
        v.push({
          rule: "insufficient-stock",
          message: `Cannot ${label}: ${s.from} only holds ${have} of ${s.sku} at that point.`,
          bin: s.from,
          sku: s.sku,
        });
        continue;
      }
      state.set(key(s.from, s.sku), have - s.quantity);
    }
    state.set(key(s.to, s.sku), (state.get(key(s.to, s.sku)) ?? 0) + s.quantity);

    // The bin must be legal at this moment, not just at the end: a step that puts one
    // product into a bin still holding another cannot be done on the floor, even if a
    // later step clears the bin. (A bin that was already mixed at the count is left to
    // the final-state check below.)
    if (!initiallyMixed.has(s.to)) {
      const others = [...state].filter(([k, q]) => q > 0 && k.startsWith(`${s.to}\u0000`) && k !== key(s.to, s.sku));
      if (others.length > 0) {
        v.push({
          rule: "one-product-per-bin",
          message: `Cannot ${label}: ${s.to} still holds ${others.map(([k, q]) => `${q} × ${k.split("\u0000")[1]}`).join(" and ")} at that point. Empty it first.`,
          bin: s.to,
          sku: s.sku,
        });
      }
    }
  }

  // --- no stock moved twice: a bin must not be both a source and a destination for one product ---
  const sources = new Map<string, Step>();
  const destinations = new Map<string, Step>();
  for (const s of steps) {
    if (s.type === "move" && !sources.has(key(s.from, s.sku))) sources.set(key(s.from, s.sku), s);
    if (!destinations.has(key(s.to, s.sku))) destinations.set(key(s.to, s.sku), s);
  }
  for (const [k, out] of sources) {
    const into = destinations.get(k);
    if (into) {
      const [bin, sku] = k.split("\u0000");
      v.push({
        rule: "chained-move",
        message: `Stock is moved twice: ${bin} receives ${sku} (${stepLabel(into)}) and also gives it up (${stepLabel(out)}).`,
        bin,
        sku,
      });
    }
  }

  // --- final state: one product per bin, size class, capacity ---
  const finalByBin = new Map<string, { sku: string; quantity: number }[]>();
  for (const [k, qty] of state) {
    if (qty <= 0) continue;
    const [bin, sku] = k.split("\u0000");
    const list = finalByBin.get(bin) ?? [];
    list.push({ sku, quantity: qty });
    finalByBin.set(bin, list);
  }
  for (const [binCode, items] of finalByBin) {
    const bin = bins.get(binCode);
    if (!bin) continue; // already reported as unknown-bin where a step used it
    if (items.length > 1) {
      v.push({
        rule: "one-product-per-bin",
        message: `${binCode} ends up holding more than one product: ${items.map((i) => `${i.quantity} × ${i.sku}`).join(" and ")}.`,
        bin: binCode,
      });
    }
    for (const i of items) {
      const p = products.get(i.sku);
      if (p && p.size !== bin.size) {
        v.push({
          rule: "size-class",
          message: `${i.sku} is ${p.size} but ${binCode} is a ${bin.size} bin.`,
          bin: binCode,
          sku: i.sku,
        });
      }
    }
    const units = items.reduce((s, i) => s + i.quantity, 0);
    const before = initialBinUnits.get(binCode) ?? 0;
    if (bin.capacity !== null && units > bin.capacity && units > before) {
      v.push({
        rule: "capacity",
        message: `${binCode} ends up holding ${units} units; its capacity is ${bin.capacity}.`,
        bin: binCode,
      });
    }
  }

  // --- every incoming line is placed in full or reported as unplaced ---
  for (const line of data.incoming) {
    const placed = steps
      .filter((s): s is Extract<Step, { type: "putaway" }> => s.type === "putaway" && s.reference === line.reference && s.sku === line.sku)
      .reduce((sum, s) => sum + s.quantity, 0);
    const unplaced = plan.unplaced
      .filter((u) => u.reference === line.reference && u.sku === line.sku)
      .reduce((sum, u) => sum + u.quantity, 0);
    if (placed + unplaced !== line.quantity) {
      const missing = line.quantity - placed - unplaced;
      v.push({
        rule: "incoming-accounting",
        message:
          missing > 0
            ? `${line.reference} (${line.sku}): ${missing} of ${line.quantity} units are neither placed in a bin nor reported as unplaced.`
            : `${line.reference} (${line.sku}): ${-missing} more units are placed than are incoming.`,
        sku: line.sku,
      });
    }
  }
  for (const s of steps) {
    if (s.type !== "putaway") continue;
    if (!data.incoming.some((l) => l.reference === s.reference && l.sku === s.sku)) {
      v.push({
        rule: "incoming-accounting",
        message: `Cannot ${stepLabel(s)}: ${s.reference} does not list ${s.sku} as incoming.`,
        sku: s.sku,
      });
    }
  }

  return v;
}
