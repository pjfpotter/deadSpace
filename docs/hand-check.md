# Hand check of the plan

The rules validator checks every plan automatically, but the brief says to check a few bins by hand, because a plan that looks clever but breaks the rules won't impress Fernbrook. This is that check: bins picked from the plan, with the arithmetic done by hand from the sanitised count and the plan's moves.

The four store rules: **(1)** one product per bin, **(2)** capacity in units, **(3)** bin codes read aisle-bay-shelf, **(4)** a product only goes in a bin of its own size class.

| Bin | Size, capacity | Before (count) | Plan | After | 1 product | Within capacity | Size match |
|---|---|---|---|---|---|---|---|
| `A-04-2` | Small, 120 | 110 dowels + 12 oil | 12 oil moved out to `A-04-3` | 110 dowels | Yes (was 2) | 110 ≤ 120 | Small = Small |
| `A-04-3` | Small, 120 | 35 oil | +12 oil from `A-04-2` | 47 oil | Yes | 47 ≤ 120 | Small = Small |
| `B-01-1` | Medium, 60 | 40 bench legs | +14 bench legs from `B-01-2` | 54 bench legs | Yes | 54 ≤ 60 | Medium = Medium |
| `B-01-2` | Medium, 60 | 14 bench legs | 14 moved out to `B-01-1`, then +40 bistro tabletops (`WO-1032`) | 40 tabletops | Yes (emptied before it is refilled) | 40 ≤ 60 | Medium = Medium |
| `C-01-1` | Large, 30 | 24 two-seat benches | +5 from `C-01-2` | 29 | Yes | 29 ≤ 30 | Large = Large |
| `C-01-2` | Large, 30 | 5 two-seat benches | 5 moved out to `C-01-1`, then +18 three-seat benches (`WO-1033`) | 18 three-seat benches | Yes | 18 ≤ 30 | Large = Large |
| `C-02-1` | Large, 30 | 18 three-seat benches | +12 three-seat benches (`WO-1033`) | 30 | Yes | 30 ≤ 30 (exactly full) | Large = Large |
| `A-01-1` | Small, 120 | 70 screws | +50 screws (`PO-4419`) | 120 | Yes | 120 ≤ 120 (exactly full) | Small = Small |
| `A-01-2` | Small, 120 | 35 screws | +70 screws (`PO-4419`) | 105 | Yes | 105 ≤ 120 | Small = Small |
| `A-05-1` | Small, 120 | empty | +96 varnish (`PO-4417`) | 96 | Yes | 96 ≤ 120 | Small = Small |
| `BULK-01` | Bulk, 300 | 180 cartons | +120 cartons (`PO-4420`) | 300 | Yes | 300 ≤ 300 (exactly full) | Bulk = Bulk |
| `BULK-02` | Bulk, 300 | 90 cartons | +80 cartons (`PO-4420`) | 170 | Yes | 170 ≤ 300 | Bulk = Bulk |

**Totals still add up.** Screws: 70 + 35 + 120 incoming = 225 = 120 + 105. Cartons: 180 + 90 + 200 incoming = 470 = 300 + 170. Three-seat benches: 18 + 30 incoming = 48 = 30 + 18. Oil: 35 + 12 = 47. Bench legs: 40 + 14 = 54. None is created or lost.

**No stock is moved twice.** No bin both gives up and receives the same product. `B-01-2` and `C-01-2` are each emptied of one product and later receive a different product, and the moves are ordered so each bin is emptied before it is refilled.

**Bins the plan deliberately leaves alone** (data problems, see the data flags):

| Bin | Count | Why untouched |
|---|---|---|
| `B-03-2` | 66 cushions in a bin of 60 | Over capacity. The count is treated as truth, nothing is added, and someone should recount it. |
| `BULK-04` | 150 bubble wrap rolls, capacity blank | Capacity unknown. Nothing is planned into it, and it is left out of the capacity percentages. |

**Judgement calls the hand check confirms.**
- `FX-SCR-440` and `PK-CTN-BEN` are not merged even though they sit in two part-full bins, because stock plus the incoming delivery needs two bins either way. Merging first would only free a bin that the delivery immediately refills.
- `CN-SND-120` stays in two bins because 130 units is more than one 120-unit bin can hold.

**Result:** 12 bins checked, no rule broken. The independent validator agrees (zero violations) and 300 randomly generated stores also pass it.

## Fit check: three answers checked by hand

Each answer was worked out from the raw bin and stock counts, then compared with `/fit`.

| Question | Worked by hand | Fit check says |
|---|---|---|
| 10 × `FG-PLN-LRG` (Large) | `C-03-2` holds 7 of 30, so 23 spare. 10 fits as a top-up. | Fits now, 10 into `C-03-2`. |
| 200 × `FX-KEY-ALN` (Small) | Now: `A-05-2` has 69 spare and `A-05-1` is empty (120), so 189 and 11 short. After the plan, `A-05-1` holds `CN-VAR-1L`, so it is not room for keys. The merges free `A-02-1` and `A-02-3`: 69 + 120 + 11 = 200. | Does not fit now (11 short). Fits after merges: `A-05-2` 69, `A-02-1` 120, `A-02-3` 11, each freed bin naming its merge. |
| 1 × `PK-BUB-ROL` (Bulk) | Only `BULK-04` holds it, and its capacity is unknown. `BULK-01` to `BULK-03` hold other products and no Bulk bin is empty. | Does not fit, 1 short, and says `BULK-04` was left out (capacity unknown). |

**A hand-check mistake worth recording.** The first hand calculation for the keys wrongly counted `A-05-1` as free after the plan. The fit check was right: the plan puts 96 `CN-VAR-1L` into it, so it leaves no room for keys. This is the reason the check starts from the plan's end state and not the current count.

## December orders: Large bins on 3 December, worked by hand

Worked from the Large bins in the table above (after the plan), before looking at `/december`. Large has 6 bins of 30. Assumptions: benches land on 3 Dec, orders leave on the day before delivery.

| Bin | After the plan | Product |
|---|---|---|
| `C-01-1` | 29 | two-seat benches |
| `C-01-2` | 18 | three-seat benches |
| `C-02-1` | 30 | three-seat benches |
| `C-02-2` | 12 | bistro tables |
| `C-03-1` | 20 | folding chairs |
| `C-03-2` | 7 | large planters |

**No changes.** Benches land: 29 + 40 = 69 two-seat benches, which is 30 + 30 + 9, so 3 bins. Three-seat benches 48 = 30 + 18, 2 bins. Tables, chairs, planters 1 bin each. Total 3 + 2 + 1 + 1 + 1 = **8 bins against 6**, so 2 short. Units are 69 + 48 + 12 + 20 + 7 = 156 of 180, so the problem is bins (one product per bin), not units. A bench cannot use the free space in any Small, Medium or Bulk bin (rule 4), and all four Bulk bins are used.

**Send `CO-8803` (24 three-seat benches) early, on 2 Dec.** Take 18 from `C-01-2` (empties it) and 6 from `C-02-1` (leaves 24). Three-seat benches now need 1 bin. Large is 5 bins in use with `C-01-2` free. Benches land: 69 needs 3 bins, so 3 + 1 + 1 + 1 + 1 = 7, still **1 short**.

**Split the benches into two batches of 20, each shipped the day it arrives.** First batch: 29 + 20 = 49 = 30 in `C-01-1` and 19 in `C-01-2`, so 2 bins and 6 in use (exactly 6 of 6). It leaves with 20 of `CO-8801`: 19 out of `C-01-2` and 1 out of `C-01-1`, back to 29. Second batch repeats it. No rule is broken: one product per bin, 30 ≤ 30, Large = Large.

**Result:** the hand count matches `/december`: 8 of 6 with no changes, 7 of 6 after dispatching early, 6 of 6 after the split. The same arithmetic also gives 6 of 6 once `CO-8801` and `CO-8802` leave on 3 Dec without any changes, and 5 of 6 after `CO-8803` leaves on 10 Dec.
