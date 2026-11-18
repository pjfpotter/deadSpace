import { describe, expect, it } from "vitest";
import { checkFit, parseQuantity } from "./fit";
import type { Plan } from "./model";
import { solve } from "./solve";
import { loadStore } from "./store";

const data = loadStore();
const plan = solve(data);

function ok(sku: string, qty: number | string) {
  const r = checkFit(data, plan, sku, qty);
  if ("error" in r) throw new Error(r.error);
  return r;
}

describe("input", () => {
  it("rejects an unknown product", () => {
    expect(checkFit(data, plan, "NOPE-1", 5)).toEqual({ error: 'Unknown product "NOPE-1".' });
  });
  it("rejects zero, negative and fractional quantities", () => {
    expect(parseQuantity(0)).toEqual({ error: "Quantity must be greater than zero." });
    expect(parseQuantity(-3)).toEqual({ error: "Quantity must be greater than zero." });
    expect(parseQuantity("2.5")).toEqual({ error: "Quantity must be a whole number." });
    expect(parseQuantity("abc")).toEqual({ error: "Quantity must be a number." });
    expect(parseQuantity("")).toEqual({ error: "Enter a quantity." });
    expect(parseQuantity("12")).toEqual({ quantity: 12 });
  });
  it("returns no result for invalid quantity", () => {
    expect("error" in checkFit(data, plan, "FG-PLN-LRG", 0)).toBe(true);
    expect("error" in checkFit(data, plan, "FG-PLN-LRG", 2.5)).toBe(true);
  });
});

describe("fit now", () => {
  it("tops up the bin that already holds the product", () => {
    const r = ok("FG-PLN-LRG", 10); // C-03-2 holds 7 of 30
    expect(r.now.fits).toBe(true);
    expect(r.now.allocations).toEqual([{ bin: "C-03-2", units: 10, how: "top-up" }]);
    expect(r.now.short).toBe(0);
  });

  it("fills same-product bins before empty bins and splits across bins", () => {
    // CP-ARM-PR has no stock; B-03-3 is the only empty Medium bin (60).
    const r = ok("CP-LEG-BEN", 100); // B-01-1 has 20 spare, B-01-2 has 46 spare, then B-03-3 (60)
    expect(r.now.fits).toBe(true);
    expect(r.now.allocations.map((a) => [a.bin, a.units, a.how])).toEqual([
      ["B-01-1", 20, "top-up"],
      ["B-01-2", 46, "top-up"],
      ["B-03-3", 34, "empty"],
    ]);
  });

  it("counts only the matching size class", () => {
    // Small has an empty bin (A-05-1) but a Large product must not use it.
    const r = ok("FG-PLN-LRG", 24);
    expect(r.now.allocations.every((a) => a.bin.startsWith("C-"))).toBe(true);
    expect(r.now.fits).toBe(false);
    expect(r.now.short).toBe(1);
  });
});

describe("flagged bins", () => {
  it("never counts BULK-04 (unknown capacity) and reports it left out", () => {
    const r = ok("PK-BUB-ROL", 1);
    expect(r.now.fits).toBe(false);
    expect(r.now.allocations).toEqual([]);
    expect(r.now.excluded).toEqual([{ bin: "BULK-04", reason: "capacity unknown" }]);
  });

  it("gives an over-capacity bin zero spare room and leaves other room unaffected", () => {
    const r = ok("CP-CUS-CHA", 60); // B-03-2 holds 66 of 60; B-03-3 is empty
    expect(r.now.allocations.map((a) => a.bin)).toEqual(["B-03-3"]);
    expect(r.now.excluded).toContainEqual({ bin: "B-03-2", reason: "over capacity" });
    expect(r.now.fits).toBe(true);
  });

  it("does not use the mixed bin A-04-2", () => {
    const r = ok("CN-OIL-1L", 200);
    expect(r.now.allocations.some((a) => a.bin === "A-04-2")).toBe(false);
    expect(r.now.excluded).toContainEqual({ bin: "A-04-2", reason: "holds two products, over capacity" });
  });
});

describe("after merges", () => {
  it("reports a quantity that fits only after merges and names the freeing move", () => {
    // FX-KEY-ALN (Small): 69 spare in A-05-2 plus the empty A-05-1 is 189 now. The merges
    // free A-02-1 and A-02-3 (Small), so 200 fits only after merges.
    const r = ok("FX-KEY-ALN", 200);
    expect(r.now.fits).toBe(false);
    expect(r.now.short).toBe(11);
    expect(r.afterMerges?.fits).toBe(true);
    // Hand-checked in docs/hand-check.md: 69 spare in A-05-2, then the freed A-02-1 (120) and A-02-3 (11).
    // A-05-1 is no longer empty: the plan puts CN-VAR-1L there.
    expect(r.afterMerges!.allocations.map((a) => [a.bin, a.units])).toEqual([
      ["A-05-2", 69],
      ["A-02-1", 120],
      ["A-02-3", 11],
    ]);
    const freed = r.afterMerges!.allocations.filter((a) => a.madeRoomBy);
    expect(freed.length).toBeGreaterThan(0);
    for (const a of freed) {
      expect(plan.freedBins).toContain(a.bin);
      expect(a.madeRoomBy).toMatch(new RegExp(`from ${a.bin} `));
    }
  });

  it("does not offer room that next week's deliveries already take", () => {
    // A-05-1 is empty now (120) but the plan puts 96 CN-VAR-1L into it, leaving 24.
    const r = ok("CN-VAR-1L", 120);
    expect(r.now.allocations[0]).toEqual({ bin: "A-05-1", units: 120, how: "empty" });
    expect(r.afterMerges!.allocations[0]).toEqual({ bin: "A-05-1", units: 24, how: "top-up" });
  });

  it("states how many units are short when nothing fits", () => {
    const r = ok("FG-PLN-LRG", 100000);
    expect(r.now.fits).toBe(false);
    expect(r.now.short).toBeGreaterThan(99000);
    expect(r.afterMerges!.short).toBeGreaterThan(99000);
  });

  it("withholds after-merges when the plan breaks a rule but still answers now", () => {
    const broken: Plan = {
      ...plan,
      steps: [
        { type: "move", id: "bad", kind: "merge", sku: "FG-PLN-LRG", quantity: 999, from: "C-03-2", to: "C-03-2" },
      ],
    };
    const r = checkFit(data, broken, "FG-PLN-LRG", 5);
    if ("error" in r) throw new Error(r.error);
    expect(r.now.fits).toBe(true);
    expect(r.afterMerges).toBeNull();
    expect(r.afterMergesNote).toMatch(/withheld/);
  });
});

describe("read only", () => {
  it("does not change the plan", () => {
    const before = JSON.stringify(plan);
    ok("FG-TBL-BIS", 40);
    ok("CP-LEG-BEN", 100);
    expect(JSON.stringify(plan)).toBe(before);
  });
});
