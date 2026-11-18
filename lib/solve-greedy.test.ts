import { describe, expect, it } from "vitest";
import { computeFullness } from "./fullness";
import type { Bin, IncomingLine, Product, StockRow, StoreData } from "./model";
import { solve } from "./solve";
import { solveGreedy } from "./solve-greedy";
import { loadStore } from "./store";
import { applySteps, validatePlan } from "./validate";

const real = loadStore();
const plan = solve(real);
const triple = (m: { sku: string; quantity: number; from: string; to: string }) =>
  `${m.sku} ${m.quantity} ${m.from}>${m.to}`;

describe("solveGreedy on the real Fernbrook data: merges", () => {
  it("moves the oil out of the mixed bin first", () => {
    expect(plan.moves[0]).toMatchObject({ kind: "fix-mixed", sku: "CN-OIL-1L", quantity: 12, from: "A-04-2", to: "A-04-3" });
  });

  it("produces exactly the hand-checked merge list", () => {
    expect(plan.moves.map(triple).sort()).toEqual(
      [
        "CN-OIL-1L 12 A-04-2>A-04-3",
        "CP-BRK-STL 22 B-02-2>B-02-1",
        "CP-LEG-BEN 14 B-01-2>B-01-1",
        "FG-BEN-2S 5 C-01-2>C-01-1",
        "FX-BLT-M8 30 A-02-1>A-01-3",
        "FX-HNG-BRS 20 A-02-3>A-02-2",
      ].sort(),
    );
  });

  it("frees five bins", () => {
    expect(plan.freedBins).toEqual(["A-02-1", "A-02-3", "B-01-2", "B-02-2", "C-01-2"]);
  });

  it("does not merge products whose delivery would just re-split them, and says why", () => {
    const moved = new Set(plan.moves.map((m) => m.sku));
    for (const sku of ["FX-SCR-440", "PK-CTN-BEN", "CN-SND-120"]) expect(moved.has(sku)).toBe(false);
    expect(plan.notes!.join("\n")).toMatch(/FX-SCR-440.*105 on hand \+ 120 incoming = 225/);
    expect(plan.notes!.join("\n")).toMatch(/PK-CTN-BEN.*270 on hand \+ 200 incoming = 470/);
    expect(plan.notes!.join("\n")).toMatch(/CN-SND-120.*130 units is more than one bin of 120/);
  });

  it("never moves anything into the locked bins", () => {
    for (const s of plan.steps) expect(["A-04-2", "B-03-2", "BULK-04"]).not.toContain(s.to);
  });

  it("keeps CN-SND-120 in two bins", () => {
    const after = applySteps(real, plan.steps);
    const sndBins = [...after.entries()].filter(([k, q]) => k.endsWith("CN-SND-120") && q > 0);
    expect(sndBins).toHaveLength(2);
  });
});

describe("solveGreedy on the real Fernbrook data: incoming", () => {
  it("places every incoming line in full", () => {
    expect(plan.unplaced).toEqual([]);
    for (const line of real.incoming) {
      const placed = plan.putaways
        .filter((p) => p.reference === line.reference && p.sku === line.sku)
        .reduce((s, p) => s + p.quantity, 0);
      expect(placed, `${line.reference} ${line.sku}`).toBe(line.quantity);
    }
  });

  it("puts the new Medium products in an empty bin each, using a freed bin for the second", () => {
    const arm = plan.putaways.filter((p) => p.sku === "CP-ARM-PR");
    const top = plan.putaways.filter((p) => p.sku === "CP-TOP-BIS");
    expect(arm).toEqual([expect.objectContaining({ to: "B-03-3", quantity: 48, topUp: false })]);
    expect(top).toEqual([expect.objectContaining({ to: "B-01-2", quantity: 40, topUp: false })]);
    expect(top[0].madeRoomBy).toBeDefined();
    expect(plan.moves.find((m) => m.id === top[0].madeRoomBy)).toMatchObject({ frees: "B-01-2" });
  });

  it("tops up the existing bench bin before using a new Large bin", () => {
    const b3 = plan.putaways.filter((p) => p.sku === "FG-BEN-3S");
    expect(b3.map((p) => [p.to, p.quantity, p.topUp])).toEqual([
      ["C-02-1", 12, true],
      ["C-01-2", 18, false],
    ]);
  });

  it("puts the new varnish in the originally empty Small bin", () => {
    expect(plan.putaways.find((p) => p.sku === "CN-VAR-1L")).toMatchObject({ to: "A-05-1", quantity: 96 });
  });

  it("never sends a delivery to BULK-04", () => {
    expect(plan.putaways.some((p) => p.to === "BULK-04")).toBe(false);
  });

  it("orders steps so every freeing move comes before the putaway that needs it", () => {
    for (const p of plan.putaways) {
      if (!p.madeRoomBy) continue;
      const stepIndex = (id: string) => plan.steps.findIndex((s) => s.id === id);
      expect(stepIndex(p.madeRoomBy)).toBeLessThan(stepIndex(p.id));
    }
  });
});

describe("solveGreedy: the plan is valid", () => {
  it("passes the independent validator with zero violations", () => {
    expect(validatePlan(real, plan)).toEqual([]);
  });

  it("is deterministic", () => {
    expect(solveGreedy(real)).toEqual(solveGreedy(real));
  });

  it("leaves more empty bins after the plan than before, once deliveries are in", () => {
    const stockAfter = (): StockRow[] => {
      const out: StockRow[] = [];
      for (const [k, q] of applySteps(real, plan.steps)) {
        if (q <= 0) continue;
        const [bin, sku] = k.split("\u0000");
        out.push({ bin, sku, quantity: q, lastCounted: "planned" });
      }
      return out;
    };
    const before = computeFullness(real, real.stock).overall.emptyBins;
    const after = computeFullness(real, stockAfter()).overall.emptyBins;
    expect(before.sort()).toEqual(["A-05-1", "B-03-3"]);
    // Freed A-02-1 and A-02-3 stay empty; B-02-2 too; A-05-1, B-03-3, B-01-2, C-01-2 got deliveries.
    expect(after.sort()).toEqual(["A-02-1", "A-02-3", "B-02-2"]);
  });
});

describe("solveGreedy: when it cannot all fit", () => {
  const bin = (code: string, size: Bin["size"], capacity: number | null = 10): Bin => ({ code, zone: "z", size, capacity });
  const prod = (sku: string, size: Product["size"]): Product => ({ sku, name: `Product ${sku}`, category: "c", size });
  const stock = (b: string, sku: string, quantity: number): StockRow => ({ bin: b, sku, quantity, lastCounted: "2026-11-14" });
  const line = (reference: string, sku: string, quantity: number): IncomingLine => ({
    reference,
    expectedDate: "2026-11-24",
    source: "Supplier delivery",
    supplier: "Acme",
    sku,
    quantity,
  });

  it("reports the unplaced units and what to do about it, and the plan still validates", () => {
    const d: StoreData = {
      bins: [bin("S1", "Small"), bin("S2", "Small")],
      products: [prod("X", "Small"), prod("Y", "Small"), prod("Z", "Small")],
      stock: [stock("S1", "X", 5), stock("S2", "Y", 5)],
      incoming: [line("PO-1", "Z", 7)],
    };
    const p = solveGreedy(d);
    expect(p.putaways).toEqual([]);
    expect(p.unplaced).toEqual([expect.objectContaining({ reference: "PO-1", sku: "Z", quantity: 7 })]);
    expect(p.unplaced[0].reason).toMatch(/Free a Small bin/);
    expect(validatePlan(d, p)).toEqual([]);
  });

  it("places part and reports the rest", () => {
    const d: StoreData = {
      bins: [bin("S1", "Small"), bin("S2", "Small")],
      products: [prod("X", "Small")],
      stock: [stock("S1", "X", 8)],
      incoming: [line("PO-1", "X", 15)],
    };
    const p = solveGreedy(d);
    expect(p.putaways.reduce((s, x) => s + x.quantity, 0)).toBe(12); // 2 top-up + 10 in S2
    expect(p.unplaced[0].quantity).toBe(3);
    expect(validatePlan(d, p)).toEqual([]);
  });

  it("makes room by merging when a merge frees the bin the delivery needs", () => {
    const d: StoreData = {
      bins: [bin("S1", "Small"), bin("S2", "Small"), bin("S3", "Small")],
      products: [prod("X", "Small"), prod("Y", "Small"), prod("Z", "Small")],
      stock: [stock("S1", "X", 4), stock("S2", "X", 3), stock("S3", "Y", 2)],
      incoming: [line("PO-1", "Z", 6)],
    };
    const p = solveGreedy(d);
    expect(p.unplaced).toEqual([]);
    expect(p.moves.map(triple)).toEqual(["X 3 S2>S1"]);
    expect(p.putaways[0]).toMatchObject({ to: "S2", quantity: 6, madeRoomBy: "M1" });
    expect(validatePlan(d, p)).toEqual([]);
  });

  it("never merges stock into a bin of a different product or size class", () => {
    const d: StoreData = {
      bins: [bin("S1", "Small"), bin("M1", "Medium", 60), bin("M2", "Medium", 60)],
      products: [prod("X", "Small"), prod("Z", "Medium")],
      stock: [stock("S1", "X", 2), stock("M1", "Z", 5), stock("M2", "Z", 5)],
      incoming: [],
    };
    const p = solveGreedy(d);
    expect(p.moves).toHaveLength(1);
    expect(p.moves[0]).toMatchObject({ sku: "Z", from: "M2", to: "M1" });
  });
});

// A small seeded PRNG so the property test is reproducible.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe("solveGreedy: property test over 300 random stores", () => {
  it("always produces a plan the validator accepts, with every incoming line accounted for", () => {
    const seen = { withMoves: 0, withPutaways: 0, withUnplaced: 0, withFreedBinReused: 0 };
    for (let seed = 1; seed <= 300; seed++) {
      const r = rng(seed);
      const pick = (n: number) => Math.floor(r() * n);
      const sizes = ["Small", "Medium"] as const;
      const nBins = 3 + pick(8);
      const bins: Bin[] = Array.from({ length: nBins }, (_, i) => ({
        code: `B${i}`,
        zone: "z",
        size: sizes[i % 2],
        capacity: 10 + 10 * pick(3), // 10, 20, 30
      }));
      // all bins of a class share a capacity, like the real store
      const capBy = { Small: 20, Medium: 10 };
      bins.forEach((b) => (b.capacity = capBy[b.size as "Small" | "Medium"]));
      const products: Product[] = ["A", "B", "C", "D", "E"].map((sku, i) => ({
        sku,
        name: `P${sku}`,
        category: "c",
        size: sizes[i % 2],
      }));
      const stock: StockRow[] = [];
      for (const b of bins) {
        if (r() < 0.25) continue; // leave some empty
        const options = products.filter((p) => p.size === b.size);
        const p = options[pick(options.length)];
        stock.push({ bin: b.code, sku: p.sku, quantity: 1 + pick(b.capacity!), lastCounted: "2026-11-14" });
      }
      const incoming: IncomingLine[] = Array.from({ length: pick(4) }, (_, i) => ({
        reference: `PO-${i}`,
        expectedDate: `2026-11-${24 + pick(5)}`,
        source: "Supplier delivery",
        supplier: "Acme",
        sku: products[pick(products.length)].sku,
        quantity: 1 + pick(40),
      }));
      const data: StoreData = { bins, products, stock, incoming };

      const p = solveGreedy(data);
      const violations = validatePlan(data, p);
      expect(violations, `seed ${seed}: ${JSON.stringify(violations)}`).toEqual([]);
      expect(solveGreedy(data), `seed ${seed} deterministic`).toEqual(p);

      if (p.moves.length > 0) seen.withMoves++;
      if (p.putaways.length > 0) seen.withPutaways++;
      if (p.unplaced.length > 0) seen.withUnplaced++;
      if (p.putaways.some((x) => x.madeRoomBy)) seen.withFreedBinReused++;
    }
    // Guard against a vacuous test: the random stores must really exercise each path.
    expect(seen.withMoves).toBeGreaterThanOrEqual(30);
    expect(seen.withPutaways).toBeGreaterThanOrEqual(100);
    expect(seen.withUnplaced).toBeGreaterThanOrEqual(10);
    expect(seen.withFreedBinReused).toBeGreaterThanOrEqual(5);
  });
});
