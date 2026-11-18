import { describe, expect, it } from "vitest";
import { computeFlags, lockedBins } from "./flags";
import type { StoreData } from "./model";
import { loadStore } from "./store";

const real = loadStore();
const byKind = (kind: string) => computeFlags(real).filter((f) => f.kind === kind);

describe("computeFlags on the real data", () => {
  it("flags A-04-2 as a mixed bin", () => {
    const mixed = byKind("mixed-bin");
    expect(mixed.map((f) => f.bin)).toEqual(["A-04-2"]);
    expect(mixed[0].detail).toContain("110 × FX-DWL-08");
    expect(mixed[0].detail).toContain("12 × CN-OIL-1L");
    expect(mixed[0].decision).toContain("12");
    expect(mixed[0].decision).toContain("CN-OIL-1L");
  });

  it("flags A-04-2 and B-03-2 as over capacity", () => {
    const over = byKind("over-capacity");
    expect(over.map((f) => f.bin).sort()).toEqual(["A-04-2", "B-03-2"]);
    expect(over.find((f) => f.bin === "A-04-2")!.detail).toContain("122");
    expect(over.find((f) => f.bin === "B-03-2")!.detail).toContain("66");
  });

  it("flags BULK-04 as unknown capacity", () => {
    const unknown = byKind("unknown-capacity");
    expect(unknown.map((f) => f.bin)).toEqual(["BULK-04"]);
    expect(unknown[0].decision).toMatch(/no delivery or merge/);
  });

  it("flags the bins last counted on 7 Nov as stale (11 bins)", () => {
    const stale = byKind("stale-count");
    expect(stale).toHaveLength(11);
    expect(stale.map((f) => f.bin)).toContain("A-04-2"); // oldest row in a mixed bin counts
    expect(stale.map((f) => f.bin)).not.toContain("A-01-1"); // counted 11 Nov
  });

  it("gives every flag a decision and a unique id", () => {
    const flags = computeFlags(real);
    expect(new Set(flags.map((f) => f.id)).size).toBe(flags.length);
    for (const f of flags) expect(f.decision.length).toBeGreaterThan(10);
  });

  it("locks over-capacity and unknown-capacity bins only", () => {
    expect([...lockedBins(real)].sort()).toEqual(["A-04-2", "B-03-2", "BULK-04"]);
  });

  it("never alters counted quantities", () => {
    const before = JSON.stringify(real.stock);
    computeFlags(real);
    expect(JSON.stringify(real.stock)).toBe(before);
  });
});

describe("computeFlags on small synthetic data", () => {
  const base: StoreData = {
    bins: [{ code: "A-01-1", zone: "z", size: "Small", capacity: 10 }],
    products: [{ sku: "X", name: "Thing", category: "c", size: "Small" }],
    stock: [{ bin: "A-01-1", sku: "X", quantity: 10, lastCounted: "2026-11-14" }],
    incoming: [],
  };

  it("does not flag a bin exactly at capacity", () => {
    expect(computeFlags(base)).toEqual([]);
  });

  it("flags one unit over", () => {
    const data = { ...base, stock: [{ ...base.stock[0], quantity: 11 }] };
    expect(computeFlags(data).map((f) => f.kind)).toEqual(["over-capacity"]);
  });

  it("does not flag a count exactly at the stale threshold", () => {
    const data: StoreData = {
      ...base,
      bins: [...base.bins, { code: "A-01-2", zone: "z", size: "Small", capacity: 10 }],
      stock: [
        { bin: "A-01-1", sku: "X", quantity: 1, lastCounted: "2026-11-14" },
        { bin: "A-01-2", sku: "X", quantity: 1, lastCounted: "2026-11-09" }, // 5 days older
      ],
    };
    expect(computeFlags(data)).toEqual([]);
    data.stock[1].lastCounted = "2026-11-08"; // 6 days older
    expect(computeFlags(data).map((f) => f.kind)).toEqual(["stale-count"]);
  });
});
