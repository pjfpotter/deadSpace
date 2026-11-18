import { describe, expect, it } from "vitest";
import type { Move, Plan, Putaway, Step, StoreData } from "./model";
import { loadStore } from "./store";
import { applySteps, validatePlan, type Rule } from "./validate";

// A tiny store: X and Y are Small, Z is Medium.
const data: StoreData = {
  bins: [
    { code: "S1", zone: "z", size: "Small", capacity: 10 },
    { code: "S2", zone: "z", size: "Small", capacity: 10 },
    { code: "S3", zone: "z", size: "Small", capacity: 10 },
    { code: "S4", zone: "z", size: "Small", capacity: 10 }, // empty
    { code: "M1", zone: "z", size: "Medium", capacity: 10 }, // empty
    { code: "U1", zone: "z", size: "Small", capacity: null }, // unknown capacity -> locked
  ],
  products: [
    { sku: "X", name: "Thing X", category: "c", size: "Small" },
    { sku: "Y", name: "Thing Y", category: "c", size: "Small" },
    { sku: "Z", name: "Thing Z", category: "c", size: "Medium" },
  ],
  stock: [
    { bin: "S1", sku: "X", quantity: 4, lastCounted: "2026-11-14" },
    { bin: "S2", sku: "X", quantity: 3, lastCounted: "2026-11-14" },
    { bin: "S3", sku: "Y", quantity: 2, lastCounted: "2026-11-14" },
  ],
  incoming: [{ reference: "PO-1", expectedDate: "2026-11-24", source: "Supplier delivery", supplier: "Acme", sku: "Z", quantity: 6 }],
};

let n = 0;
const move = (sku: string, quantity: number, from: string, to: string): Step => {
  const m: Move = { id: `m${++n}`, kind: "merge", sku, quantity, from, to };
  return { type: "move", ...m };
};
const put = (sku: string, quantity: number, to: string, reference = "PO-1"): Step => {
  const p: Putaway = { id: `p${++n}`, reference, sku, quantity, to, topUp: false };
  return { type: "putaway", ...p };
};
const plan = (steps: Step[], unplaced: Plan["unplaced"] = []): Plan => ({
  moves: steps.filter((s) => s.type === "move") as Plan["moves"],
  putaways: steps.filter((s) => s.type === "putaway") as Plan["putaways"],
  unplaced,
  freedBins: [],
  steps,
});
const rules = (p: Plan, d: StoreData = data): Rule[] => validatePlan(d, p).map((x) => x.rule);

describe("validatePlan: a valid plan", () => {
  it("passes: merge X into S1, put the Medium delivery in M1", () => {
    const p = plan([move("X", 3, "S2", "S1"), put("Z", 6, "M1")]);
    expect(validatePlan(data, p)).toEqual([]);
  });

  it("an empty plan is valid when there is nothing incoming and nothing is mixed", () => {
    expect(validatePlan({ ...data, incoming: [] }, plan([]))).toEqual([]);
  });
});

describe("validatePlan: one failing plan per rule", () => {
  it("one product per bin: Y moved into the bin holding X", () => {
    const out = validatePlan(data, plan([move("Y", 2, "S3", "S1"), put("Z", 6, "M1")]));
    expect(out.map((x) => x.rule)).toContain("one-product-per-bin");
    const msg = out.find((x) => x.rule === "one-product-per-bin")!;
    expect(msg.bin).toBe("S1");
    expect(msg.message).toContain("X");
    expect(msg.message).toContain("Y");
  });

  it("one product per bin: a mixed bin the plan never fixes still fails", () => {
    const mixed: StoreData = {
      ...data,
      incoming: [],
      stock: [...data.stock, { bin: "S1", sku: "Y", quantity: 1, lastCounted: "2026-11-14" }],
    };
    expect(rules(plan([]), mixed)).toContain("one-product-per-bin");
  });

  it("capacity: 8 units into a bin of 10 that already holds 4", () => {
    const d = { ...data, stock: [...data.stock, { bin: "S4", sku: "X", quantity: 8, lastCounted: "2026-11-14" }] };
    const out = validatePlan(d, plan([move("X", 4, "S1", "S4"), put("Z", 6, "M1")]));
    expect(out.map((x) => x.rule)).toContain("capacity");
    expect(out.find((x) => x.rule === "capacity")!.message).toContain("12");
  });

  it("capacity: a bin already over capacity is not flagged again if it does not get worse", () => {
    const over: StoreData = {
      ...data,
      incoming: [],
      stock: [{ bin: "S1", sku: "X", quantity: 12, lastCounted: "2026-11-14" }],
    };
    expect(rules(plan([]), over)).not.toContain("capacity");
  });

  it("size class: a Medium product put in a Small bin", () => {
    const out = validatePlan(data, plan([move("X", 3, "S2", "S1"), put("Z", 6, "S4")]));
    expect(out.map((x) => x.rule)).toContain("size-class");
    expect(out.find((x) => x.rule === "size-class")!.message).toContain("Medium");
  });

  it("invalid bin code", () => {
    expect(rules(plan([move("X", 3, "S2", "Q9"), put("Z", 6, "M1")]))).toContain("unknown-bin");
  });

  it("unknown product", () => {
    expect(rules(plan([put("NOPE", 6, "M1")]))).toContain("unknown-product");
  });

  it("bad quantity: zero, negative and fractional", () => {
    for (const q of [0, -3, 1.5]) {
      expect(rules(plan([move("X", q, "S2", "S1"), put("Z", 6, "M1")]))).toContain("bad-quantity");
    }
  });

  it("a move that takes more than the bin holds", () => {
    const out = validatePlan(data, plan([move("X", 20, "S1", "S4"), put("Z", 6, "M1")]));
    expect(out.map((x) => x.rule)).toContain("insufficient-stock");
    expect(out.find((x) => x.rule === "insufficient-stock")!.message).toContain("only holds 4");
  });

  it("stock moved twice: S2 -> S1 then S1 -> S4", () => {
    const out = validatePlan(data, plan([move("X", 3, "S2", "S1"), move("X", 7, "S1", "S4"), put("Z", 6, "M1")]));
    expect(out.map((x) => x.rule)).toContain("chained-move");
  });

  it("stock moved twice is caught whatever the order", () => {
    const out = validatePlan(data, plan([move("X", 4, "S1", "S4"), move("X", 3, "S2", "S1"), put("Z", 6, "M1")]));
    expect(out.map((x) => x.rule)).toContain("chained-move");
  });

  it("locked bin: a delivery into a bin with unknown capacity", () => {
    const d: StoreData = { ...data, incoming: [{ ...data.incoming[0], sku: "X", quantity: 2 }] };
    const out = validatePlan(d, plan([put("X", 2, "U1")]));
    expect(out.map((x) => x.rule)).toContain("locked-bin-receipt");
  });

  it("locked bin: a bin already over capacity must not receive stock", () => {
    const d: StoreData = {
      ...data,
      stock: [
        { bin: "S1", sku: "X", quantity: 12, lastCounted: "2026-11-14" }, // over capacity -> locked
        { bin: "S2", sku: "X", quantity: 1, lastCounted: "2026-11-14" },
      ],
      incoming: [],
    };
    expect(rules(plan([move("X", 1, "S2", "S1")]), d)).toContain("locked-bin-receipt");
  });

  it("units lost: an incoming line that is neither placed nor reported unplaced", () => {
    const out = validatePlan(data, plan([move("X", 3, "S2", "S1")]));
    expect(out.map((x) => x.rule)).toContain("incoming-accounting");
    expect(out.find((x) => x.rule === "incoming-accounting")!.message).toContain("6 of 6");
  });

  it("more units placed than incoming", () => {
    expect(rules(plan([put("Z", 9, "M1")]))).toContain("incoming-accounting");
  });

  it("a putaway that names a reference not in the incoming list", () => {
    expect(rules(plan([put("Z", 6, "M1", "PO-9999")]))).toContain("incoming-accounting");
  });

  it("an unplaced line is accepted when reported", () => {
    const p = plan([], [{ reference: "PO-1", sku: "Z", quantity: 6, reason: "No empty Medium bin" }]);
    expect(validatePlan(data, p)).toEqual([]);
  });

  it("plan consistency: moves listed that are not in the steps", () => {
    const p = plan([put("Z", 6, "M1")]);
    p.moves = [{ id: "ghost", kind: "merge", sku: "X", quantity: 1, from: "S1", to: "S2" }];
    expect(rules(p)).toContain("plan-consistency");
  });
});

describe("validatePlan is independent of the solver", () => {
  it("checks a hand-written plan using only data and steps", () => {
    const handWritten: Plan = {
      moves: [],
      putaways: [],
      unplaced: [],
      freedBins: [],
      steps: [{ type: "putaway", id: "h1", reference: "PO-1", sku: "Z", quantity: 6, to: "M1", topUp: false }],
    };
    handWritten.putaways = [handWritten.steps[0] as unknown as Putaway];
    expect(validatePlan(data, handWritten)).toEqual([]);
  });
});

describe("applySteps", () => {
  it("applies moves and putaways in order", () => {
    const state = applySteps(data, [move("X", 3, "S2", "S1"), put("Z", 6, "M1")]);
    const nonEmpty = Object.fromEntries(
      [...state.entries()].filter(([, q]) => q > 0).map(([k, q]) => [k.replace("\u0000", "/"), q]),
    );
    expect(nonEmpty).toEqual({ "S1/X": 7, "S3/Y": 2, "M1/Z": 6 });
  });
});

describe("validatePlan on the real data", () => {
  const real = loadStore();
  it("rejects doing nothing: A-04-2 stays mixed and incoming is unaccounted for", () => {
    const out = validatePlan(real, plan([]));
    expect(out.map((x) => x.rule)).toContain("one-product-per-bin");
    expect(out.map((x) => x.rule)).toContain("incoming-accounting");
  });

  it("rejects putting the Bulk delivery into BULK-04 (unknown capacity)", () => {
    const p = plan([put("PK-CTN-BEN", 200, "BULK-04", "PO-4420")]);
    expect(rules(p, real)).toContain("locked-bin-receipt");
  });
});
