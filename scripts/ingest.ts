/**
 * Ingest: the ONLY code that reads the raw CSVs in data/ (gitignored).
 * Keeps just the columns the plan needs, writes sanitised JSON to fixtures/
 * (committed), and writes docs/data-minimisation.md (kept/dropped/why).
 *
 * Every raw column must have an explicit decision below. An unknown column
 * stops the run, so new personal data can never slip through by default.
 *
 * Run: npm run ingest
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { csvHeader, parseCsv } from "../lib/csv";
import type {
  Bin,
  IncomingLine,
  Product,
  SizeClass,
  StockRow,
} from "../lib/model";

const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data");
const OUT = path.join(ROOT, "fixtures");
const DOC = path.join(ROOT, "docs", "data-minimisation.md");

type Decision = { keep: boolean; why: string };

const POLICY: Record<string, Record<string, Decision>> = {
  "bins.csv": {
    bin_code: { keep: true, why: "Identifies the bin; needed for every move." },
    zone: { keep: true, why: "Human-readable location for the floor view." },
    bin_size: { keep: true, why: "Size class must match the product (store rule 4)." },
    capacity_units: { keep: true, why: "Capacity in units (store rule 2). Blank means unknown and is flagged." },
  },
  "products.csv": {
    sku: { keep: true, why: "Product code; links stock, incoming and moves." },
    name: { keep: true, why: "Shown on the plan so staff recognise the product." },
    category: { keep: true, why: "Grouping for display." },
    bin_size: { keep: true, why: "Size class must match the bin (store rule 4)." },
    unit_cost_gbp: { keep: false, why: "Not needed: the plan is about space, not value." },
    reorder_point: { keep: false, why: "Only needed for the run-out stretch goal (not in the MVP)." },
    reorder_qty: { keep: false, why: "Not needed for consolidation or putaway." },
    supplier: { keep: false, why: "Supplier name is already on the incoming list where it is needed." },
    supplier_contact_email: { keep: false, why: "Personal/contact data; never needed." },
    supplier_contact_mobile: { keep: false, why: "Personal/contact data; never needed." },
  },
  "stock.csv": {
    bin_code: { keep: true, why: "Which bin holds the stock." },
    sku: { keep: true, why: "Which product is in the bin." },
    quantity: { keep: true, why: "Units counted; the count is treated as truth." },
    last_counted: { keep: true, why: "Used to flag counts that are out of date." },
    counted_by: { keep: false, why: "Staff name; personal data and not needed." },
    counter_personal_mobile: { keep: false, why: "Personal mobile number; never needed." },
    counter_home_address: { keep: false, why: "Home address; never needed." },
  },
  "incoming.csv": {
    reference: { keep: true, why: "PO or work-order number staff look for on delivery." },
    expected_date: { keep: true, why: "Orders the putaway plan." },
    source: { keep: true, why: "Supplier delivery or production run." },
    supplier: { keep: true, why: "Company name only (no contact details); shown on the plan." },
    sku: { keep: true, why: "Product being received." },
    quantity: { keep: true, why: "Units to place." },
  },
  "movements.csv": {
    movement_id: { keep: false, why: "File not used in the MVP." },
    date: { keep: false, why: "File not used in the MVP (history only feeds the stretch goals)." },
    type: { keep: false, why: "File not used in the MVP." },
    sku: { keep: false, why: "File not used in the MVP." },
    quantity: { keep: false, why: "File not used in the MVP." },
    from_bin: { keep: false, why: "File not used in the MVP." },
    to_bin: { keep: false, why: "File not used in the MVP." },
    reference: { keep: false, why: "File not used in the MVP." },
    picked_by: { keep: false, why: "Staff name; personal data and not needed." },
    picker_personal_mobile: { keep: false, why: "Personal mobile number; never needed." },
  },
};

const SIZES: SizeClass[] = ["Small", "Medium", "Large", "Bulk"];

function size(value: string, ctx: string): SizeClass {
  if (!SIZES.includes(value as SizeClass)) throw new Error(`Bad size "${value}" in ${ctx}`);
  return value as SizeClass;
}

function num(value: string, ctx: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Bad number "${value}" in ${ctx}`);
  return n;
}

function readRaw(file: string) {
  const text = readFileSync(path.join(RAW, file), "utf8");
  const header = csvHeader(text);
  const policy = POLICY[file];
  const unknown = header.filter((h) => !(h in policy));
  if (unknown.length) {
    throw new Error(`${file}: no keep/drop decision for column(s): ${unknown.join(", ")}`);
  }
  return { header, rows: parseCsv(text) };
}

function main() {
  mkdirSync(OUT, { recursive: true });

  const bins: Bin[] = readRaw("bins.csv").rows.map((r) => ({
    code: r.bin_code,
    zone: r.zone,
    size: size(r.bin_size, `bins ${r.bin_code}`),
    capacity: r.capacity_units === "" ? null : num(r.capacity_units, `bins ${r.bin_code}`),
  }));

  const products: Product[] = readRaw("products.csv").rows.map((r) => ({
    sku: r.sku,
    name: r.name,
    category: r.category,
    size: size(r.bin_size, `products ${r.sku}`),
  }));

  const stock: StockRow[] = readRaw("stock.csv").rows.map((r) => ({
    bin: r.bin_code,
    sku: r.sku,
    quantity: num(r.quantity, `stock ${r.bin_code}`),
    lastCounted: r.last_counted,
  }));

  const incoming: IncomingLine[] = readRaw("incoming.csv").rows.map((r) => ({
    reference: r.reference,
    expectedDate: r.expected_date,
    source: r.source,
    supplier: r.supplier,
    sku: r.sku,
    quantity: num(r.quantity, `incoming ${r.reference}`),
  }));

  // Movements are validated against the policy (so unknown columns still stop the run)
  // but nothing from them is written.
  const movements = readRaw("movements.csv");

  const write = (name: string, data: unknown) =>
    writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + "\n");
  write("bins.json", bins);
  write("products.json", products);
  write("stock.json", stock);
  write("incoming.json", incoming);

  writeDoc({ "bins.csv": bins.length, "products.csv": products.length, "stock.csv": stock.length, "incoming.csv": incoming.length, "movements.csv": movements.rows.length });

  console.log(
    `Wrote fixtures/: ${bins.length} bins, ${products.length} products, ${stock.length} stock rows, ${incoming.length} incoming lines. Movements (${movements.rows.length} rows) not used.`,
  );
}

function writeDoc(rowCounts: Record<string, number>) {
  const lines: string[] = [
    "# Data minimisation",
    "",
    "We only use the data the plan needs. This table is generated by `scripts/ingest.ts` from its keep/drop policy; do not edit it by hand.",
    "",
    "- The raw CSVs live in `data/`, which is gitignored and never committed or deployed.",
    "- Only the sanitised JSON in `fixtures/` reaches the app, the repository or any AI tool.",
    "- An unknown column stops the ingest, so new personal data cannot be kept by default.",
    "",
  ];
  let kept = 0;
  let dropped = 0;
  for (const [file, cols] of Object.entries(POLICY)) {
    lines.push(`## ${file} (${rowCounts[file]} rows)`, "", "| Column | Decision | Why |", "|---|---|---|");
    for (const [col, d] of Object.entries(cols)) {
      lines.push(`| \`${col}\` | ${d.keep ? "Kept" : "Dropped"} | ${d.why} |`);
      if (d.keep) kept++;
      else dropped++;
    }
    lines.push("");
  }
  lines.push(`**Summary:** ${kept} columns kept, ${dropped} dropped. No names, phone numbers, home addresses or contact details are kept.`, "");
  mkdirSync(path.dirname(DOC), { recursive: true });
  writeFileSync(DOC, lines.join("\n"));
}

main();
