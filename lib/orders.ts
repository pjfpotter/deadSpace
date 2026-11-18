import { parseCsv } from "./csv";
import type { Order, Product } from "./model";

/**
 * Keep/drop decision for each column of the late customer-orders CSV.
 * Used by the ingest and written into docs/data-minimisation.md.
 */
export const ORDERS_POLICY: Record<string, { keep: boolean; why: string }> = {
  order_ref: { keep: true, why: "Identifies the order on the plan and in the pitch." },
  customer: {
    keep: true,
    why: "Kept only because it is already a pseudonymous label (for example \"Customer 14\"); a real name or contact would be dropped.",
  },
  delivery_date: { keep: true, why: "Decides when the stock leaves the stores." },
  sku: { keep: true, why: "Product ordered; links to its size class." },
  quantity: { keep: true, why: "Units that leave the stores." },
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Parse and validate the orders CSV. Throws a message naming the row on the first
 * problem, so nothing is written for a bad file.
 */
export function parseOrders(text: string, products: Pick<Product, "sku">[]): Order[] {
  const first = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  const header = first.split(",").map((h) => h.trim());
  const unknown = header.filter((h) => !(h in ORDERS_POLICY));
  if (unknown.length) throw new Error(`orders: no keep/drop decision for column(s): ${unknown.join(", ")}`);
  const missing = Object.keys(ORDERS_POLICY).filter((h) => !header.includes(h));
  if (missing.length) throw new Error(`orders: missing column(s): ${missing.join(", ")}`);

  const skus = new Set(products.map((p) => p.sku));
  const seen = new Set<string>();
  return parseCsv(text).map((r, i) => {
    const row = `orders row ${i + 2} (${r.order_ref || "no ref"})`;
    if (!r.order_ref) throw new Error(`${row}: missing order_ref`);
    if (seen.has(r.order_ref)) throw new Error(`${row}: duplicate order_ref`);
    seen.add(r.order_ref);
    if (!skus.has(r.sku)) throw new Error(`${row}: unknown SKU "${r.sku}"`);
    if (!isIsoDate(r.delivery_date)) throw new Error(`${row}: bad delivery_date "${r.delivery_date}" (use YYYY-MM-DD)`);
    const quantity = Number(r.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`${row}: quantity "${r.quantity}" must be a whole number above zero`);
    }
    return {
      orderRef: r.order_ref,
      customerLabel: r.customer,
      deliveryDate: r.delivery_date,
      sku: r.sku,
      quantity,
    };
  });
}
