# Spec Delta

## Purpose

When the orders do not fit, says what has to give, in what order, and how far each step gets us.

## ADDED Requirements

### Requirement: Levers are ordered by disruption
The system SHALL list levers in this order and, after each, show bins freed and bins still short at the peak: (1) the merges already in the plan; (2) dispatch an order early (quantity, order, new date); (3) stagger the bench receipt into batches or move its arrival date; (4) cross-dock CO-8801 so benches go from the line to the dock without a bin; (5) changes that need a decision from the stores manager, for example a temporary staging area for benches, or allowing Large goods in a Bulk bin that has been emptied first (no Bulk bin is free today: BULK-01 to BULK-03 hold stock and BULK-04 has unknown capacity). Levers 1 to 4 SHALL keep every store rule; lever 5 SHALL be labelled as a rule change and never applied silently.

#### Scenario: Dispatch early closes part of the gap
- **GIVEN** a peak of 8 Large bins against 6
- **WHEN** CO-8803 (24 × `FG-BEN-3S`) is dispatched before the benches arrive
- **THEN** `FG-BEN-3S` falls from 48 to 24 units, needs 1 bin instead of 2, and the shortfall falls to 1 bin

#### Scenario: Remaining gap needs a bench lever
- **GIVEN** a shortfall of 1 bin after early dispatch
- **WHEN** the benches are cross-docked (arrive and leave the same day) or the receipt is split so no more than 2 bins of benches are held
- **THEN** the Large peak is 6 bins or fewer and fits, and the page states which assumption that depends on

#### Scenario: Nothing helps without a rule change
- **GIVEN** no combination of levers 1 to 4 fits
- **WHEN** the options are built
- **THEN** the page says so, shows the remaining shortfall, and lists lever 5 options as decisions with their risks

### Requirement: Each step is verified
Each lever SHALL be applied to a copy of the projection and re-checked by the timeline and the validator. The page SHALL show the result of the combination of steps, not just each in isolation, because levers overlap.

#### Scenario: Combined result
- **GIVEN** the chosen sequence of levers
- **WHEN** the combined projection is built
- **THEN** the peak, the bins needed per class and the validator result are shown for the whole sequence

### Requirement: Needed decisions are named
The system SHALL name who must agree each step (customer for early dispatch, production for batching, stores manager for a rule change) and the latest date it can still be done.

#### Scenario: Early dispatch deadline
- **GIVEN** the early dispatch lever
- **WHEN** it is displayed
- **THEN** it shows the date by which the dispatch must happen to be before the bench receipt
