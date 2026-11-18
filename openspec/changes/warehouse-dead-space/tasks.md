# Tasks

Two-hour MVP, in time order. If running late, drop group 5 (floor checklist) before group 3 (validator). Everything not listed in groups 1–6 is under "Later" at the end.

## 1. Scaffold, deploy early, privacy and ingest (0:00–0:20)

- [x] 1.1 Confirm the data is ignored: run `git check-ignore data/stock.csv`; verify it prints the path and `git status` shows no CSV or `data/` file
- [x] 1.2 Scaffold a Next.js App Router TypeScript project at the repo root with Vitest; verify `npm run dev` serves a page and `npm test` runs
- [x] 1.3 Deploy the empty app to Vercel now to catch deploy problems early; verify the public URL loads
- [x] 1.4 Define the model types (`Bin`, `Product`, `StockRow`, `IncomingLine`, `Move`, `Plan`, `Flag`) in `lib/model.ts`; verify the project type-checks
- [x] 1.5 Write `scripts/ingest.ts` that reads the raw CSVs in `data/`, keeps only needed columns (no names, mobiles, addresses, supplier contacts, unit cost), writes sanitised JSON to `fixtures/`, and generates `docs/data-minimisation.md` (kept/dropped/why); verify with a test that no fixture contains a personal field or the strings "Priory", "Castle Hill" or "07700"
- [x] 1.6 Run the privacy scan, then commit `fixtures/` and the minimisation doc; verify `git grep -nE "07700|@example\.com|Priory Close|Castle Hill" -- . ':!openspec' ':!README.md' ':!lib/fixtures.test.ts'` returns nothing (the privacy test holds the forbidden strings as patterns on purpose)

## 2. Flags and fullness (0:20–0:35)

- [x] 2.1 Implement `lib/flags.ts` (mixed bin, over capacity, unknown capacity, stale count, locked bins, decision text) with tests; verify the real data yields `A-04-2` mixed and over, `B-03-2` over, `BULK-04` unknown, and stale-count flags for the 7 Nov bins
- [x] 2.2 Implement `lib/fullness.ts` (units used, known capacity, percent by size class, empty bins, under-half bins, unknown capacity excluded) with tests; verify Small 43%, Medium 49%, Large 48% and empty bins `A-05-1`, `B-03-3`
- [x] 2.3 Build the fullness page and the data flags panel; verify both render the figures above in the browser

## 3. Validator (0:35–0:50)

- [x] 3.1 Implement `lib/validate.ts` checking one product per bin, capacity, size class, valid bin codes, stock conservation, no chained moves, no move exceeding bin contents and the locked-bin receipt rule; verify with one failing-plan test per rule and a passing-plan test
- [x] 3.2 Add a `validatePlan` guard used by every page that shows a plan; verify a deliberately broken plan shows violations instead of moves

## 4. Greedy merges and putaway (0:50–1:20)

- [x] 4.1 Implement `lib/solve-greedy.ts` for the merge list (fix the mixed bin first, then merge each product into its fullest allowed bin, no chained moves) with tests; verify the plan moves `CN-OIL-1L` out of `A-04-2` first, frees exactly `A-02-1`, `A-02-3`, `B-01-2`, `B-02-2` and `C-01-2`, and leaves `CN-SND-120`, `FX-SCR-440` and `PK-CTN-BEN` unmerged with a stated reason (merges are sized against stock plus incoming)
- [x] 4.2 Extend it to place every incoming line (top up same-product bins, then empty bins, after merges), report any unplaced units, and order steps so freeing merges precede dependent putaways; verify a test that every incoming reference is fully placed and the plan passes the validator
- [x] 4.3 Hand-check five bins from the output against the four store rules and record it in `docs/hand-check.md`; verify the note lists the bins and results
- [x] 4.4 Build the merges page and the putaway page, showing bins freed and what made room; verify both render from the plan with the validator guard active

## 5. Floor checklist (1:20–1:35, cut first if late)

- [x] 5.1 Build the floor view: ordered steps with template instructions (product, quantity, from bin, to bin), tick and undo, progress count, `localStorage` keyed by a plan hash, and a safe fallback if storage is blocked; verify ticks survive a reload and a blocked-storage run shows the list with nothing ticked
- [x] 5.2 Check the floor view at 360px width; verify no horizontal scroll and that every step is tappable

## 6. Ship and pitch support (1:35–2:00)

- [x] 6.1 Redeploy to Vercel; verify the public URL loads every page and shows no personal data
- [ ] 6.2 Drop teammates' work into the repo (`docs/business-case.md`, `docs/ai-error-log.md`, `public/brand/`) and apply the brand to the header and colours; verify the files exist and the app shows the brand
- [ ] 6.3 Write `docs/pitch-evidence.md` mapping each judging criterion to proof in the repo or app (understood the problem, useful, works and tested, AI errors found, data minimised, business case, next steps), calling the plan rules-checked and hand-verified, not optimal; verify every criterion links to a real file or page
- [ ] 6.4 Run the full tests and the privacy grep, then rehearse the demo path once (fullness, flags, merges, putaway, floor view) against the 5-minute limit; verify all tests pass, the grep is empty and the run is under 5 minutes with no network-dependent step

## 7. Fit check (only if groups 1-6 are done, about 25 minutes)

- [x] 7.1 Implement `lib/fit.ts` (`checkFit`: input validation, spare room per bin, same-product bins before empty bins, size-class match, flagged bins excluded and reported, shortfall) with tests for each spec scenario; verify an unknown SKU, quantity 0 and 2.5 return errors and an oversized quantity returns the right `short`
- [x] 7.2 Add the "after merges" state from `stockAfter(data, plan.steps)` and name the freeing merge for any bin in `plan.freedBins`; verify a quantity that fits only after merges reports the merge, and an over-capacity bin counts zero room
- [x] 7.3 Build `app/fit/page.tsx` and a Nav link: product select, quantity input, two result cards (now, after merges) listing bins and units, behind `PlanGuard`; verify it renders on the real data, withholds "after merges" for a broken plan, and fits at 360px
- [x] 7.4 Hand-check three answers against the store rules (one fits now, one only after merges, one short) and add them to `docs/hand-check.md`; verify the note lists product, quantity and result

## Later (not in the two-hour MVP)

These are deferred, not tracked. Their specs stay in this change as the target behaviour.

- Fit check: see group 7 above (spec `fit-check`; only if the MVP is done early).
- ILP solver: HiGHS per size class behind the same solver interface, with a comparison test against greedy and a precomputed plan JSON (design decision 5).
- In-repo LLM pipeline: generate instructions through the AI Gateway, check each against its move, fall back to templates, and log failures (spec `move-instruction-checking`). In the MVP the data/testing colleague does this by hand and logs mistakes in `docs/ai-error-log.md`.
- Stretch: run-out risk, fast-mover slotting and the real-space view (specs `run-out-risk`, `fast-mover-slotting`, `real-space-view`).

## Workflow follow-up

- Archive this change after the hackathon. Archiving would merge all 12 specs, including the deferred ones, into the main specs; split the deferred specs out first if the main specs should describe only what was built.
