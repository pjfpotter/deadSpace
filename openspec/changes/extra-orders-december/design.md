# Design

## Context

The existing app (`warehouse-dead-space`) plans one moment in time: the latest count plus next week's six Incoming lines, with merges first. It ends with Large at 6 of 6 bins used and 116 of 180 units. The new brief adds dated demand. Facts from `fixtures/` and the brief:

- Large bins: 6 × 30 units. After the existing plan: `FG-BEN-2S` 29 (1 bin, after `C-01-2` is merged away), `FG-BEN-3S` 18 + 30 (WO-1033, 27 Nov) = 48 (2 bins), `FG-TBL-BIS` 12, `FG-CHR-FLD` 20, `FG-PLN-LRG` 7 (1 bin each). Total 6 bins, 116 units.
- Small, Medium and Bulk are not touched by the orders. Bulk has no free bin (BULK-01 to 03 hold stock, BULK-04 capacity unknown).
- The three orders are customer orders. Only the benches are stated to come off the line; the chairs (20 on hand, 16 ordered) and 3-seat benches (48 on hand after WO-1033, 24 ordered) can be met from stock. This is our reading of the brief and is recorded as an assumption.

Hand-worked expected results (the tests are written against these; they are our hand calculation and must be re-verified before the pitch):

| Date (defaults) | 2S | 3S | TBL | CHR | PLN | Large bins needed |
|---|---|---|---|---|---|---|
| 27 Nov to 2 Dec | 29 → 1 | 48 → 2 | 1 | 1 | 1 | 6 of 6 |
| 3 Dec (benches land) | 69 → 3 | 48 → 2 | 1 | 1 | 1 | **8 of 6, short 2** |
| after 3S dispatched early (before benches) | 69 → 3 | 24 → 1 | 1 | 1 | 1 | 7 of 6, short 1 |
| plus benches split or cross-docked (hold ≤ 60 so 2S needs ≤ 2 bins) | 2 | 1 | 1 | 1 | 1 | 6 of 6, fits |
| 4 Dec after CO-8801/8802 leave | 29 → 1 | 24 → 1 | 1 | 4 → 1 | 1 | 5 of 6 |

Unit check: 69 + 48 + 12 + 20 + 7 = 156 units against 180 capacity, so the problem is bins (one product per bin), not total units. The folding chairs need 1 bin even at 4 units. This is the point to make in the pitch.

## Goals / Non-Goals

**Goals:**
- Answer the brief's three questions with the working visible: can it hold, what has to give in order, what are we unsure about.
- Reuse the existing solver, validator, `stockAfter` and fit check; add a time dimension without changing their behaviour.
- Run offline in the browser from committed fixtures.

**Non-Goals:**
- Forecasting other demand from movement history.
- Re-optimising bin placement across dates (we count bins needed; the validator checks the placement for the dates shown).
- Volume or dimensions.

## Decisions

**1. Orders are outbound events; benches are one assumed inbound event.**
`fixtures/orders.json` holds the CSV orders. The timeline treats each as a dispatch on `deliveryDate − leadDays` (default 1). The benches are a synthetic receipt `EXTRA-2S` of 40 `FG-BEN-2S` with an adjustable date, default 2026-12-03, validated to fall after 2026-11-27. *Alternative:* treat all three orders as receipts (the first reading of the CSV). Rejected: the brief says orders were won for delivery, and only the benches "come off the line".

**2. Start from the existing plan's end state.**
`timeline.ts` takes `stockAfter(data, solve(data).steps)` as day zero, so merges and the existing putaways are assumed done. This keeps one source of truth and means the December answer cannot contradict the main plan. The merge lever is therefore "already counted", and the options list says so.

**3. Bins needed is arithmetic, bins placed is the validator's job.**
`binsNeeded(units, capacity) = ceil(units / capacity)` per product, summed per size class and compared to usable bins (known capacity, not over capacity). For any date shown as "fits" we also build concrete steps (merge, receive, dispatch) and run `validatePlan`; a mismatch shows an error rather than a fit. *Alternative:* extend `solve` to be date-aware. Rejected as a larger change to a working, tested solver with a deadline.

**4. Levers are small pure functions on a timeline.**
`lib/make-room.ts` exports `applyLever(timeline, lever)` for `dispatch-early`, `split-receipt`, `cross-dock` and `rule-change`, and `planLevers(timeline)` which tries them in disruption order and stops when the peak fits, recording bins short after each. Rule-change levers are returned flagged `needsDecision` and never applied to the "fits" answer unless the user switches them on. Early dispatch is only suggested for orders whose dispatch can move earlier than the bench receipt; the new date is `benchReceiptDate − 1`.

**5. Page and recompute.**
`app/december/page.tsx` (server) loads fixtures; a small client component holds the two adjustable assumptions (bench arrival date, dispatch lead days) and recomputes with the pure functions, no network. The page order mirrors the brief: answer line, working table per day, "what has to give" steps with a before/after bins strip, assumptions register, open questions. The answer line states the numbers, for example "Not as things stand: Large needs 8 bins on 3 Dec, we have 6."

**6. Privacy.**
The CSV `customer` is already a pseudonymous label. It is kept as `customerLabel` only so the pitch can refer to the order; the data-minimisation doc and the privacy test are updated.

## Risks / Trade-offs

- **Reading of the brief is wrong** (orders are inbound, or chairs and 3S need new production) → the register states the reading and the first open question asks the organiser; the timeline supports an order marked as stock-draw or receipt with a one-line fixture change.
- **Bench arrival date unknown** → default is the worst case, adjustable, and the answer shows how the verdict changes with the date.
- **Counting bins ignores physical access and timing within a day** → stated in the register; the stores manager confirms.
- **Stale counts on `C-01-2` and `C-02-2`** → the 2S total (29) and the table (12) depend on 7 Nov counts; a recount before 3 Dec is the first action recommended.
- **Levers overlap** → the combined projection is recomputed and validated, not summed.
- **Hand numbers drift from code** → tests assert the table above; any change to the existing plan fails them visibly.
