# Proposal

## Why

The organiser has sent a late brief (`docs/spec-update/WAREHOUSE_UPDATE.pdf`, 18 Nov 12:00): Fernbrook has won three customer orders for early December (`warehouse_extra_orders.csv`). The 40 extra 2-seat benches (`FG-BEN-2S`, CO-8801) "come off the line in the weeks after" the production runs already on the Incoming list. They want to know: can the stores hold them (working shown, bench never in a small-goods bin); if not, what has to give, in what order; and what we are unsure about. "Don't just say yes or no."

A first hand check says it does not simply fit. After the existing plan, Large has 6 bins and all 6 are used (2S in 1, 3S in 2, table, folding chair and planter in 1 each). Holding the 40 new benches on top of the 29 on hand needs 3 bins for 2S alone, so about 8 Large bins at the peak against 6. The answer depends on dates and on what ships when, which the current app cannot model because it only looks at one moment in time.

## What Changes

- Add the three customer orders to the repo (`docs/spec-update/`) and ingest them as a new sanitised fixture. They are outbound orders (customer, delivery date, SKU, quantity), not receipts.
- Add a dated view of the stores: stock on hand, receipts (existing Incoming list plus the 40 benches) and dispatches (the three orders), so we can see bin demand per size class on each date and the peak.
- Add a capacity answer for the December orders: bins needed vs bins available per size class and per day, with the working shown (units, bin capacity, bins = ceil(units / capacity), one product per bin, size class must match).
- When the peak does not fit, produce an ordered list of "what has to give" with the bins each step frees and the bins still short after it. Least disruptive first: existing merges, dispatch early, stagger or cross-dock the benches, then rule or layout changes that need a decision.
- Add an assumptions and unknowns register shown beside the answer: each number or rule relied on, its source, and what changes if it is wrong.
- Extend the pitch evidence with the worked December answer.

Out of scope: renting space, changing bin sizes physically, per-product dimensions, using movement history to forecast other demand, and re-running the whole plan from edited data in the browser.

## Capabilities

### New Capabilities
- `extra-orders-ingest`: Brings the late customer orders into the sanitised fixtures and treats them as dated outbound demand, with the bench production arrival date as an explicit input.
- `capacity-timeline`: Computes units and bins needed per size class per date from stock, receipts and dispatches, finds the peak and shows the working.
- `make-room-options`: When the peak does not fit, proposes an ordered, validated list of levers (merge, dispatch early, stagger or cross-dock, rule change) with bins freed and bins still short.
- `assumptions-register`: Lists every assumption and unknown behind the answer with its effect, and lets the user vary the key ones (bench arrival date, dispatch lead time).

### Modified Capabilities
<!-- None: openspec/specs is empty until warehouse-dead-space is archived; the existing plan, validator and fit check are reused unchanged. -->

## Impact

- **New code:** `lib/timeline.ts` (dated stock, receipts, dispatches, bins needed), `lib/make-room.ts` (levers), `app/december/page.tsx` and a small client component for the two adjustable assumptions, tests, and ingest support for the new CSV.
- **Reused unchanged:** `lib/solve-greedy.ts`, `lib/validate.ts`, `lib/apply.ts`, `lib/fit.ts`, flags and fixtures. The existing plan is the baseline; the new answer builds on its end state.
- **Data and privacy:** the CSV has a `customer` column ("Customer 14"). Keep only a pseudonymous label, order ref, date, SKU and quantity; update `docs/data-minimisation.md`.
- **Docs:** `docs/spec-update/` (brief and CSV), `docs/pitch-evidence.md` gains the December answer.
