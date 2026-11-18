// Tests added after checking our work against an outside review (Copilot).
// Each describe block names the criticism it answers. See docs/review-response.md.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import type { Move, Plan, Step, StoreData } from "./model";
import { loadTicks, planHash, progressKey, type MinimalStorage } from "./progress";
import { solveGreedy } from "./solve-greedy";
import { loadStore } from "./store";
import { applySteps, validatePlan, type Rule } from "./validate";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");
const readJson = (f: string) => JSON.parse(readFileSync(path.join(FIXTURES, f), "utf8")) as Record<string, unknown>[];

// ---------------------------------------------------------------------------
// A small store for hand-written plans
// ---------------------------------------------------------------------------
const small: StoreData = {
  bins: [
    { code: "S1", zone: "z", size: "Small", capacity: 10 },
    { code: "S2", zone: "z", size: "Small", capacity: 10 },
    { code: "S3", zone: "z", size: "Small", capacity: 10 },
    { code: "S4", zone: "z", size: "Small", capacity: 10 },
  ],
  products: [
    { sku: "X", name: "Thing X", category: "c", size: "Small" },
    { sku: "Y", name: "Thing Y", category: "c", size: "Small" },
  ],
  stock: [
    { bin: "S1", sku: "X", quantity: 4, lastCounted: "2026-11-14" },
    { bin: "S2", sku: "Y", quantity: 3, lastCounted: "2026-11-14" },
    { bin: "S3", sku: "X", quantity: 2, lastCounted: "2026-11-14" },
  ],
  incoming: [],
};
let n = 0;
const move = (sku: string, quantity: number, from: string, to: string): Step => {
  const m: Move = { id: `m${++n}`, kind: "merge", sku, quantity, from, to };
  return { type: "move", ...m };
};
const plan = (steps: Step[], unplaced: Plan["unplaced"] = []): Plan => ({
  moves: steps.filter((s) => s.type === "move") as Plan["moves"],
  putaways: steps.filter((s) => s.type === "putaway") as Plan["putaways"],
  unplaced,
  freedBins: [],
  steps,
});
const rules = (p: Plan, d: StoreData = small): Rule[] => validatePlan(d, p).map((x) => x.rule);

// ---------------------------------------------------------------------------
describe("review 2: moves must be valid in the order they are done, not just at the end", () => {
  it("rejects filling a bin before the move that empties it (final state looks fine)", () => {
    // S2 holds 3 Y. Moving X into S2 first makes it hold two products until Y leaves.
    const wrongOrder = plan([move("X", 2, "S3", "S2"), move("Y", 3, "S2", "S4")]);
    expect(rules(wrongOrder)).toContain("one-product-per-bin");
  });

  it("accepts the same two moves in the right order", () => {
    const rightOrder = plan([move("Y", 3, "S2", "S4"), move("X", 2, "S3", "S2")]);
    expect(rules(rightOrder)).toEqual([]);
  });
});

describe("review 3: chained and shared-destination moves", () => {
  it("rejects A -> B then B -> C for one product", () => {
    expect(rules(plan([move("X", 4, "S1", "S4"), move("X", 4, "S4", "S2")]))).toContain("chained-move");
  });

  it("accepts A -> B and C -> B (two sources into one destination)", () => {
    // S1 (4 X) and S3 (2 X) both into S4: 6 <= 10, one product, nothing chained.
    expect(rules(plan([move("X", 4, "S1", "S4"), move("X", 2, "S3", "S4")]))).toEqual([]);
  });

  it("lets a different product reuse a bin that was emptied (this is how freed bins get used)", () => {
    // Y leaves S2, then X arrives in S2. Not 'chained': different products.
    expect(rules(plan([move("Y", 3, "S2", "S4"), move("X", 2, "S3", "S2")]))).toEqual([]);
  });
});

describe("review 2: integer safety", () => {
  const bad = [0, -1, 0.1, NaN, Infinity, -Infinity];
  it.each(bad)("rejects a move of %s units", (q) => {
    expect(rules(plan([move("X", q, "S1", "S4")]))).toContain("bad-quantity");
  });

  it("rejects a huge quantity the bin does not hold", () => {
    expect(rules(plan([move("X", 999_999_999, "S1", "S4")]))).toContain("insufficient-stock");
  });

  it("rejects 999 units into a bin of capacity 10", () => {
    const data: StoreData = { ...small, stock: [{ bin: "S1", sku: "X", quantity: 999, lastCounted: "2026-11-14" }] };
    expect(rules(plan([move("X", 999, "S1", "S4")]), data)).toContain("capacity");
  });
});

describe("review 2: conservation of stock", () => {
  it("every product ends with what it started with plus what was put away, on the real data", () => {
    const data = loadStore();
    const p = solveGreedy(data);
    const total = (rows: { sku: string; quantity: number }[], sku: string) =>
      rows.filter((r) => r.sku === sku).reduce((s, r) => s + r.quantity, 0);
    const after = [...applySteps(data, p.steps)].map(([k, quantity]) => ({ sku: k.split("\u0000")[1], quantity }));
    for (const prod of data.products) {
      const placed = p.putaways.filter((x) => x.sku === prod.sku).reduce((s, x) => s + x.quantity, 0);
      expect(total(after, prod.sku), prod.sku).toBe(total(data.stock, prod.sku) + placed);
    }
  });
});

describe("review 4: extreme over-capacity bin", () => {
  it("keeps the stock, receives nothing and does not crash", () => {
    const data: StoreData = {
      bins: [
        { code: "S1", zone: "z", size: "Small", capacity: 60 },
        { code: "S2", zone: "z", size: "Small", capacity: 60 },
      ],
      products: [{ sku: "X", name: "X", category: "c", size: "Small" }],
      stock: [{ bin: "S1", sku: "X", quantity: 1000, lastCounted: "2026-11-14" }],
      incoming: [{ reference: "PO-1", expectedDate: "2026-11-24", source: "Supplier delivery", supplier: "A", sku: "X", quantity: 30 }],
    };
    const p = solveGreedy(data);
    expect(validatePlan(data, p)).toEqual([]);
    expect(p.putaways.every((x) => x.to !== "S1")).toBe(true);
    const after = applySteps(data, p.steps);
    expect(after.get("S1\u0000X")).toBe(1000);
  });
});

describe("review 6: determinism does not depend on input order", () => {
  function shuffled<T>(items: T[], seed: number): T[] {
    const a = [...items];
    let s = seed >>> 0;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  it("gives the same plan when bins, products, stock and incoming are reordered", () => {
    const data = loadStore();
    const base = planHash(solveGreedy(data).steps);
    for (let seed = 1; seed <= 25; seed++) {
      const d: StoreData = {
        bins: shuffled(data.bins, seed),
        products: shuffled(data.products, seed + 1),
        stock: shuffled(data.stock, seed + 2),
        incoming: shuffled(data.incoming, seed + 3),
      };
      expect(planHash(solveGreedy(d).steps), `seed ${seed}`).toBe(base);
    }
  });

  it("gives the same plan on 100 repeat runs", () => {
    const data = loadStore();
    const base = JSON.stringify(solveGreedy(data));
    for (let i = 0; i < 100; i++) expect(JSON.stringify(solveGreedy(data))).toBe(base);
  });
});

describe("review 1: data minimisation is an allow-list, not a deny-list", () => {
  const allowed: Record<string, string[]> = {
    "bins.json": ["capacity", "code", "size", "zone"],
    "products.json": ["category", "name", "size", "sku"],
    "stock.json": ["bin", "lastCounted", "quantity", "sku"],
    "incoming.json": ["expectedDate", "quantity", "reference", "sku", "source", "supplier"],
  };
  it.each(Object.keys(allowed))("%s has exactly the approved fields on every row", (file) => {
    for (const row of readJson(file)) expect(Object.keys(row).sort()).toEqual(allowed[file]);
  });

  it.each(Object.keys(allowed))("%s contains no email, phone, postcode or URL pattern", (file) => {
    const raw = readFileSync(path.join(FIXTURES, file), "utf8");
    const patterns: [string, RegExp][] = [
      ["email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ["UK mobile", /\b(?:\+44\s?7|07)\d{3}\s?\d{6}\b/],
      ["UK postcode", /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/],
      ["URL", /https?:\/\/|www\./i],
    ];
    for (const [label, re] of patterns) expect(re.test(raw), `${file} looks like it contains a ${label}`).toBe(false);
  });

  it("no raw CSV or data/ file is tracked by git", () => {
    const tracked = execSync("git ls-files", { cwd: path.resolve(__dirname, "..") }).toString().split("\n");
    // One exception: the organiser's late customer orders (docs/spec-update), which hold only
    // order refs, pseudonymous "Customer NN" labels, dates, SKUs and quantities (checked below).
    const allowed = new Set(["docs/spec-update/warehouse_extra_orders.csv"]);
    expect(tracked.filter((f) => (f.endsWith(".csv") && !allowed.has(f)) || f.startsWith("data/"))).toEqual([]);
  });

  it("the one committed CSV has only the expected columns and pseudonymous customer labels", () => {
    const raw = readFileSync(path.resolve(__dirname, "..", "docs", "spec-update", "warehouse_extra_orders.csv"), "utf8");
    expect(raw.split(/\r?\n/, 1)[0]).toBe("order_ref,customer,delivery_date,sku,quantity");
    for (const row of parseCsv(raw)) expect(row.customer).toMatch(/^Customer \d+$/);
  });
});

describe("review 8: saved progress", () => {
  const ids = ["M1", "M2"];
  const store = (value: string): MinimalStorage => ({
    getItem: () => value,
    setItem: () => undefined,
    removeItem: () => undefined,
  });
  it("ignores a wrong-shaped saved value such as {done:[ALL]}", () => {
    for (const bad of ['{"done":["ALL"]}', '["ALL"]', "[1,2]", '[["M1"]]']) {
      expect(loadTicks(store(bad), "abc", ids).size, bad).toBe(0);
    }
  });
  it("keys progress on plan content, not step count", () => {
    const a = plan([move("X", 4, "S1", "S4")]).steps;
    const b = plan([move("X", 4, "S1", "S3")]).steps; // same length, different destination
    const c = a.map((s) => ({ ...s })); // same content
    expect(a).toHaveLength(b.length);
    expect(planHash(a)).not.toBe(planHash(b));
    expect(planHash(a)).toBe(planHash(c));
    expect(progressKey(planHash(a))).not.toBe(progressKey(planHash(b)));
  });
});
