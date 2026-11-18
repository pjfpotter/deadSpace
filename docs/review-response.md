# Outside review: what we accepted and rejected

Copilot reviewed our design and suggested tests. We checked each point against the code before acting on it. Tests for the accepted points are in `lib/review.test.ts`.

## Accepted (and fixed or tested)

| Criticism | What we found | What we did |
|---|---|---|
| Validator only checks the final state, so an impossible order passes | **Real bug.** A plan that put product X into a bin before the move that emptied product Y passed the validator. | `lib/validate.ts` now checks one-product-per-bin after every step. Test: wrong order fails, right order passes. |
| Data minimisation should be an allow-list | Ingest already stops on unknown columns, but the tests only denied known bad keys. | Tests now require exactly the approved fields on every row of all four fixtures. |
| Scan for emails, phones, postcodes, URLs | Only checked a few known strings. | Pattern scan added over all fixtures. |
| Check git for leaked CSVs | `.gitignore` covered it but nothing proved it. | Test fails if any `.csv` or `data/` file is tracked. |
| Conservation of stock | Not tested directly. | Test: every product ends with start + put-away units. |
| Integer safety | Validator already rejected bad quantities; ingest accepted negatives and fractions. | Tests for 0, -1, 0.1, NaN, Infinity, 999999999. Ingest now rejects non-whole or negative units. |
| A→B and C→B should pass | Behaviour was right but untested. | Test added. |
| Extreme over-capacity bin (1000 in a bin of 60) | Behaviour was right but untested. | Test: stock kept, nothing received, no crash. |
| Determinism with shuffled input | We only ran the solver twice on the same input. | Tests: 25 shuffled orders and 100 repeat runs give the same plan. |
| Corrupt saved progress | Some shapes were tested, not `{"done":["ALL"]}`. | More bad shapes added. |

## Rejected (with reasons)

| Criticism | Why we rejected it |
|---|---|
| LLM prompt leakage, prompt injection, product substitution, "fourteen" vs 14 | The MVP calls no LLM. Instructions come from a template built from each step's own fields, so these failures cannot happen. If an LLM is added later, these tests become relevant. |
| Fit check tests (boundaries, locked bin, wrong size) | The fit check is not built, so there is nothing to test yet. The same locked-bin and size-class rules are already tested in the validator. |
| A→B then B→D for a different product "must fail" | This is the intended way a freed bin gets reused. Rejecting it would stop deliveries using bins that merges empty. The real risk (wrong order) is covered by the per-step check above. |
| XSS test | React escapes text by default and the code has no `dangerouslySetInnerHTML`. Product names come from our own fixtures, not user input. |
| Plan hash collision | The hash covers step ids, product, quantity and bins, not just the count, and a test shows two same-length plans get different keys. It guards a tick list, not a security boundary, so a stronger hash adds nothing. |
| 10,000-run fuzz test | We already run 300 random stores with checks that each path is exercised. More runs add time, not new cases. |
| "ILP may be non-deterministic" | We ship a greedy solver, not an ILP, and the shuffle test proves it is deterministic. |
