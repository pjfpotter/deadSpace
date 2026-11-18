/**
 * Ingest for the late customer orders (docs/spec-update/warehouse_extra_orders.csv).
 * The file is committed (it holds only order refs, pseudonymous customer labels,
 * dates, SKUs and quantities), so this step does not need the gitignored data/ folder.
 * Writes fixtures/orders.json, or throws naming the bad row and writes nothing.
 *
 * Run: npm run ingest:orders   (npm run ingest also calls it)
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Order, Product } from "../lib/model";
import { parseOrders } from "../lib/orders";

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "docs", "spec-update", "warehouse_extra_orders.csv");
const OUT = path.join(ROOT, "fixtures", "orders.json");
const PRODUCTS = path.join(ROOT, "fixtures", "products.json");

export function ingestOrders(): Order[] {
  const products = JSON.parse(readFileSync(PRODUCTS, "utf8")) as Product[];
  const orders = parseOrders(readFileSync(SOURCE, "utf8"), products);
  writeFileSync(OUT, JSON.stringify(orders, null, 2) + "\n");
  console.log(`Wrote fixtures/orders.json: ${orders.length} orders.`);
  return orders;
}

if (require.main === module) ingestOrders();
