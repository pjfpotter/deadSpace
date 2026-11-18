# Tasks

Small extension of the working app. Do groups in order; each group leaves the app deployable. All tests are Vitest in `lib/`.

## 1. Inputs and privacy

- [x] 1.1 Keep `docs/spec-update/WAREHOUSE_UPDATE.pdf` and `warehouse_extra_orders.csv` in the repo; verify the CSV is not caught by the existing `*.csv` gitignore rule (add a negation for `docs/spec-update/` if it is) and the three rows are committed
- [x] 1.2 Extend `scripts/ingest.ts` to read the CSV and write `fixtures/orders.json` (`orderRef`, `customerLabel`, `deliveryDate`, `sku`, `quantity`); verify it rejects an unknown SKU, a non-positive quantity and a bad date with a message naming the row
- [x] 1.3 Add `Order` to `lib/model.ts` and load it in `lib/store.ts`; update `docs/data-minimisation.md` and the privacy test; verify the fixtures test passes and `orders.json` has exactly three orders

## 2. Timeline and bins needed

- [x] 2.1 Implement `lib/timeline.ts`: day-zero stock from `stockAfter(data, solve(data).steps)`, receipts (Incoming plus bench receipt, default 2026-12-03), dispatches (orders at delivery date minus lead days), per-date units per product; verify a test for 3 Dec: `FG-BEN-2S` 69, `FG-BEN-3S` 48, `FG-CHR-FLD` 20
- [x] 2.2 Add bins needed per product and size class with usable-bin counts (locked bins excluded); verify tests: Large needs 8 of 6 on 3 Dec, 6 of 6 once CO-8801/8802 leave on 3 Dec and 5 of 6 after CO-8803 leaves on 10 Dec, Small, Medium and Bulk fit, and a dispatch larger than stock reports a shortfall
- [x] 2.3 Reject a bench arrival on or before 2026-11-27; verify a test for the error message

## 3. What has to give

- [x] 3.1 Implement `lib/make-room.ts` levers (dispatch early, split receipt, cross-dock, rule change flagged `needsDecision`) and `planLevers`; verify tests against the design table: early dispatch of CO-8803 gives 7 of 6, plus split or cross-dock gives 6 of 6, and the combined result is recomputed rather than summed
- [x] 3.2 For any "fits" result, build concrete steps and run `validatePlan`; verify a test that a fitting December plan passes and that a deliberately overfull placement is reported as a violation
- [x] 3.3 Name who must agree each lever and the latest date for it; verify a test for the early-dispatch deadline (2 Dec at defaults)

## 4. December page

- [x] 4.1 Build `app/december/page.tsx` and a client component for bench arrival date and dispatch lead days; verify the answer line, the per-product working table (units ÷ capacity → bins), the days over capacity and the "what has to give" steps render from fixtures offline
- [x] 4.2 Build the assumptions register and open questions (bench date, stock-draw reading of the orders, stale counts, Large-only-in-Large, Bulk question, existing 2S stock promised); verify each entry shows source, effect and owner
- [x] 4.3 Add the page to `Nav`; verify the existing pages and tests still pass (`npm test`, `npm run lint`, `npm run build`)

## 5. Evidence and deploy

- [x] 5.1 Hand-check the Large numbers on 3 Dec against `fixtures/` and the four store rules and record it in `docs/hand-check.md`; verify the note lists the bins and results
- [x] 5.2 Add the December answer (one line verdict, the working, the ordered steps, the unknowns) to `docs/pitch-evidence.md`; verify it matches the page
- [ ] 5.3 Redeploy to Vercel; verify `/december` loads on the public URL

## Later

- [ ] Confirm the arrival date, whether the 2S stock is promised, and whether Large goods may use Bulk bins with the organiser, then update the defaults
- [ ] Date-aware solver (ILP) that places stock across dates instead of counting bins
