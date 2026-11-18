# Spec Delta

## Purpose

Answers "can the stores hold them?" by showing bins needed against bins available, per size class, on each date, with the arithmetic visible.

## ADDED Requirements

### Requirement: Stock is projected by date
The system SHALL start from the stock state after the existing plan's moves and putaways, then apply receipts and dispatches in date order. Receipts are the existing Incoming lines plus the bench receipt; dispatches are the three orders, leaving the stores on the day before delivery by default (lead time is an input, default one day). Dispatches SHALL draw from stock on hand of that SKU; a dispatch larger than stock on hand is reported as a shortfall, not silently clipped.

#### Scenario: Projection on the peak day
- **GIVEN** the default assumptions
- **WHEN** the projection is built for 2026-12-03
- **THEN** `FG-BEN-2S` is 69 (29 on hand plus 40), `FG-BEN-3S` is 48, `FG-CHR-FLD` is 20 and the table and planter are unchanged

#### Scenario: Dispatch exceeds stock
- **GIVEN** an order larger than the stock of its SKU on its dispatch date
- **WHEN** the projection is built
- **THEN** the result reports the shortfall for that order

### Requirement: Bins needed are computed per product and size class
For each date and size class the system SHALL compute, for every product, `ceil(units / bin capacity)` bins of that product's size class (one product per bin), sum them, and compare to the usable bins of that class. Flagged bins that cannot take stock (unknown capacity, over capacity) SHALL NOT count as available. A product SHALL only be counted in bins of its own size class: a bench never counts against Small, Medium or Bulk.

#### Scenario: Large peak does not fit
- **GIVEN** the default assumptions and the existing plan end state
- **WHEN** bins needed are computed for 2026-12-03
- **THEN** Large needs 8 bins (2S 3, 3S 2, table 1, chair 1, planter 1) against 6 available, and the page states the shortfall of 2 bins

#### Scenario: Large is back within its bins once the first two orders leave
- **GIVEN** the default assumptions
- **WHEN** CO-8801 and CO-8802 leave on 2026-12-03 and, later, CO-8803 leaves on 2026-12-10
- **THEN** Large needs 6 bins of 6 after the first two leave, and 5 of 6 after CO-8803 leaves

#### Scenario: Other classes unaffected
- **GIVEN** the same projection
- **WHEN** Small, Medium and Bulk are computed
- **THEN** each is reported as fitting, with its figures shown

### Requirement: The working is shown
The system SHALL display, per product on the peak day, the units, the bin capacity, the bins needed and the formula, and SHALL display the peak date and the dates on which Large exceeds its bins.

#### Scenario: Working visible
- **GIVEN** the Large shortfall above
- **WHEN** the user opens the December page
- **THEN** each Large product shows "units ÷ capacity → bins", the total, the bins available, and the days of shortfall

### Requirement: The projection is checked by the validator
The system SHALL express any placement it shows as steps checked by the existing `validatePlan` rules and SHALL show violations instead of a placement if the check fails.

#### Scenario: Placement passes
- **GIVEN** a December placement that fits
- **WHEN** it is validated
- **THEN** it passes all store rules including one product per bin and size class match
