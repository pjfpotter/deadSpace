# Pitch evidence

Each judging criterion, the proof we have, and where to find it. Live app: https://fernbrook-dead-space.vercel.app

Status: **Done** = proof exists in the repo or app today. **Waiting** = a teammate's work, not here yet.

| Criterion | Status | Proof |
|---|---|---|
| **We understood the problem** | Done | The stores aren't "full": small, medium and large bins are 43%, 49% and 48% used, and only 2 of 34 bins are empty, yet next week's deliveries won't fit as things stand. The [fullness page](https://fernbrook-dead-space.vercel.app/) shows it, and the [brief's](README_warehouse_dead_space.md) rules (one product per bin, capacity in units, size classes) are enforced in code. |
| **We built something useful** | Done | Live pages: [How full](https://fernbrook-dead-space.vercel.app/), [Merges](https://fernbrook-dead-space.vercel.app/merges), [Deliveries](https://fernbrook-dead-space.vercel.app/putaway), [Floor checklist](https://fernbrook-dead-space.vercel.app/floor) (phone-friendly, ticks saved on the device). |
| **We showed it works, and tested it** | Done | 85 automated tests, including: an independent rules validator with one failing plan per rule; the plan checked against the real data; and 300 randomly generated stores. [Hand check](hand-check.md) of 12 bins against the four rules. Floor view checked in a real browser (ticks survive reload, undo, blocked storage, no overflow at 360px). |
| **We showed where AI got it wrong** | Done (build) / Waiting (testing colleague) | [AI error log](ai-error-log.md): four real mistakes the AI made while building, each caught by a test or a hand check, with the fix. The testing colleague adds findings on AI-written move instructions. |
| **We used only the data we needed, and kept it safe** | Done | [Data minimisation table](data-minimisation.md): every column kept or dropped with a reason. Names, personal mobiles, home addresses, supplier contacts, costs and the whole movements file are dropped. Raw data is gitignored and never deployed (the live site returns 404 for the data paths). A test fails if any personal field reaches the app. No AI is called by the running app. |
| **We made the business case** | Done | `docs/business-case.md` (about £3,100 a year saved, payback about 3 months, all £ and m² labelled as assumptions) with workings and an assumptions register in `docs/baseline-assessment.md`. Facts it can cite are below. |
| **We have next steps** | Done | Technical next steps below; commercial next steps in `docs/business-case.md`. |
| **We make a clear pitch** | Waiting | Brand and business colleagues: slides and demo script. A suggested 5-minute path is below. |
| **We work well as a team** | Done | Each role has a reading guide and a place to hand work in ([README](../README.md)). Planned and tracked in `openspec/`, with every task verified. |

## Facts the business case can cite

All from the plan the app produces on Fernbrook's latest count and next week's incoming list.

- **No extra space needed.** 6 moves (1 mixed-bin fix and 5 merges) free 5 bins, and all 6 deliveries and production runs are placed in full, leaving 3 spare bins.
- **Empty bins: 2 now, 7 after the merges, 3 after next week's deliveries.**
- **Only 15 steps in total.** 6 moves plus 9 put-aways across the 6 deliveries. Each is done once, and no stock is moved twice.
- **A real fault found.** One bin (`A-04-2`) mixes two products and is over capacity, which breaks the stores' own rule. The plan fixes it first.
- **Two things only a person can settle.** `B-03-2` holds 66 against a capacity of 60 (recount), and `BULK-04` has no capacity on record. The plan leaves both alone and says so.
- **Honest limits.** The plan is rules-checked and hand-verified; we do not claim it is mathematically optimal. Capacity counts units, not physical size, as the brief notes.

## Next steps

Technical:
- Add an exact (ILP) solver and compare it with the current plan.
- Add the "can we fit it?" check for a product and quantity.
- Have an LLM word the move instructions, with each one checked against the plan, as an optional extra.
- Run-out warnings and fast-mover slotting, using the movement history we deliberately did not load.
- Convert capacity into real space once product dimensions exist.

For Fernbrook (business colleague to refine): recount `B-03-2`, record `BULK-04`'s capacity, keep counts current (11 bins were last counted 7 days before the newest count), and review the plan weekly.

## Suggested 5-minute demo path

1. **The problem (45s):** "Full" isn't true. Show the fullness page: the 43/49/48/57% figures, 2 empty bins, many under half.
2. **The data problems (45s):** The flags panel: a mixed bin, two over-capacity bins, one missing capacity, and what we did about each.
3. **The plan (75s):** Merges page, 5 bins freed, 7 empty. Then Deliveries: every delivery placed, with `B-01-2` and `C-01-2` reused after the merges that free them.
4. **Why trust it (60s):** The rules validator, the hand check, and one AI mistake from the log (Bulk 73% vs 57%).
5. **On the floor (30s):** Open the checklist on a phone and tick a step.
6. **Data and next steps (45s):** What we kept and dropped, and what comes next.
