# Where the AI got it wrong

We used an AI coding assistant (Claude) to analyse the brief, plan and build this app. This log records the mistakes it made, how each was caught, and what we did. The point: **AI output is a draft. The app's safety comes from checks that are not AI** (an independent rules validator, tests against the real data, and a hand check), not from trusting the AI.

Two sections: mistakes caught while building (below), and the testing colleague's findings (to add).

## Caught while building

### 1. Solved the wrong problem before reading the brief

- **What the AI said:** Asked to analyse the data before the brief was in the repo, it told us the problem was reorder risk and stock-outs, and called two incoming deliveries "over-ordering".
- **What was true:** The brief is about consolidating part-empty bins and fitting next week's deliveries. Reorder points are irrelevant to it.
- **How it was caught:** The brief arrived in `docs/`; the AI re-read it and the data against it and changed course.
- **Lesson:** An AI will fill a gap in its inputs with a confident guess. We gave it the brief before building anything.

### 2. A wrong utilisation figure for Bulk bins (73%, correct is 57%)

- **What the AI said:** Bulk bins are 73% full.
- **What was true:** 57%. It counted `BULK-04`'s 150 units (capacity unknown) against only the three bins whose capacity is known (900): 660 / 900 instead of 510 / 900.
- **How it was caught:** Writing the fullness test. Our rule says bins with unknown capacity are left out of the percentage, and the test expected 510 / 900.
- **Fix:** The page and the test both use 57% and state that `BULK-04` is left out.

### 3. A merge the plan said was needed that was not

- **What the AI said (in the plan):** `PK-CTN-BEN` must be merged first so 200 more cartons can land.
- **What was true:** 270 on hand + 200 incoming = 470, which needs two 300-unit bins whether or not you merge first. Merging would only free a bin that the delivery refills (and would break our "no stock moved twice" rule). `FX-SCR-440` is the same (105 + 120 = 225 needs two 120-unit bins).
- **How it was caught:** Working through the solver on the real data. The solver now sizes each product against stock plus incoming and skips merges a delivery would undo.
- **Fix:** `design.md` and `tasks.md` were corrected, and the merges page lists each product left unmerged with the reason.

### 4. AI-written test expectations that were wrong (twice)

- **What the AI did:** Wrote a test that expected product keys in the wrong alphabetical order (`sku` before `size`), and another that miscounted the non-empty bins after a move (expected 4, correct 3).
- **How it was caught:** Running the tests. The code was right and the tests were wrong.
- **Fix:** We corrected the tests, and made the second one assert exact bin contents instead of a count, which is a stronger check.
- **Lesson:** A passing test is only as good as its expected value. Each expectation was checked against the data by hand.

### 5. Our own validator only checked the end result (found by Copilot's review)

- **What the AI built:** The independent rules validator checked one product per bin and capacity only on the final state, after every step had been applied.
- **What was true:** A plan could put product X into a bin before the move that emptied product Y. The end state looked fine, so it passed, but nobody could do it on the floor.
- **How it was caught:** We gave Copilot our design and checked each of its criticisms against the code. This one was real: a test with the two moves in the wrong order passed the validator.
- **Fix:** `lib/validate.ts` now checks one product per bin after every step. Tests in `lib/review.test.ts` cover the wrong order (fails) and the right order (passes). The full accept/reject reasoning for Copilot's other points is in `docs/review-response.md`.
- **Lesson:** The check we rely on to catch AI mistakes was itself AI-written and had a gap. A second reviewer found it, and we only accepted the criticisms that held up against the code.

## From our testing colleague

_To add: what the AI got wrong when asked to word the move instructions (wrong bin codes, wrong quantities, invented steps), checked against the plan's move list. For each: the move, what the AI wrote, what was wrong, and how you caught it._

| Move | What the AI wrote | What was wrong | How caught |
|---|---|---|---|
| | | | |

## How the app protects against AI mistakes

- The plan is computed by ordinary code, not by an AI.
- Every plan page runs through an independent rules checker. A plan that breaks a rule is replaced on screen by the list of violations.
- The floor checklist uses wording built directly from each move, so it cannot name a wrong bin or quantity.
- No AI is called by the running app and no data is sent to an AI by it.
