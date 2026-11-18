import { describe, expect, it } from "vitest";
import { templateInstruction } from "./instructions";
import type { Step } from "./model";
import { loadTicks, planHash, progressKey, saveTicks, type MinimalStorage } from "./progress";
import { solve } from "./solve";
import { loadStore } from "./store";

const data = loadStore();
const plan = solve(data);
const name = (sku: string) => data.products.find((p) => p.sku === sku)?.name ?? sku;
const dueOf = (ref: string) => data.incoming.find((l) => l.reference === ref)?.expectedDate;

function fakeStorage(initial: Record<string, string> = {}): MinimalStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}
const blocked: MinimalStorage = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
  removeItem() { throw new Error("SecurityError"); },
};

describe("templateInstruction", () => {
  it("names the product, quantity and both bins for every step in the real plan", () => {
    for (const s of plan.steps) {
      const text = templateInstruction(s, name, { dueDate: s.type === "putaway" ? dueOf(s.reference) : undefined });
      expect(text, s.id).toContain(String(s.quantity));
      expect(text, s.id).toContain(name(s.sku));
      expect(text, s.id).toContain(s.to);
      if (s.type === "move") expect(text, s.id).toContain(s.from);
      else expect(text, s.id).toContain(s.reference);
    }
  });

  it("mentions only bin codes that belong to the step", () => {
    const binCodes = new Set(data.bins.map((b) => b.code));
    for (const s of plan.steps) {
      const text = templateInstruction(s, name);
      const mentioned = text.match(/\b(?:[ABC]-\d\d-\d|BULK-\d\d)\b/g) ?? [];
      const allowed = new Set<string>([s.to, ...(s.type === "move" ? [s.from, ...(s.frees ? [s.frees] : [])] : [])]);
      for (const m of mentioned) {
        expect(binCodes.has(m)).toBe(true);
        expect(allowed.has(m), `${s.id} mentions ${m}`).toBe(true);
      }
    }
  });

  it("says which step must be done first when a putaway needs a freed bin", () => {
    const p = plan.putaways.find((x) => x.madeRoomBy)!;
    const text = templateInstruction({ type: "putaway", ...p }, name);
    expect(text).toContain(`Do step ${p.madeRoomBy} first`);
  });

  it("explains the mixed-bin fix", () => {
    const m = plan.moves[0];
    expect(templateInstruction({ type: "move", ...m }, name)).toMatch(/it holds two products/);
  });
});

describe("planHash", () => {
  it("is stable for the same plan and different for a different plan", () => {
    expect(planHash(plan.steps)).toBe(planHash(solve(data).steps));
    const changed: Step[] = plan.steps.map((s, i) => (i === 0 ? { ...s, quantity: s.quantity + 1 } : s));
    expect(planHash(changed)).not.toBe(planHash(plan.steps));
  });
});

describe("progress storage", () => {
  const ids = plan.steps.map((s) => s.id);
  const hash = planHash(plan.steps);

  it("round-trips ticks", () => {
    const st = fakeStorage();
    expect(saveTicks(st, hash, new Set(["M1", "P2", "M3"]))).toBe(true);
    expect([...loadTicks(st, hash, ids)].sort()).toEqual(["M1", "M3", "P2"]);
  });

  it("starts empty when nothing is saved", () => {
    expect(loadTicks(fakeStorage(), hash, ids).size).toBe(0);
  });

  it("ignores ticks saved for a different plan", () => {
    const st = fakeStorage();
    saveTicks(st, "deadbeef", new Set(["M1", "M2"]));
    expect(loadTicks(st, hash, ids).size).toBe(0);
    expect(progressKey("deadbeef")).not.toBe(progressKey(hash));
  });

  it("drops saved ids that are no longer in the plan", () => {
    const st = fakeStorage({ [progressKey(hash)]: JSON.stringify(["M1", "GONE", 7]) });
    expect([...loadTicks(st, hash, ids)]).toEqual(["M1"]);
  });

  it("survives corrupt data", () => {
    for (const bad of ["not json", "{}", "null", '"x"']) {
      expect(loadTicks(fakeStorage({ [progressKey(hash)]: bad }), hash, ids).size).toBe(0);
    }
  });

  it("does not throw and reports failure when storage is blocked or missing", () => {
    expect(loadTicks(blocked, hash, ids).size).toBe(0);
    expect(saveTicks(blocked, hash, new Set(["M1"]))).toBe(false);
    expect(loadTicks(null, hash, ids).size).toBe(0);
    expect(saveTicks(null, hash, new Set(["M1"]))).toBe(false);
  });
});
