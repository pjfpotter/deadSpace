# Proposal

## Why

Fernbrook's stores manager says the stores are "full", yet the latest count shows Small, Medium and Large bins about 43–49% used. The same product sits in two bins, bins hold a handful of units, and one bin is mixed and over capacity. Next week six deliveries and production runs are due and, as things stand, not all of it will fit. Fernbrook does not want to rent more space. This is a 1066 Manufacturing Hackathon challenge (5-minute pitch, judged on understanding, usefulness, evidence it works, safe data use, business case and teamwork), and we have under 3 hours.

## What Changes

- Add a Next.js web app, deployed to Vercel, that turns the Fernbrook CSVs into a consolidation and putaway plan the stores team can follow.
- Add an ingest step that keeps only the columns the plan needs and drops personal data (counter and picker names, mobiles, home addresses, supplier contacts) before anything reaches the app, the repo or an LLM.
- Show how full the stores are: space used, empty bins and bins under half full, by size class.
- Produce a list of merges (product, from bin, to bin, quantity, bins freed) that never breaks the four store rules and moves stock at most once.
- Produce a putaway plan placing every delivery and production run in a bin. If it cannot all fit, show what must happen first to make room.
- Re-check every plan with a separate rules validator, independent of the solver.
- Flag data problems visibly and record how each is handled (careful policy: the stock count is truth, nothing is added to an over-capacity bin).
- Add a "can we fit it?" check, and a phone-friendly floor view where moves are ticked off.
- Generate plain-English move instructions with an LLM, check each one against the solver's move list, and log every mistake as pitch evidence.
- Stretch (cut first): run-out risk, fast-mover slotting, and capacity shown as real space using an assumed space-per-unit table by size class.

Out of scope: renting space, per-product dimensions (none exist in the data), live data feeds or a database, authentication, and any use of movement data beyond the stretch goals.

## Capabilities

### New Capabilities
- `data-minimisation`: Sanitises the raw CSVs, keeping only needed columns and publishing a kept/dropped/why record.
- `data-quality-flags`: Detects data problems, applies the careful handling policy and shows each flag with its decision.
- `store-fullness`: Reports space used, empty bins and bins under half full, overall and by size class.
- `bin-consolidation`: Produces the merge list: which product moves from which bin to which, and which bins it frees.
- `incoming-putaway`: Assigns each incoming delivery or production run to bins, or explains what must happen first.
- `plan-validation`: Independently checks any plan against the store rules and reports each violation.
- `fit-check`: Answers whether a product and quantity fits now or after the merges.
- `floor-view`: A mobile-friendly checklist of moves and putaways with plain-English instructions and tick-off progress.
- `move-instruction-checking`: Verifies LLM-written instructions against the solver's move list and logs mistakes.
- `run-out-risk` (stretch): Flags products likely to run out soon from stock and movement history.
- `fast-mover-slotting` (stretch): Suggests keeping fast-moving products in easy-to-reach bins.
- `real-space-view` (stretch): Shows capacity as real space using assumed space-per-unit weights by size class.

### Modified Capabilities
<!-- None: this is a new project with no existing specs. -->

## Impact

- **New code:** a Next.js app (App Router, TypeScript) with a planning library (solver, validator, flags), an ingest script and tests. Raw CSVs move to a gitignored folder; sanitised JSON is committed.
- **Dependencies:** a WASM ILP solver (HiGHS) and a test runner; an LLM call through the Vercel AI Gateway, used only for move-instruction wording.
- **Data and privacy:** only sanitised bin, SKU, quantity and incoming data may reach the app or an LLM; no personal data is committed.
- **Team inputs:** business case, brand assets and the AI-error write-up are produced by teammates in other tools and dropped into the repo by the developer.
