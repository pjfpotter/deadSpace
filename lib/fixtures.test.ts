import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");
const files = readdirSync(FIXTURES).filter((f) => f.endsWith(".json"));

const FORBIDDEN_KEYS = [
  "counted_by",
  "countedBy",
  "counter_personal_mobile",
  "counter_home_address",
  "picked_by",
  "pickedBy",
  "picker_personal_mobile",
  "supplier_contact_email",
  "supplier_contact_mobile",
  "unit_cost_gbp",
  "mobile",
  "email",
  "address",
];

const FORBIDDEN_TEXT = [/Priory/i, /Castle Hill/i, /07700/, /@example\./i, /Bexhill/i, /St Leonards/i];

function keysOf(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => keysOf(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keysOf(v, out);
    }
  }
  return out;
}

describe("sanitised fixtures", () => {
  it("has the four expected fixture files", () => {
    expect(files.sort()).toEqual(["bins.json", "incoming.json", "products.json", "stock.json"]);
  });

  it.each(files)("%s contains no personal or unneeded fields", (file) => {
    const raw = readFileSync(path.join(FIXTURES, file), "utf8");
    const keys = keysOf(JSON.parse(raw));
    for (const bad of FORBIDDEN_KEYS) expect(keys.has(bad), `${file} has key ${bad}`).toBe(false);
    for (const re of FORBIDDEN_TEXT) expect(re.test(raw), `${file} matches ${re}`).toBe(false);
  });

  it("stock keeps only bin, sku, quantity and count date", () => {
    const stock = JSON.parse(readFileSync(path.join(FIXTURES, "stock.json"), "utf8"));
    for (const row of stock) {
      expect(Object.keys(row).sort()).toEqual(["bin", "lastCounted", "quantity", "sku"]);
    }
  });

  it("products keep only sku, name, category and size", () => {
    const products = JSON.parse(readFileSync(path.join(FIXTURES, "products.json"), "utf8"));
    for (const p of products) {
      expect(Object.keys(p).sort()).toEqual(["category", "name", "size", "sku"]);
    }
  });

  it("keeps BULK-04 capacity as null (unknown), not a guess", () => {
    const bins = JSON.parse(readFileSync(path.join(FIXTURES, "bins.json"), "utf8"));
    expect(bins.find((b: { code: string }) => b.code === "BULK-04").capacity).toBeNull();
  });
});

describe("parseCsv", () => {
  it("handles quoted commas, escaped quotes, CRLF and blank capacity", () => {
    const rows = parseCsv('a,b,c\r\n1,"x, y",\r\n2,"say ""hi""",z\r\n');
    expect(rows).toEqual([
      { a: "1", b: "x, y", c: "" },
      { a: "2", b: 'say "hi"', c: "z" },
    ]);
  });
});
