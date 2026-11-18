import type { SizeClass } from "./model";

/**
 * ASSUMED space figures. The data has no product or bin dimensions, so these are
 * illustrative and live here, in one editable place. They never affect the plan:
 * all merges and putaway use capacity in units.
 */
export const SPACE_PER_UNIT_M3: Record<SizeClass, number> = {
  Small: 0.0025,
  Medium: 0.02,
  Large: 0.15,
  Bulk: 0.01,
};

/** Assumed usable volume of one bin per size class, in m³ (about 83% packing at full unit capacity). */
export const BIN_VOLUME_M3: Record<SizeClass, number> = {
  Small: 0.36,
  Medium: 1.44,
  Large: 5.35,
  Bulk: 3.6,
};
