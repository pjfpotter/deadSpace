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
