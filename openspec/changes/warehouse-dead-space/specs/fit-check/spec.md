# Spec Delta

## Purpose

Lets the stores team ask whether a given quantity of a product fits in the stores, now and after the merges, before agreeing to take it.

## ADDED Requirements

### Requirement: A product and quantity can be checked
The system SHALL accept a product and a whole-number quantity greater than zero and report whether it fits now and whether it fits after the merges.

#### Scenario: Fits now
- **GIVEN** a product whose existing bins have room for the quantity
- **WHEN** the user checks that product and quantity
- **THEN** the result says it fits now and names the bins and how many units go in each

#### Scenario: Fits only after merges
- **GIVEN** a quantity that needs a bin that only the merges free
- **WHEN** the user checks it
- **THEN** the result says it fits after merges and names the merge that frees the bin

#### Scenario: Does not fit
- **GIVEN** a quantity larger than all room available
- **WHEN** the user checks it
- **THEN** the result says it does not fit and states how many units are short

#### Scenario: Quantity spread over several bins
- **GIVEN** no single bin has room for the whole quantity but the bins together do
- **WHEN** the user checks it
- **THEN** the result says it fits and lists each bin with its share, filling bins that already hold the product before using empty bins

### Requirement: The check follows the store rules
The system SHALL count only room allowed by the store rules: same-product bins with spare capacity and empty bins of the right size class, excluding flagged bins. A bin of unknown capacity, an over-capacity bin and a mixed bin SHALL NOT be counted as room. A bin with only a stale count is still counted, as in the plan, because stale counts are flagged only.

#### Scenario: Wrong size class ignored
- **GIVEN** empty bins exist only in other size classes
- **WHEN** the user checks a product
- **THEN** those bins are not counted as room

#### Scenario: Flagged bin ignored
- **GIVEN** a bin of the right size class is flagged (for example `BULK-04`, unknown capacity)
- **WHEN** the user checks a Bulk product
- **THEN** that bin is not counted, and the result says flagged bins were left out

#### Scenario: Over-capacity bin has no spare room
- **GIVEN** a bin already holds more than its capacity
- **WHEN** the user checks the product in it
- **THEN** its spare room is zero, not negative, and it does not reduce the room found elsewhere

### Requirement: Both answers use the same state as the plan
The system SHALL compute "now" from the latest count and "after merges" from the stock the plan leaves after its merge moves and next week's putaways. Room already claimed by next week's incoming stock SHALL NOT be offered again, and the result SHALL say that incoming is included.

#### Scenario: Incoming stock claims room
- **GIVEN** next week's incoming plan fills the only empty Medium bin
- **WHEN** the user checks a Medium product with no stock
- **THEN** the "after merges" answer does not count that bin

#### Scenario: Plan failed validation
- **GIVEN** the plan does not pass the validator
- **WHEN** the user opens the fit check
- **THEN** the "after merges" answer is withheld with a message, and "now" is still shown

### Requirement: Invalid input is rejected clearly
The system SHALL reject an unknown product, a zero or negative quantity, or a non-integer quantity with a message saying what is wrong.

#### Scenario: Unknown product
- **WHEN** the user enters a product code that does not exist
- **THEN** the system says the product is unknown and does not report a result

#### Scenario: Zero quantity
- **WHEN** the user enters a quantity of 0
- **THEN** the system asks for a quantity greater than zero

#### Scenario: Fractional quantity
- **WHEN** the user enters 2.5
- **THEN** the system asks for a whole number

### Requirement: The check is instant
The system SHALL give a fit-check answer without waiting on the solver or any LLM. The answer is computed from the stored plan and stock only.

#### Scenario: Answer without external calls
- **WHEN** the user submits a check
- **THEN** the answer appears without a network request to an LLM and without re-running the solver

### Requirement: The check never changes the plan
The system SHALL treat a fit check as a read-only question: it does not reserve room, add moves or alter the putaway plan.

#### Scenario: Plan unchanged after a check
- **WHEN** the user runs several checks
- **THEN** the merges, putaway and floor checklist are identical to before
