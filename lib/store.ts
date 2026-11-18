import binsJson from "@/fixtures/bins.json";
import incomingJson from "@/fixtures/incoming.json";
import productsJson from "@/fixtures/products.json";
import stockJson from "@/fixtures/stock.json";
import type { Bin, StockRow, StoreData } from "./model";

/** Sanitised store data, as written by scripts/ingest.ts. */
export function loadStore(): StoreData {
  return {
    bins: binsJson as StoreData["bins"],
    products: productsJson as StoreData["products"],
    stock: stockJson as StoreData["stock"],
    incoming: incomingJson as StoreData["incoming"],
  };
}

/** Stock rows grouped by bin code. */
export function stockByBin(stock: StockRow[]): Map<string, StockRow[]> {
  const map = new Map<string, StockRow[]>();
  for (const row of stock) {
    const list = map.get(row.bin) ?? [];
    list.push(row);
    map.set(row.bin, list);
  }
  return map;
}

/** Total units in a bin across all products. */
export function unitsInBin(rows: StockRow[] | undefined): number {
  return (rows ?? []).reduce((sum, r) => sum + r.quantity, 0);
}

export function binMap(bins: Bin[]): Map<string, Bin> {
  return new Map(bins.map((b) => [b.code, b]));
}
