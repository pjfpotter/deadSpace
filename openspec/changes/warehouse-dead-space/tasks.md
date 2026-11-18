# Tasks

Time budget: under 3 hours. Groups 1–7 are the must-haves and the nice-to-haves that carry the pitch; groups 8–9 are stretch and are cut first.

## 1. Repo, privacy and data (about 20 min)

- [ ] 1.1 Run `git init`, add `.gitignore` covering `data/raw/`, `node_modules/` and `.env*`, and move the five raw CSVs into `data/raw/`; verify `git status` shows no raw CSV as trackable
- [ ] 1.2 Scaffold a Next.js App Router TypeScript project at the repo root with Vitest; verify `npm run dev` serves a page and `npm test` runs
- [ ] 1.3 Define the model types (`Bin`, `Product`, `StockRow`, `IncomingLine`, `Move`, `Plan`, `Flag`) in `lib/model.ts`; verify the project type-checks
- [ ] 1.4 Write `scripts/ingest.ts` that reads `data/raw/*.csv` and writes `data/clean/*.json` keeping only needed columns (no names, mobiles, addresses, supplier contacts, unit cost), and generates `docs/data-minimisation.md` (kept/dropped/why); verify with a test that no clean file contains a personal field or the strings "Priory", "Castle Hill" or "07700"
- [ ] 1.5 Commit sanitised JSON and the minimisation doc; verify `grep -rn "07700" --exclude-dir=raw --exclude-dir=node_modules .` returns nothing

## 2. Flags and fullness (about 20 min)

- [ ] 2.1 Implement `lib/flags.ts` (mixed bin, over capacity, unknown capacity, stale count, locked bins, decision text) and tests; verify the real data yields exactly `A-04-2` mixed and over, `B-03-2` over, `BULK-04` unknown, and stale-count flags for the 7 Nov bins
- [ ] 2.2 Implement `lib/fullness.ts` (units used, known capacity, percent by size class, empty bins, under-half bins, excluding unknown capacity) and tests; verify Small 43%, Medium 49%, Large 48% and empty bins `A-05-1`, `B-03-3`
- [ ] 2.3 Build the fullness page and flags panel in `app/`; verify both render the figures above in the browser

## 3. Validator (about 20 min)

- [ ] 3.1 Implement `lib/validate.ts` checking one product per bin, capacity, size class, valid bin codes, stock conservation, no chained moves, no moves exceeding bin contents and the locked-bin receipt rule; verify with one failing-plan test per rule and a passing plan test
- [ ] 3.2 Add a `validatePlan` guard used by every page that shows a plan; verify a deliberately broken plan shows violations instead of moves

## 4. Merges and putaway, greedy first (about 35 min)

- [ ] 4.1 Implement `lib/solve-greedy.ts` for the merge list (fix mixed bin first, then merge each product into its fullest allowed bin, no chained moves) with tests; verify the plan frees `B-01-2` or `B-01-1`, `B-02-1` or `B-02-2`, `C-01-2`, `A-04-2` oil, and one of `BULK-01`/`BULK-02` and that `CN-SND-120` stays in two bins
- [ ] 4.2 Extend it to place every incoming line (top up same-product bins, then empty bins, after merges), report unplaced units, order steps so freeing merges precede dependent putaways; verify a test that every incoming reference is fully placed and the plan passes the validator
- [ ] 4.3 Hand-check five bins from the output against the four store rules and record the check in `docs/hand-check.md`; verify the note lists the bins and results
- [ ] 4.4 Build the merges page and putaway page, with bins freed and what made room; verify both render from the plan and the validator guard is active

## 5. Fit check (about 15 min)

- [ ] 5.1 Implement `lib/fit.ts` (room now and after merges, flagged bins excluded, invalid input errors) with tests; verify unknown product, zero quantity and a too-large quantity give the expected messages
- [ ] 5.2 Build the fit-check form and result; verify entering `CP-ARM-PR` with 48 gives "fits after merges" naming the freeing merge

## 6. Floor view and AI instructions (about 35 min)

- [ ] 6.1 Build the floor view with ordered steps, tick and undo, progress count, localStorage keyed by a plan hash, and safe fallback when storage is blocked; verify ticks survive a reload and the page works at 360px width with no horizontal scroll
- [ ] 6.2 Add template instructions for every move; verify the floor view shows a correct sentence for every step with no LLM
- [ ] 6.3 Implement `checkInstruction` in `lib/instructions.ts` (bin codes and numbers must match the move exactly) with tests; verify wrong bin, wrong quantity and missing detail each fail
- [ ] 6.4 Write `scripts/generate-instructions.ts` sending only product name, code, bins and quantity through the AI Gateway, checking each result, storing checked output in `data/clean/instructions.json`, and logging failures to `docs/ai-error-log.md`; verify the script runs, and the log and a pass/fail summary exist
- [ ] 6.5 Make the floor view read stored instructions, falling back to templates on failure, and add the AI check summary (checked, passed, failed); verify the app works with the network disabled

## 7. ILP solver, if time allows (about 25 min)

- [ ] 7.1 Add the HiGHS WASM dependency and implement the per-size-class ILP behind the same `solve` interface with the stated objective; verify it runs on the real data
- [ ] 7.2 Compare ILP and greedy plans in a test (both pass the validator and place all incoming; ILP bins used ≤ greedy); verify the test passes
- [ ] 7.3 Precompute the ILP plan at build time to JSON so the app does not need WASM at runtime; verify the deployed-style build renders the plan from JSON
- [ ] 7.4 If 7.1 is not working by the time budget, keep greedy as the shipped solver and note this in the pitch material; verify the app still passes all tests

## 8. Stretch: run-out, slotting, real space (about 25 min, cut first)

- [ ] 8.1 Implement `lib/runout.ts` (days of cover, unknown without history, at-risk list, incoming lines beside products) with tests and a page; verify `CP-CUS-SAG` shows about 4.5 days and the zero-stock products show as out of stock with their due dates
- [ ] 8.2 Implement `lib/slotting.ts` (rank by outbound count per size class, easy-to-reach rule, rule-safe swap suggestions kept separate from the plan) with tests and a page; verify the main plan is unchanged with slotting shown
- [ ] 8.3 Implement the real-space view with weights in one config file, labelled as assumptions, shown beside the units-based fill; verify the label is visible and plan output is identical with the view on

## 9. Ship and pitch support (about 20 min)

- [ ] 9.1 Deploy to Vercel; verify the public URL loads every page with no personal data visible and no raw files in the deployment
- [ ] 9.2 Drop teammates' work into the repo (`docs/business-case.md`, extended `docs/ai-error-log.md`, `public/brand/`) and apply the brand to the app header and colours; verify the files exist and the app shows the brand
- [ ] 9.3 Write `docs/pitch-evidence.md` mapping each judging criterion to proof in the repo or app (understood the problem, useful, works and tested, AI errors found, data minimised, business case, next steps); verify every criterion links to a real file or page
- [ ] 9.4 Rehearse the demo path once end to end (fullness, flags, merges, putaway, fit check, floor view) against the 5-minute limit; verify it completes in under 5 minutes with no network-dependent step
- [ ] 9.5 Run the full test suite and the privacy grep one last time; verify all tests pass and the grep returns nothing

## Workflow follow-up

- Archive this change after the hackathon once the app and pitch are finished.
