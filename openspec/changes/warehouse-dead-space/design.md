# Design

## Context

Greenfield, empty repo (not yet under git). The input is five CSVs in `data/` and the brief in `docs/`. See `proposal.md` for the why.

Data shape (observed): 34 bins (15 Small at 120, 9 Medium at 60, 6 Large at 30, 4 Bulk at 300, `BULK-04` blank), 27 SKUs, 34 stock rows, 6 incoming lines, 312 movements over 40 days. Utilisation is 43% Small, 49% Medium, 48% Large and 57% Bulk (`BULK-04` excluded because its capacity is blank; counting its stock against the other three bins gives a misleading 73%, see `docs/ai-error-log.md`). Only `A-05-1` (Small) and `B-03-3` (Medium) are empty. The raw CSVs contain personal data in `stock.csv`, `movements.csv` and `products.csv`.

Hard constraints: one developer owns the repo, two hours to a working MVP, a 5-minute demo for judges, and a demo that must not depend on a network call. The stock count is the truth; movements do not reconcile to it and are only used for stretch goals.

A hand check shows the incoming list fits, but only if merges run first. Medium has one empty bin and two Medium products with no stock incoming (`CP-ARM-PR`, `CP-TOP-BIS`); merging `CP-LEG-BEN` and `CP-BRK-STL` frees two. Large needs `FG-BEN-2S` merged to free a bin for the second `FG-BEN-3S` bin. Merges are sized against stock plus incoming, so a merge that the delivery would immediately undo is skipped: `PK-CTN-BEN` (270 + 200 = 470 needs two 300-unit bins either way) and `FX-SCR-440` (105 + 120 = 225 needs two 120-unit bins either way) stay as they are and take their delivery as top-ups; `CN-SND-120` (130) cannot fit one bin. (An earlier draft wrongly said Bulk needed `PK-CTN-BEN` merged first; building the solver showed it does not.) These are the expected results the tests are written against.

## Goals / Non-Goals

**Goals:**
- One shared planning library whose output the UI, validator, tests and instruction checker all consume.
- A plan that is provably rule-abiding: every displayed plan passes an independent validator.
- Safe by construction: personal data never enters the app, repo or an LLM prompt.
- A demo that runs offline from committed, sanitised data.

**Non-Goals:**
- A database, login, multi-user sync or live data feed.
- Per-product dimensions or 3D packing.
- Re-planning from edited data in the browser (data is fixed at build).
- Optimising pick routes beyond the simple fast-mover rule.

## Decisions

**1. One Next.js project, App Router, TypeScript, planning library in `lib/`.**
Pure functions over plain objects (`Bin`, `Product`, `StockRow`, `IncomingLine`, `Move`, `Plan`) with no framework imports, so they run in scripts, tests and server components alike. *Alternative:* Python for the solver, rejected: a second runtime to deploy and demo.

**2. Static sanitised JSON, `localStorage` only for tick-offs.**
`scripts/ingest.ts` reads the raw CSVs in `data/`, writes sanitised JSON to a committed `fixtures/` folder, and emits `docs/data-minimisation.md` (kept/dropped/why per column). The whole `data/` folder and all `*.csv` files are already gitignored (the repo is public), so raw data never leaves the machine; only `fixtures/` is committed, and it holds just bin codes, product codes, names, sizes, quantities and incoming lines. *Alternative:* Neon Postgres; rejected as setup and live-demo risk for no gain, as the data is fixed.

**3. Careful bad-data policy via "locked" bins.**
A bin is *locked* if it is over capacity or has unknown capacity. Locked bins keep their counted stock, count toward units used, and may be emptied but never receive stock. `A-04-2` is also *mixed*: the minority product (`CN-OIL-1L`, 12) is moved out first to a same-product bin with room (`A-04-3`). Stale counts are flagged only. Flags carry a `decision` string shown in the flags panel. *Alternative:* assume missing capacities; rejected as unverifiable guesses in front of judges.

**4. Validator first, then greedy (the MVP solver); ILP later behind the same interface.**
`validatePlan(state, plan)` is written first and is independent of any solver. A `solve(state)` function returns a `Plan`; the greedy version (per product, pack into fullest allowed bins, free the rest, then place receipts into existing bins, then empty bins) ships first so the app works. A later ILP version (HiGHS WASM, per size class) can replace it behind the same signature. The MVP ships greedy only, and the pitch calls the plan rules-checked and hand-verified, not optimal. *Why this order:* the validator is needed whichever solver is used, and ILP setup is the biggest schedule risk. Tests check the greedy output against the expected hand-checked results; if ILP is added, tests also compare it to greedy.

**5. ILP formulation (later, not in the two-hour MVP).**
Per size class: variables `x[p,b]` (units of product `p` in bin `b` after the plan) and binary `y[p,b]` (bin used for `p`). Constraints: `x ≤ cap·y`, `Σ_p y[p,b] ≤ 1`, `Σ_b x[p,b] = counted + incoming`, locked bins have `x = counted` (or 0 if emptied) for receipts, and size class match by construction. Objective, lexicographic by weights: minimise occupied bins, then units moved (`Σ max(0, counted − x)` linearised). Moves are derived by pairing surplus bins to deficit bins of the same product, which yields one move per unit of stock and no chains. Merge and putaway are solved on the same model with incoming added to the target totals, then ordered into steps (merges that free a bin before the putaways that need it). *Alternative:* greedy only, which is the MVP choice because of the two-hour limit; the ILP remains the intended upgrade.

**6. Fit check is arithmetic, not a solver call (later, only if the MVP is done early).**
`lib/fit.ts` exports `checkFit(data, plan, sku, quantity)` returning `{ now, afterMerges }`, each `{ fits, allocations: {bin, units}[], short, excluded: string[] }`, or `{ error }` for invalid input. Room is a pure function of a stock state: spare capacity (`max(0, capacity - units)`) in unlocked bins already holding the product, then empty unlocked bins of the matching size class at full capacity. Flagged bins (mixed, unknown capacity, stale-locked) are skipped and listed in `excluded` so the answer can say so. Allocation fills same-product bins first, then empty bins, so a quantity can span bins; `short` is whatever is left over.

Two states, both from existing code: "now" is the latest count; "after merges" is `stockAfter(data, plan.steps)` from `lib/apply.ts`, which already includes next week's putaways. This is deliberate: incoming stock is committed, so room it will take is not offered twice, and the UI says "includes next week's deliveries". "After merges" is withheld when the plan fails `validatePlan`. The merge that made room is found by matching an allocated bin to `plan.freedBins` and the move that frees it. The page is `app/fit/page.tsx` with a small client form (product select, quantity); the answer comes from fixtures in the browser, with no LLM or solver call. *Alternative:* re-run ILP per query; rejected as slower and unnecessary. *Open question for the stores manager:* should "now" also ignore incoming? We say no, to avoid promising room that next week's deliveries will use.

**7. LLM only phrases moves; instructions are prepared ahead and checked (later in the repo; templates in the MVP).**
In the MVP the floor view uses template instructions built from each move. The data/testing colleague generates LLM wording outside the repo from the sanitised move list, checks it against the move list by hand, and logs mistakes in `docs/ai-error-log.md`. The in-repo pipeline below is the later version. `scripts/generate-instructions.ts` sends each move's product name, code, bins and quantity (nothing else) through the Vercel AI Gateway using a plain `"provider/model"` string, writes `fixtures/instructions.json`, and runs `checkInstruction(move, text)`: extract every bin code and number from the text and compare to the move. Failures are replaced by a template instruction and appended to `docs/ai-error-log.md` (move, bad text, reason). The app reads the stored results, so the demo works offline. *Alternative:* live LLM in the floor view; rejected as demo risk and unnecessary cost.

**8. Stretch goals (later) are separate modules with no effect on the plan.**
Run-out: days of cover = counted ÷ mean daily outbound units, unknown if no outbound history, with incoming lines shown beside it. Fast movers: rank by outbound movement count per size class; "easy to reach" = lower bay then lower shelf (stated assumption). Real space: assumed weights by size class in one config file (illustrative defaults: Small 0.0025, Medium 0.02, Large 0.15, Bulk 0.01 m³ per unit; Small was 0.005 but that would need 1.7× the shelf, see `docs/baseline-assessment.md`), always labelled as assumptions. None feed the solver.

**9. Testing.**
Vitest unit tests for the validator (one failing plan per rule), flags, fullness, fit check, instruction checker, and a golden test that the solver's plan for the real data passes the validator and places every incoming line. Final manual check: hand-verify several bins against the plan, as the brief advises.

**10. Repo layout.**
`app/` (MVP pages: fullness, merges, putaway, floor, flags; later: fit, run-out, slotting, real-space), `lib/` (MVP: model, flags, fullness, greedy solver, validator, template instructions; later: fit, ILP solver, instruction checker, stretch), `scripts/`, `data/` (gitignored raw CSVs), `fixtures/` (committed sanitised JSON), `docs/`. Teammates' work lands as `docs/business-case.md`, `docs/ai-error-log.md` (extended with their findings) and `public/brand/`.

## Risks / Trade-offs

- **Greedy is not provably optimal** → ILP is deferred; the pitch says rules-checked and hand-verified, not optimal. The validator and hand-check guard correctness, and ILP can be added later behind the same interface.
- **(When ILP is added) HiGHS WASM fails on Vercel or in the app** → run the solver at build/ingest time and commit the resulting plan JSON; the app only reads it, so the demo does not depend on WASM at runtime.
- **Deploy problems surface late** → deploy an empty app at about the 15-minute mark to catch Vercel issues early.
- **Plan breaks a rule unnoticed** → every displayed plan passes the independent validator or the app shows the violations; hand-check a sample before the pitch.
- **LLM wording is wrong** → checked against the move list, failed ones replaced by templates and logged; this is the evidence, not a blocker.
- **Assumed capacity or weights are wrong** → clearly labelled as assumptions; `BULK-04` is never planned into; weights are a single editable config and never affect the plan.
- **Movement history does not reconcile with the count** → treated as indicative only and used only in stretch views with the caveat shown.
- **Personal data leaks via a mistake** → ingest is the only reader of raw files, tests assert no sanitised file has personal fields, and `data/` and all CSVs are already gitignored.
- **Time** → two-hour MVP in a fixed order; if running late, drop the floor checklist before the validator, because the validator is what supports the claim that the plan is safe.

## Migration Plan

Not applicable: no existing system. Deploy by pushing the repo to Vercel; rollback is redeploying the previous commit.
