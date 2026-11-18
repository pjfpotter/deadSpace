# Warehouse dead space: Fernbrook Furniture Co.

## The scenario

Fernbrook is a small workshop that makes oak garden benches, bistro tables and folding chairs. Its stores hold everything from boxes of screws to raw timber boards and finished benches waiting to go to customers.

The stores manager says they're "full". But walk round and lots of bins are half empty. The same screws sit on two shelves, two bins each hold a handful of bench legs, and a couple of benches sit alone in a bin built for 30.

Next week, supplier deliveries and two production runs are due. As things stand, not all of it will fit. Fernbrook doesn't want to rent more space. It wants to use the space it already has properly.

Fernbrook is invented for this challenge. All names, suppliers and numbers are made up.

## The rules of the stores

1. **One product per bin.** A bin can hold several units of one product, never two different products.
2. **Capacity is counted in units.** Each bin holds up to its capacity in units, whatever the product. This is a simplification: in real life a bench takes more room than a box of screws.
3. **Bin codes read aisle, bay, shelf.** A-03-2 is aisle A, bay 3, shelf 2. Bulk areas are BULK-01 to BULK-04.
4. **Size classes.** Each product and each bin is Small, Medium, Large or Bulk. A product only goes in a bin of the matching size.

## The data

| File | What it tells you |
|---|---|
| bins.csv | Every storage location and how many units it holds |
| products.csv | What Fernbrook stocks, with size, cost, reorder point and supplier |
| stock.csv | What is in each bin now, from the latest count. Treat this as the truth |
| incoming.csv | Deliveries and production runs due next week |
| movements.csv | Eight weeks of history. It won't add up exactly to the stock count, just like real records |

Files link up through bin_code and sku (the product code).

## What to show at the end

Every team gives a 5-minute pitch using the Fernbrook data.

**Must have**
- How full the stores are: space used, empty bins, and bins under half full
- A list of merges: which product moves from which bin to which, and which bins that frees
- A plan for next week's incoming stock: which bin each delivery or production run goes into

**Nice to have**
- A "can we fit it?" check: enter a product and a quantity and see if it fits now or after merges
- Flags for data problems, and how you decided to handle each
- Something the stores team could use on the floor without help

**Stretch**
- Keep fast-moving items in easy-to-reach bins, using the movements history
- Spot products that will run out soon
- Turn capacity into real space, using product sizes

## Hints

- Real stores have data problems. Find them, decide how your solution handles each one, and say so.
- Not every pair of part-full bins can be combined. Two bins holding more than one bin's capacity have to stay as they are.
- Avoid moving stock twice. Plan each move once.
- Some incoming products have no stock yet, so each needs an empty bin.
- The incoming list is the real test. If it can't all fit, show what has to happen first to make room.
- Check your answer by hand on a few bins. A plan that looks clever but breaks the rules won't impress Fernbrook.
- Not everything in the files is needed to solve this. Use what you need.
