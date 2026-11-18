# Business case: use the space Fernbrook already has

**One line:** Fernbrook doesn't need more space. Six merges (103 units) free five bins, all of next week's 534 incoming units then fit, and the plan saves about **£3,100 a year** against hiring overflow space, paying back in about **3 months**.

Fernbrook is invented, so every £ and m² figure here is an assumption. Counts, bins and the plan come from the sanitised count (14 Nov 2026) and are checked by the rules validator and by hand (`docs/hand-check.md`). Full workings, tables and sources are in `docs/baseline-assessment.md`. Each assumption is listed in its register at the end of that file.

## The problem

- The stores manager says the stores are "full". By units they are **48% full** (1,629 of 3,420 known units). Only 2 of 34 bins are empty, and 17 of the 32 bins in use are under half full.
- The dead space comes from splitting: **nine products** sit in two bins each, and one bin (`A-04-2`) mixes two products.
- Next week, two of six incoming lines don't fit: **58 of 534 units** (`WO-1032` tabletops and 18 of the `WO-1033` three-seat benches). Both are in-house production runs, so the shortfall would hold up finished goods.

## The options

| Option | What it means | £ a year | Verdict |
|---|---|---|---|
| Do nothing | Production runs wait for space | At risk: about £600 per lost production day, and two runs are exposed next week | Not acceptable |
| Hire overflow space | A 20 ft container on site all year (hire, racking, delivery, double handling) | **3,732** | Works, but pays for space already owned |
| Consolidate (this plan) | 6 moves, recount `B-03-2`, measure `BULK-04`, keep a weekly re-plan | **617** plus 852.50 once | **Recommended** |

## The numbers

| | Before | After the plan |
|---|---|---|
| Incoming units with nowhere to go | 58 | 0 |
| Empty bins | 2 | 3 after next week's receipts (7 after the merges alone) |
| Bins under half full | 17 | 8 |
| Products split across two bins | 9 | 4 |
| Mixed-product bins | 1 | 0 |
| Idle floor area (assumed, 62 m² stores) | 27.5 m² | 17.5 m² |

| Cost of the plan (assumed) | One-off £ | £ a year |
|---|---|---|
| 6 moves, recount, measure `BULK-04` (3 h at £17.50) | 52.50 | |
| Make the app production-ready (2 developer days) | 800 | |
| Hosting | | 192 |
| Monthly re-plan and count check (2 h a month) | | 420 |
| AI move wording | | 5 |
| **Total** | **852.50** | **617** |

| Result | £ |
|---|---|
| Net saving a year (3,732 − 617) | **3,115** |
| Payback on the one-off | about 3.3 months |
| Net benefit over 3 years | 8,492 |
| If the do-nothing cost is only half | 1,249 a year, payback about 8 months |

The case is conservative. Faster picking from fewer split bins, fewer delayed production runs and fixing the data problems are not counted.

## Success measure: stock turns

Stock turns (12-month sales ÷ average stock value at cost) are assumed to be about **13.0** today. The target is **13.6** within six months from consolidation alone, because one location per product lets reorders use the true total. That releases about £1,620 of cash and saves about £324 a year in carrying cost. It only counts as a success if sales hold, out-of-stock lines don't increase, no production run is held for space, and at least 3 empty bins remain after receipts. Moving stock does not change its value, so the gain is a hypothesis to test against monthly counts.

## Risks and what we say about them

- **The plan is rules-checked and hand-verified, not proven optimal.** It is a greedy plan. A solver could find a plan with fewer moves.
- **£ and m² are assumptions.** Swap in Fernbrook's own rent, labour and container costs before relying on them. The sources are real UK 2026 market rates, listed in the baseline doc.
- **Capacity is counted in units.** That is the brief's simplification. A bench takes more room than a box of screws, so square metres are shown for information only and never change the plan.
- **Three data problems are worked around, not fixed.** `B-03-2` is over capacity and needs a recount. `BULK-04` has no capacity recorded and needs measuring (its bubble-wrap rolls could be up to four times what the bay holds). Eleven bins were last counted a week before the newest count.
- **Unit costs are dropped at ingest** (`docs/data-minimisation.md`), so stock values here are assumed. Only per-category totals should ever be published.

## Next steps for Fernbrook

1. Do the six moves in the order on the floor checklist before the 24 Nov deliveries.
2. Recount `B-03-2`, measure `BULK-04`, and record both capacities.
3. Re-plan weekly from a fresh count, and use the fit check before agreeing to any new order.
4. Track stock turns monthly against the guardrails above.
