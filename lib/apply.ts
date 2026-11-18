import type { Step, StockRow, StoreData } from "./model";
import { applySteps } from "./validate";

/** Stock rows (non-empty bin/product pairs) after applying `steps` to the latest count. */
export function stockAfter(data: StoreData, steps: Step[]): StockRow[] {
  const out: StockRow[] = [];
  for (const [k, quantity] of applySteps(data, steps)) {
    if (quantity <= 0) continue;
    const [bin, sku] = k.split("\u0000");
    out.push({ bin, sku, quantity, lastCounted: "planned" });
  }
  return out.sort((a, b) => a.bin.localeCompare(b.bin) || a.sku.localeCompare(b.sku));
}
