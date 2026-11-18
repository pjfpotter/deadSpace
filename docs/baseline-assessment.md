# Fernbrook stores: baseline assessment

V2 · 18 Nov 2026 · supersedes `business-case-notes.md`

The stores aren't full. They're 48% full by units, and only two of 34 bins are empty. As things stand, two of next week's six incoming lines (58 units) have nowhere to go. Six merges that move 103 units free five bins, and all 534 incoming units then fit with no rule broken.

In floor terms, about 27.5 m² of the 62 m² stores is idle today, and the plan brings that down to 17.5 m². Against hiring overflow space, it saves about £3,100 a year and pays back in about 3 months. The m² and £ figures are assumptions, listed in the assumptions register below.

## Before and after consolidation

Consolidation turns a store that can't take next week's deliveries into one that takes all of them, with three bins still spare. "Before" is the 14 Nov count. "After" is the plan plus next week's receipts. Stock value and turns are six-month targets. £ and m² figures rest on the assumptions register.

| Measure | Before | After consolidation | Change |
|---|---|---|---|
| Bins and units |  |  |  |
| Units held | 1,629 | 2,163 (incl. 534 received) | +534 |
| % of known capacity used | 48% | 63% | +15 pts |
| Empty bins | 2 | 3 after receipts (7 after merges) | +1 |
| Bins under half full | 17 | 8 | −9 |
| Products split across two bins | 9 | 4 | −5 |
| Mixed-product bins | 1 (A-04-2) | 0 | −1 |
| Bins breaking store rules | 2 (A-04-2, B-03-2) | 1 (B-03-2, awaiting recount) | −1 |
| Incoming units with nowhere to go | 58 (WO-1032, WO-1033) | 0 | −58 |
| Stock moves needed | – | 6 moves, 103 units | one-off |
| Floor space |  |  |  |
| Idle floor area | 27.5 m² (50%) | 17.5 m² (31%) | −10.0 m² |
| Floor freed by merges | – | 6.1 m² (5 bins) | +6.1 m² |
| Extra floor needed for next week | 4.35 m² | 0 m² | −4.35 m² |
| Cost of idle floor at £165/m² | £4,539 a year | £2,883 a year | −£1,656 |
| Money |  |  |  |
| Overflow storage and handling | £3,732 a year | – | −£3,732 |
| Running the plan | – | £617 a year (+£852.50 one-off) | +£617 |
| Net saving | – | £3,115 a year, payback about 3.3 months |  |
| Stock turns (6-month target) |  |  |  |
| Average stock value at cost | £32,404 | £30,784 | −£1,620 (−5%) |
| Stock turns (sales ÷ stock) | 13.0 | 13.6 | +0.6 |
| Days of stock (cost of sales) | 51 | 49 | −2 days |

The moves: 12 oil out of mixed bin A-04-2 into A-04-3, then five merges: brackets B-02-2→B-02-1 (22), bench legs B-01-2→B-01-1 (14), two-seat benches C-01-2→C-01-1 (5), coach bolts A-02-1→A-01-3 (30) and hinges A-02-3→A-02-2 (20). B-01-2 then takes the tabletops and C-01-2 the extra three-seat benches. Screws and cartons are deliberately left split, because the deliveries need both bins anyway.

Figures come from the sanitised Fernbrook count in the repo (fixtures/, latest count 14 Nov 2026) and from the team's own greedy solver, which the independent validator passes with zero violations.

## What the data does and doesn't hold

There are no physical dimensions anywhere: no floor area, no rack or bin sizes, and no product sizes. The brief says outright that capacity is counted in units, and calls this a simplification. "Size" is only a class (Small, Medium, Large, Bulk) shared by products and bins. The only m³ figures in the repo are the team's own illustrative guesses for the stretch "real space" view.

There are no money figures in the repo either. The raw products.csv does have unit_cost_gbp, but ingest drops it, so only the developer holding the raw files can supply stock values.

| Available | Not available |
|---|---|
| 34 bins: code, zone, size class, capacity in units | Floor area, rack or bin dimensions (m, m², m³) |
| 27 products: code, name, category, size class | Product dimensions or weights |
| Latest count per bin (7–14 Nov 2026) | Rent per m², cost of extra space |
| 6 incoming lines, 24–27 Nov 2026 | Labour rates, time per move or pick |
| 312 movements over 8 weeks (raw only) | Unit costs (raw only, dropped at ingest) |

## How full the stores are now

Every size class is between 43% and 57% full by units. 17 of the 32 occupied bins are less than half full.

| Size class | Bins | Capacity (units) | Units held | % used | Empty bins | Under half full |
|---|---|---|---|---|---|---|
| Small | 15 | 1,800 | 769 | 43% | 1 (A-05-1) | 9 |
| Medium | 9 | 540 | 264 | 49% | 1 (B-03-3) | 4 |
| Large | 6 | 180 | 86 | 48% | 0 | 3 |
| Bulk | 4 | 900 | 510 | 57% | 0 | 1 |
| Total | 34 | 3,420 | 1,629 | 48% | 2 | 17 |

Bulk excludes BULK-04 (150 bubble-wrap rolls, capacity blank) from both units and capacity. Counting its stock against the other three bins' capacity gives the 73% in design.md, which overstates Bulk.

## Where the dead space is

Nine products are split across two bins, using 18 bins where 9 or 10 would do. Most of the dead space comes from these splits.

| Product | Size | Bins (units) | Combined, one bin's capacity |
|---|---|---|---|
| FX-SCR-440 screws | Small | A-01-1 (70), A-01-2 (35) | 105 / 120 |
| FX-BLT-M8 coach bolts | Small | A-01-3 (48), A-02-1 (30) | 78 / 120 |
| FX-HNG-BRS hinges | Small | A-02-2 (95), A-02-3 (20) | 115 / 120 |
| CN-SND-120 sanding discs | Small | A-03-2 (90), A-03-3 (40) | 130 / 120, must stay split |
| CN-OIL-1L oil | Small | A-04-2 (12, mixed bin), A-04-3 (35) | 47 / 120 |
| CP-LEG-BEN bench legs | Medium | B-01-1 (40), B-01-2 (14) | 54 / 60 |
| CP-BRK-STL brackets | Medium | B-02-1 (25), B-02-2 (22) | 47 / 60 |
| FG-BEN-2S two-seat benches | Large | C-01-1 (24), C-01-2 (5) | 29 / 30 |
| PK-CTN-BEN cartons | Bulk | BULK-01 (180), BULK-02 (90) | 270 / 300 |

The count also has four data problems, which the plan works around rather than fixes:

- A-04-2 holds two products (110 dowels + 12 oil) and is over capacity (122 / 120).
- B-03-2 is over capacity (66 cushions / 60). It needs a recount.
- BULK-04 has no capacity recorded.
- 11 bins were last counted on 7 Nov, a week before the newest count (14 Nov).
## Next week's incoming, with no changes

With no changes, 476 of the 534 incoming units fit and 58 don't. The shortfall is one Medium bin and one Large bin. Small and Bulk have room.

| Due | Ref | Product | Size | Units | Room as the stores stand | Fits? |
|---|---|---|---|---|---|---|
| 24 Nov | PO-4417 | CN-VAR-1L varnish (new) | Small | 96 | Empty A-05-1 | Yes |
| 24 Nov | WO-1031 | CP-ARM-PR armrests (new) | Medium | 48 | Empty B-03-3, the only empty Medium bin | Yes |
| 25 Nov | WO-1032 | CP-TOP-BIS tabletops (new) | Medium | 40 | None, needs a second empty Medium bin | No, 40 short |
| 25 Nov | PO-4419 | FX-SCR-440 screws | Small | 120 | 135 spare in A-01-1 and A-01-2 | Yes |
| 26 Nov | PO-4420 | PK-CTN-BEN cartons | Bulk | 200 | 330 spare in BULK-01 and BULK-02 | Yes |
| 27 Nov | WO-1033 | FG-BEN-3S three-seat benches | Large | 30 | 12 spare in C-02-1, no empty Large bin | No, 18 short |

Both blocked lines are in-house production runs, so the shortfall would hold up finished goods and parts coming off the line, not supplier deliveries.

## Square metres by size class (assumed)

The stores take up about 62 m² of floor, including aisles. Half of the 55 m² with known capacity (27.5 m²) is standing idle today. After the plan, 17.5 m² is idle, and that's with next week's stock already in. The bin codes give the layout: Small and Medium are 3 shelves per bay, Large is 2 beam levels, and Bulk is floor bays.

| Size class | Storage type (assumed) | Bay W × D (m) | Clear height per bin (m) | Aisle (m) | Bays | m² per bin (incl. ½ aisle) | m³ per bin | Total m² |
|---|---|---|---|---|---|---|---|---|
| Small | Longspan shelving, 3 shelves | 1.2 × 0.6 | 0.5 | 1.0 | 5 | 0.44 | 0.36 | 6.6 |
| Medium | Heavy shelving, 3 shelves | 1.8 × 0.8 | 1.0 | 1.2 | 3 | 0.84 | 1.44 | 7.6 |
| Large | Pallet racking, 2 levels | 2.7 × 1.1 | 1.8 | 3.0 (pallet truck) | 3 | 3.51 | 5.35 | 21.1 |
| Bulk | Marked floor bays, stacked 1.2 m | 2.5 × 1.2 | 1.2 | 3.0 | 4 | 6.75 | 3.60 | 27.0 |
| Total |  |  |  |  | 15 |  |  | 62.2 |

Reconciling square metres with unit capacity. Each class is given an average space per unit, and at full stated capacity every class comes out about 83% packed. That's realistic for hand-stacked stores and confirms the unit capacities are physically sensible:

| Size class | Space per unit (m³) | Capacity × space per unit | Bin volume | Packed at capacity | Check against products |
|---|---|---|---|---|---|
| Small | 0.0025 | 120 × 0.0025 = 0.30 m³ | 0.36 m³ | 83% | A 1 L tin of oil or varnish, or a box of 200 screws, is 1–3 L |
| Medium | 0.02 | 60 × 0.02 = 1.20 m³ | 1.44 m³ | 83% | Bench legs, slat sets, cushions; 1.8 m shelf fits a 1.5 m slat set |
| Large | 0.15 | 30 × 0.15 = 4.50 m³ | 5.35 m³ | 84% | Benches boxed flat in bench cartons (about 1.25 × 0.5 × 0.2 m) |
| Bulk | 0.01 | 300 × 0.01 = 3.00 m³ | 3.60 m³ | 83% | Flat cartons and 2.4 m oak boards; bay length 2.5 m set by the boards |

Three things don't reconcile, and the pitch should say so:

- Small at 0.005 m³ per unit (the figure in design.md) would need 0.6 m³ per bin, 1.7× the shelf. The doc uses 0.0025 instead, and design.md should be updated to match.
- BULK-04 holds 150 bubble-wrap rolls. At 0.01 m³ that's 1.5 m³, but a real 500 mm roll is closer to 0.1 m³, which would be 15 m³ and four times the bay. Measure it before planning anything into it.
- Units vs space: the solver treats a bench and a box of screws alike within a class, as the brief allows. Square metres are shown for information only and never change the plan.
## Business case (assumed figures)

The plan saves about £3,100 a year against renting overflow space, and pays back in about 3 months. Today Fernbrook pays roughly £10,300 a year to occupy its stores and leaves £4,500 of that floor idle.

Do nothing. Next week's 4.35 m² shortfall has to go somewhere. The cheapest route is a 20 ft container on site, kept year-round because the squeeze comes back with every production run.

| Do-nothing cost | Basis | £ a year |
|---|---|---|
| 20 ft container hire | £18/week, 4-week minimum, 52 weeks | 936 |
| Container racking | £13/week, 52 weeks | 676 |
| Delivery and collection | Assumed £150 each way | 300 |
| Double handling to and from the container | 2 h/week at £17.50 loaded | 1,820 |
| Total |  | 3,732 |

The smallest local unit is dearer, at £2,400–£4,800 a year for 132–264 ft² in Hailsham before travel. Holding a production run instead would cost an assumed £600 per lost day, and this week alone has two at risk (WO-1032, WO-1033).

With the plan.

| Cost of the plan | Basis | One-off £ | £ a year |
|---|---|---|---|
| Carry out 6 moves, recount B-03-2, measure BULK-04 | 3 h at £17.50 | 52.50 |  |
| Make the hackathon app production-ready | 2 developer days at £400 | 800 |  |
| Hosting | Vercel Pro, about £16/month |  | 192 |
| Monthly re-plan and count check | 2 h/month at £17.50 |  | 420 |
| AI move wording | Pennies per run |  | 5 |
| Total |  | 852.50 | 617 |

| Result | £ |
|---|---|
| Net saving per year (3,732 − 617) | 3,115 |
| Payback on 852.50 one-off | about 3.3 months |
| Net benefit over 3 years | 8,492 |
| If the do-nothing cost is only half | 1,249 a year, payback about 8 months |

This is a conservative figure. Faster picking from fewer split bins, fewer production delays, and the data fixes (mixed bin, over-capacity bin, unknown capacity) are left uncounted.

## Success measure: stock turns

Stock turns are about 13.0 today (assumed). The target is 13.6 within six months from consolidation alone, and 14.4 with reorder discipline added.

Definition. Stock turns = sales over the last 12 months ÷ average stock value at cost. Use the average of the monthly counts, not a single count. Next week's £12,700 of receipts alone would drop a one-day snapshot to 9.3. The accountants' version uses cost of sales instead of sales, and it's shown alongside so the two aren't confused.

Baseline. The counted stock (14 Nov 2026), valued at assumed unit costs, comes to £32,400:

| Category | Stock value at cost (£) | Share |
|---|---|---|
| Finished goods | 13,245 | 41% |
| Raw materials (oak boards) | 6,720 | 21% |
| Packaging | 4,164 | 13% |
| Components | 4,086 | 13% |
| Consumables | 2,154 | 7% |
| Fixings | 2,034 | 6% |
| Total | 32,404 | 100% |

Why consolidation should move it. Moving stock between bins doesn't change its value, so the bin moves on their own won't change turns. The gain comes from what consolidation makes visible. The nine products split across two bins hold £10,472 (32% of stock). A half-empty second bin is easy to miss, and that leads to reordering too early or ordering extra "to be safe". With one location per product, reorders can be based on the true total. Assume that trims split-product stock by 15% (£1,600), or about 5% of all stock. Setting reorder points from the run-out view (a stretch feature) could take total stock down 10%.

| Measure | Baseline | 6-month target (consolidation) | Stretch (+ reorder points) |
|---|---|---|---|
| Average stock value at cost | £32,404 | £30,784 (−5%) | £29,164 (−10%) |
| Stock turns (sales ÷ stock) | 13.0 | 13.6 | 14.4 |
| Turns on cost of sales | 7.1 | 7.5 | 7.9 |
| Days of stock (cost of sales basis) | 51 | 49 | 46 |
| Cash released | – | £1,620 | £3,240 |
| Carrying cost saved at 20% a year | – | £324 a year | £648 a year |

Guardrails. Turns must not rise by starving the workshop. The measure only counts as a success if all of these hold:

- Sales are no lower than the baseline year.
- There are no more out-of-stock lines than today (3, all with receipts due 24–25 Nov).
- No production run is held for lack of space or parts.
- At least 3 empty bins are kept after receipts, the same as after the plan.
How it's tracked. Each monthly count gives a stock value. Sales come from the accounts. Unit costs are commercially sensitive rather than personal data, but the data-minimisation spec drops them, so the ingest step should publish only the total value per category, never per-line costs.

## Assumptions register

Fernbrook is invented, so every £ and m² figure above is an assumption, and the pitch should say so. Market rates are real figures for East Sussex in 2026. Swap in Fernbrook's actual figures wherever they exist.

| Assumption | Value used | Basis |
|---|---|---|
| Bay sizes, heights, aisle widths | As in the square-metres table | Typical shelving and pallet racking; Bulk bay sized to 2.4 m oak boards |
| Space per unit | Small 0.0025, Medium 0.02, Large 0.15, Bulk 0.01 m³ | Gives about 83% packing at full capacity in every class |
| Occupancy cost | £165 per m² a year | Rent about £9.50/ft² (£102/m²) in Hailsham, plus about 50% for business rates and £10/m² for service and insurance |
| Stores labour | £17.50/h loaded | National Living Wage £12.71 from April 2026; storeperson on £13.50 plus about 30% on-costs |
| Container hire | £18/week, racking £13/week, 4-week minimum | UK hire list prices, excluding VAT |
| Delivery and collection | £150 each way | Assumed; suppliers quote this separately |
| Lost production day | £600 | Assumed: 2 workshop staff plus overhead for a day |
| Time per move | About 10 minutes | Assumed: locate, move, update records |
| Developer day | £400 | Assumed contractor rate |
| Unit costs | Fixings £1.50–£6.50; consumables £8.50–£12.50; components £7.50–£42; finished goods £60–£240; cartons £3.20; oak board £28; bubble wrap £22 | Assumed; the real figures are in the raw products.csv (unit_cost_gbp) |
| Annual sales | £420,000 | Assumed for a small bench and table workshop, about £8,100 a week |
| Cost of sales | 55% of sales (£231,000) | Assumed |
| Stock reduction from consolidation | 15% of split-product stock (5% of total); 10% total with reorder points | Assumed; a hypothesis to test against monthly counts |
| Stock carrying cost | 20% of stock value a year | Assumed: capital, insurance, damage, obsolescence |

Still only in the raw data: unit costs (unit_cost_gbp). The developer can give a total stock value, not per-line costs, if the pitch wants one.

## Sources

- Brief and sanitised fixtures/: pjfpotter/deadSpace, commit a9cf1ae
- Hailsham rent: Unit 7, Station Road Industrial Estate, £9.50/ft²; small units, Diplocks Way, £2,400–£4,800 a year
- Container hire: Portable Space 20 ft steel store, £18/week, racking £13/week; 4-week minimum
- Wages: GOV.UK, National Living Wage £12.71 from April 2026
