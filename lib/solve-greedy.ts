import { lockedBins } from "./flags";
import type { Move, Plan, Putaway, Step, StoreData, Unplaced } from "./model";

/**
 * Greedy planner: deterministic, fast, and checked by the independent validator.
 * (Not claimed to be mathematically optimal. See design.md decisions 4 and 5.)
 *
 * 1. Fix mixed bins: move the minority product out to a bin holding only that product.
 * 2. Merge: for each product, work out how many bins it needs for what it holds PLUS
 *    what is incoming. If that is fewer than it uses now, empty the least-full bins
 *    into the fullest ones. If not (a merge would only be undone by the delivery),
 *    leave it alone and say why.
 * 3. Put away incoming lines in date order: top up that product's fullest bins first,
 *    then use empty bins (originally empty ones before freed ones).
 *
 * Locked bins (over capacity, or capacity unknown) are never destinations and are not merged.
 * A bin that gives up a product is never used to receive that product (no stock moved twice).
 */
export function solveGreedy(data: StoreData): Plan {
  const locked = lockedBins(data);
  const bins = new Map(data.bins.map((b) => [b.code, b]));
  const product = new Map(data.products.map((p) => [p.sku, p]));
  const name = (sku: string) => product.get(sku)?.name ?? sku;

  // Working state: bin -> sku -> quantity
  const state = new Map<string, Map<string, number>>();
  for (const b of data.bins) state.set(b.code, new Map());
  for (const r of data.stock) {
    const m = state.get(r.bin);
    if (m) m.set(r.sku, (m.get(r.sku) ?? 0) + r.quantity);
  }
  const originallyEmpty = new Set(data.bins.filter((b) => (state.get(b.code)?.size ?? 0) === 0).map((b) => b.code));

  const units = (bin: string) => [...(state.get(bin)?.values() ?? [])].reduce((s, q) => s + q, 0);
  const qtyOf = (bin: string, sku: string) => state.get(bin)?.get(sku) ?? 0;
  const cap = (bin: string) => bins.get(bin)?.capacity ?? 0;
  const room = (bin: string) => Math.max(0, cap(bin) - units(bin));
  const onlyHolds = (bin: string, sku: string) => {
    const m = state.get(bin)!;
    return m.size === 1 && m.has(sku);
  };
  const isEmpty = (bin: string) => units(bin) === 0;
  const byCode = (a: string, b: string) => a.localeCompare(b);

  const moves: Move[] = [];
  const putaways: Putaway[] = [];
  const unplaced: Unplaced[] = [];
  const notes: string[] = [];
  const emptiedBy = new Map<string, string>(); // bin -> id of the move that emptied it
  const sourcesOf = new Map<string, Set<string>>(); // sku -> bins that gave it up

  let moveN = 0;
  const doMove = (kind: Move["kind"], sku: string, quantity: number, from: string, to: string) => {
    const id = `M${++moveN}`;
    const mv: Move = { id, kind, sku, quantity, from, to };
    state.get(from)!.set(sku, qtyOf(from, sku) - quantity);
    if (qtyOf(from, sku) === 0) state.get(from)!.delete(sku);
    state.get(to)!.set(sku, qtyOf(to, sku) + quantity);
    if (isEmpty(from)) {
      mv.frees = from;
      emptiedBy.set(from, id);
    }
    if (!sourcesOf.has(sku)) sourcesOf.set(sku, new Set());
    sourcesOf.get(sku)!.add(from);
    moves.push(mv);
  };

  // ---- 1. Fix mixed bins -------------------------------------------------
  for (const b of data.bins) {
    const items = [...state.get(b.code)!.entries()];
    if (items.length < 2) continue;
    items.sort((a, c) => c[1] - a[1] || byCode(a[0], c[0])); // keep the largest
    for (const [sku, qty] of items.slice(1)) {
      const size = product.get(sku)?.size;
      const homes = data.bins
        .filter((x) => x.code !== b.code && !locked.has(x.code) && x.size === size && onlyHolds(x.code, sku) && room(x.code) >= qty)
        .sort((x, y) => units(y.code) - units(x.code) || byCode(x.code, y.code)); // fullest that fits
      let dest = homes[0]?.code;
      if (!dest) {
        dest = data.bins
          .filter((x) => x.code !== b.code && !locked.has(x.code) && x.size === size && isEmpty(x.code) && cap(x.code) >= qty)
          .sort((x, y) => byCode(x.code, y.code))[0]?.code;
      }
      if (dest) doMove("fix-mixed", sku, qty, b.code, dest);
      // If there is nowhere to put it, the bin stays mixed and the validator will block the plan.
    }
  }

  // ---- 2. Merge products, sized against stock + incoming -----------------
  const incomingBySku = new Map<string, number>();
  for (const l of data.incoming) incomingBySku.set(l.sku, (incomingBySku.get(l.sku) ?? 0) + l.quantity);

  const skus = [...new Set(data.stock.map((r) => r.sku))].sort(byCode);
  for (const sku of skus) {
    const size = product.get(sku)?.size;
    const holders = data.bins
      .filter((x) => !locked.has(x.code) && x.size === size && onlyHolds(x.code, sku))
      .map((x) => x.code)
      .sort((a, c) => qtyOf(c, sku) - qtyOf(a, sku) || byCode(a, c)); // fullest first
    if (holders.length < 2) continue;

    const have = holders.reduce((s, c) => s + qtyOf(c, sku), 0);
    const incoming = incomingBySku.get(sku) ?? 0;
    const total = have + incoming;

    let k = 0;
    let capSum = 0;
    while (k < holders.length && capSum < total) capSum += cap(holders[k++]);
    if (capSum < total) k = holders.length; // would need more bins than it has: no merge possible

    if (k >= holders.length) {
      if (holders.length > 1 && incoming > 0) {
        notes.push(
          `${name(sku)} (${sku}) stays in ${holders.length} bins: ${have} on hand + ${incoming} incoming = ${total} units needs ${holders.length} bins of ${cap(holders[0])}, so merging now would only be undone by the delivery.`,
        );
      } else if (holders.length > 1) {
        notes.push(
          `${name(sku)} (${sku}) stays in ${holders.length} bins: ${have} units is more than one bin of ${cap(holders[0])} can hold.`,
        );
      }
      continue;
    }

    const dests = holders.slice(0, k);
    const sources = holders.slice(k);
    for (const src of sources) {
      let left = qtyOf(src, sku);
      const fit = dests.filter((d) => room(d) >= left).sort((a, c) => room(a) - room(c) || byCode(a, c))[0];
      if (fit) {
        doMove("merge", sku, left, src, fit);
        continue;
      }
      for (const d of [...dests].sort((a, c) => room(c) - room(a) || byCode(a, c))) {
        if (left === 0) break;
        const q = Math.min(left, room(d));
        if (q > 0) {
          doMove("merge", sku, q, src, d);
          left -= q;
        }
      }
    }
  }

  // ---- 3. Put away incoming, earliest first ------------------------------
  const lines = [...data.incoming].sort(
    (a, c) => a.expectedDate.localeCompare(c.expectedDate) || byCode(a.reference, c.reference),
  );
  let putN = 0;
  for (const line of lines) {
    const size = product.get(line.sku)?.size;
    const gave = sourcesOf.get(line.sku) ?? new Set<string>();
    let left = line.quantity;
    const put = (to: string, quantity: number, topUp: boolean) => {
      const p: Putaway = { id: `P${++putN}`, reference: line.reference, sku: line.sku, quantity, to, topUp };
      const freedBy = emptiedBy.get(to);
      if (!topUp && freedBy && !originallyEmpty.has(to)) p.madeRoomBy = freedBy;
      state.get(to)!.set(line.sku, qtyOf(to, line.sku) + quantity);
      putaways.push(p);
      left -= quantity;
    };

    // a. top up this product's own bins, fullest first
    const own = data.bins
      .filter((x) => !locked.has(x.code) && x.size === size && !gave.has(x.code) && onlyHolds(x.code, line.sku) && room(x.code) > 0)
      .sort((a, c) => room(a.code) - room(c.code) || byCode(a.code, c.code));
    for (const b of own) {
      if (left === 0) break;
      put(b.code, Math.min(left, room(b.code)), true);
    }

    // b. empty bins of the right size: never-used ones first, then freed ones
    const empties = data.bins
      .filter((x) => !locked.has(x.code) && x.size === size && !gave.has(x.code) && isEmpty(x.code) && cap(x.code) > 0)
      .sort((a, c) => Number(originallyEmpty.has(c.code)) - Number(originallyEmpty.has(a.code)) || byCode(a.code, c.code));
    for (const b of empties) {
      if (left === 0) break;
      put(b.code, Math.min(left, cap(b.code)), false);
    }

    if (left > 0) {
      unplaced.push({
        reference: line.reference,
        sku: line.sku,
        quantity: left,
        reason: `No room for ${left} units: all ${size} bins are in use or locked. Free a ${size} bin (empty one by moving its stock out) or add space before this arrives.`,
      });
    }
  }

  // ---- Assemble -----------------------------------------------------------
  const steps: Step[] = [
    ...moves.map((m) => ({ type: "move" as const, ...m })),
    ...putaways.map((p) => ({ type: "putaway" as const, ...p })),
  ];
  const freedBins = [...new Set(moves.filter((m) => m.frees).map((m) => m.frees!))].sort(byCode);

  return { moves, putaways, unplaced, freedBins, steps, notes };
}
