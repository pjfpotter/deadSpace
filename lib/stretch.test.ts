import { describe, expect, it } from "vitest";
import type { Bin, Movement, Product, StockRow, StoreData } from "./model";
import { computeRealSpace, spaceUsed } from "./real-space";
import { computeRunOut, historySpan } from "./run-out";
import { solve } from "./solve";
import { computeSlotting, easier, reachKey } from "./slotting";
import { SPACE_PER_UNIT_M3 } from "./space-weights";
import { loadMovements, loadStore } from "./store";

const mv = (date: string, sku: string, quantity: number, type: Movement["type"] = "customer_dispatch"): Movement => ({ date, type, sku, quantity });
const prod = (sku: string, size: Product["size"] = "Small"): Product => ({ sku, name: `Name ${sku}`, category: "c", size });
const bin = (code: string, size: Bin["size"] = "Small", capacity: number | null = 100): Bin => ({ code, zone: "z", size, capacity });
const row = (b: string, sku: string, quantity: number): StockRow => ({ bin: b, sku, quantity, lastCounted: "2026-11-01" });

describe("run-out risk", () => {
  const products = [prod("A"), prod("B"), prod("C"), prod("D")];

  it("cover = counted / average daily outbound units (9 units, 2 a day = 4.5)", () => {
    // 10 days with movements, 20 units out of A = 2 a day
    const movements = [...Array.from({ length: 9 }, (_, i) => mv(`2026-01-0${i + 1}`, "X", 1)), mv("2026-01-10", "A", 20)];
    const r = computeRunOut({ products, incoming: [] }, [row("b1", "A", 9)], movements);
    expect(r.historyDays).toBe(10);
    expect(r.rows.find((x) => x.sku === "A")!.coverDays).toBe(4.5);
  });

  it("flags low cover and zero stock, and not healthy products", () => {
    const movements = [mv("2026-01-01", "A", 10), mv("2026-01-02", "A", 10), mv("2026-01-02", "B", 10), mv("2026-01-02", "C", 10)];
    const stock = [row("b1", "A", 9), row("b2", "B", 500)];
    const r = computeRunOut({ products, incoming: [] }, stock, movements);
    const s = (sku: string) => r.rows.find((x) => x.sku === sku)!.status;
    expect(s("A")).toBe("at-risk");
    expect(s("B")).toBe("ok");
    expect(s("C")).toBe("out-of-stock");
  });

  it("shows the incoming line and due date next to the product", () => {
    const incoming = [{ reference: "PO-1", expectedDate: "2026-12-01", source: "Supplier delivery", supplier: "S", sku: "C", quantity: 40 }];
    const r = computeRunOut({ products, incoming }, [], [mv("2026-01-01", "C", 1)]);
    expect(r.rows.find((x) => x.sku === "C")!.incoming).toEqual(incoming);
  });

  it("reports unknown cover, never Infinity or NaN, for no outbound history", () => {
    const movements = [mv("2026-01-01", "A", 5, "supplier_receipt"), mv("2026-01-05", "B", 1)];
    const r = computeRunOut({ products, incoming: [] }, [row("b1", "A", 30)], movements);
    const a = r.rows.find((x) => x.sku === "A")!;
    expect(a.coverDays).toBeNull();
    expect(a.status).toBe("unknown");
    for (const x of r.rows) expect(x.coverDays === null || Number.isFinite(x.coverDays)).toBe(true);
  });

  it("handles an empty history without dividing by zero", () => {
    const r = computeRunOut({ products, incoming: [] }, [row("b1", "A", 3)], []);
    expect(r.historyDays).toBe(0);
    expect(r.rows.every((x) => x.coverDays === null)).toBe(true);
  });

  it("counts days that have movements, not calendar days", () => {
    expect(historySpan([mv("2026-01-01", "A", 1), mv("2026-01-01", "A", 1)]).days).toBe(1);
    expect(historySpan([mv("2026-01-02", "A", 1), mv("2026-01-05", "A", 1)]).days).toBe(2); // Friday and Monday
  });

  it("runs on the real data with a 40-day history and no non-finite numbers", () => {
    const data = loadStore();
    const r = computeRunOut(data, data.stock, loadMovements());
    expect(r.historyDays).toBe(40);
    expect(r.rows).toHaveLength(data.products.length);
    for (const x of r.rows) expect(x.coverDays === null || Number.isFinite(x.coverDays)).toBe(true);
  });
});

describe("fast-mover slotting", () => {
  it("parses bay and shelf, lower is easier", () => {
    expect(reachKey("A-03-2")).toEqual([3, 2]);
    expect(reachKey("BULK-02")).toEqual([2, 0]);
    expect(reachKey("???")).toBeNull();
    expect(easier("A-01-3", "A-02-1")).toBeLessThan(0);
    expect(easier("A-02-1", "A-02-2")).toBeLessThan(0);
    expect(easier("A-10-1", "A-9-1")).toBeGreaterThan(0); // numeric, not text, order
  });

  const data = { bins: [bin("A-01-1"), bin("A-05-1")], products: [prod("QUIET"), prod("BUSY")] };
  const stock = [row("A-01-1", "QUIET", 20), row("A-05-1", "BUSY", 30)];
  const movements = [mv("2026-01-01", "BUSY", 1), mv("2026-01-02", "BUSY", 1), mv("2026-01-03", "BUSY", 1), mv("2026-01-03", "QUIET", 1)];

  it("ranks products by number of outbound movements within a size class", () => {
    const s = computeSlotting(data, stock, movements);
    const small = s.ranking.find((r) => r.size === "Small")!;
    expect(small.products.map((p) => [p.sku, p.picks])).toEqual([["BUSY", 3], ["QUIET", 1]]);
  });

  it("does not count receipts as picks", () => {
    const s = computeSlotting(data, stock, [mv("2026-01-01", "QUIET", 1, "supplier_receipt"), ...movements]);
    expect(s.ranking[0].products.find((p) => p.sku === "QUIET")!.picks).toBe(1);
  });

  it("suggests moving the busy product to the easier bin", () => {
    const s = computeSlotting(data, stock, movements);
    expect(s.swaps).toHaveLength(1);
    expect(s.swaps[0].fast).toMatchObject({ sku: "BUSY", from: "A-05-1", to: "A-01-1" });
    expect(s.swaps[0].slow).toMatchObject({ sku: "QUIET", from: "A-01-1", to: "A-05-1" });
  });

  it("makes no swap when the busy product is already easiest to reach", () => {
    const s = computeSlotting(data, [row("A-01-1", "BUSY", 30), row("A-05-1", "QUIET", 20)], movements);
    expect(s.swaps).toEqual([]);
  });

  it("never suggests a swap that exceeds the other bin's capacity", () => {
    const small = { bins: [bin("A-01-1", "Small", 25), bin("A-05-1", "Small", 100)], products: data.products };
    // BUSY has 30 units; the easy bin holds only 25
    expect(computeSlotting(small, stock, movements).swaps).toEqual([]);
  });

  it("never swaps across size classes, mixed bins or unknown capacity", () => {
    const mixed = { bins: [bin("A-01-1", "Medium"), bin("A-05-1", "Small")], products: data.products };
    expect(computeSlotting(mixed, stock, movements).swaps).toEqual([]);
    const unknown = { bins: [bin("A-01-1", "Small", null), bin("A-05-1")], products: data.products };
    expect(computeSlotting(unknown, stock, movements).swaps).toEqual([]);
    const twoInOne = [...stock, row("A-01-1", "BUSY", 1)];
    expect(computeSlotting(data, twoInOne, movements).swaps).toEqual([]);
  });

  it("uses each bin at most once", () => {
    const d = { bins: [bin("A-01-1"), bin("A-02-1"), bin("A-05-1"), bin("A-06-1")], products: [prod("P1"), prod("P2"), prod("P3"), prod("P4")] };
    const st = [row("A-01-1", "P1", 5), row("A-02-1", "P2", 5), row("A-05-1", "P3", 5), row("A-06-1", "P4", 5)];
    const m = [...Array(4).fill(mv("2026-01-01", "P4", 1)), ...Array(3).fill(mv("2026-01-01", "P3", 1))];
    const used = computeSlotting(d, st, m).swaps.flatMap((s) => [s.fast.from, s.fast.to]);
    expect(new Set(used).size).toBe(used.length);
  });

  it("leaves the main plan unchanged", () => {
    const real = loadStore();
    const before = JSON.stringify(solve(real));
    computeSlotting(real, real.stock, loadMovements());
    expect(JSON.stringify(solve(real))).toBe(before);
  });

  it("on the real data, every swap keeps one product per bin and fits capacity", () => {
    const real = loadStore();
    const caps = new Map(real.bins.map((b) => [b.code, b]));
    for (const s of computeSlotting(real, real.stock, loadMovements()).swaps) {
      expect(caps.get(s.fast.to)!.size).toBe(caps.get(s.fast.from)!.size);
      expect(s.fast.quantity).toBeLessThanOrEqual(caps.get(s.fast.to)!.capacity!);
      expect(s.slow.quantity).toBeLessThanOrEqual(caps.get(s.slow.to)!.capacity!);
      expect(s.fast.picks).toBeGreaterThan(s.slow.picks);
    }
  });
});

describe("real space", () => {
  it("space used = units × weight", () => {
    expect(spaceUsed(40, "Medium", { Small: 1, Medium: 0.5, Large: 1, Bulk: 1 })).toBe(20);
  });

  it("shows units fill and space fill side by side per size class, with a custom weight", () => {
    const data: Pick<StoreData, "bins"> = { bins: [bin("A-01-1", "Small", 100), bin("A-02-1", "Small", 100)] };
    const r = computeRealSpace(data, [row("A-01-1", "X", 100)], { ...SPACE_PER_UNIT_M3, Small: 0.0036 }, { Small: 0.36, Medium: 1, Large: 1, Bulk: 1 });
    const small = r.classes.find((c) => c.size === "Small")!;
    expect(small.unitsPercent).toBeCloseTo(50);
    expect(small.spacePercent).toBeCloseTo(50); // 100 × 0.0036 = 0.36 m³ of 0.72
    expect(r.classes.map((c) => c.size)).toEqual(["Small", "Medium", "Large", "Bulk"]);
  });

  it("excludes unknown-capacity bins from both percentages, as the fullness page does", () => {
    const data: Pick<StoreData, "bins"> = { bins: [bin("BULK-01", "Bulk", 300), bin("BULK-04", "Bulk", null)] };
    const r = computeRealSpace(data, [row("BULK-01", "X", 150), row("BULK-04", "Y", 150)]);
    const bulk = r.classes.find((c) => c.size === "Bulk")!;
    expect(bulk.excludedBins).toEqual(["BULK-04"]);
    expect(bulk.unitsPercent).toBeCloseTo(50);
  });

  it("returns null percentages for a class with no bins", () => {
    const r = computeRealSpace({ bins: [] }, []);
    expect(r.classes.every((c) => c.unitsPercent === null && c.spacePercent === null)).toBe(true);
  });

  it("matches the fullness units percentage on the real data and leaves the plan unchanged", () => {
    const real = loadStore();
    const before = JSON.stringify(solve(real));
    const r = computeRealSpace(real, real.stock);
    expect(r.classes.find((c) => c.size === "Bulk")!.unitsPercent).toBeCloseTo(57, 0);
    expect(JSON.stringify(solve(real))).toBe(before);
  });
});
