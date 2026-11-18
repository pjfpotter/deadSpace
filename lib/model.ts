// Shared types for the Fernbrook planning library.
// Everything here is plain data: no framework imports, so scripts, tests and
// server components can all use it. Only sanitised fields appear in these types.

export type SizeClass = "Small" | "Medium" | "Large" | "Bulk";

export const SIZE_CLASSES: SizeClass[] = ["Small", "Medium", "Large", "Bulk"];

export interface Bin {
  code: string; // e.g. "A-03-2" (aisle-bay-shelf) or "BULK-01"
  zone: string;
  size: SizeClass;
  capacity: number | null; // units; null = unknown (flagged)
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  size: SizeClass;
}

export interface StockRow {
  bin: string;
  sku: string;
  quantity: number;
  lastCounted: string; // ISO date
}

export interface IncomingLine {
  reference: string; // PO-xxxx or WO-xxxx
  expectedDate: string; // ISO date
  source: string; // "Supplier delivery" | "Production run"
  supplier: string; // company name only
  sku: string;
  quantity: number;
}

/** The sanitised store data the whole app plans from. */
export interface StoreData {
  bins: Bin[];
  products: Product[];
  stock: StockRow[];
  incoming: IncomingLine[];
}

export type FlagKind =
  | "mixed-bin"
  | "over-capacity"
  | "unknown-capacity"
  | "stale-count";

export interface Flag {
  id: string;
  kind: FlagKind;
  bin: string;
  detail: string; // what was found
  decision: string; // how the plan handles it
}

/** A move of existing stock from one bin to another. */
export interface Move {
  id: string;
  kind: "fix-mixed" | "merge";
  sku: string;
  quantity: number;
  from: string;
  to: string;
  /** Bin this move empties, if it frees one. */
  frees?: string;
}

/** Placing incoming stock into a bin. */
export interface Putaway {
  id: string;
  reference: string;
  sku: string;
  quantity: number;
  to: string;
  /** true when topping up a bin that already holds the product */
  topUp: boolean;
  /** Merge move that freed this bin, when the bin only became available after merges. */
  madeRoomBy?: string;
}

export interface Unplaced {
  reference: string;
  sku: string;
  quantity: number;
  reason: string;
}

export type Step =
  | ({ type: "move" } & Move)
  | ({ type: "putaway" } & Putaway);

export interface Plan {
  moves: Move[];
  putaways: Putaway[];
  unplaced: Unplaced[];
  freedBins: string[];
  /** Moves and putaways in an order where each step can be done when reached. */
  steps: Step[];
}

/** A bin's contents: one product at most is legal, more is a data problem. */
export interface BinContents {
  bin: string;
  items: { sku: string; quantity: number }[];
}
