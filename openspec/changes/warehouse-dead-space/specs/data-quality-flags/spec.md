# Spec Delta

## Purpose

Finds problems in the store data, applies a careful, stated policy to each one, and shows the stores team what was found and what the plan did about it.

## ADDED Requirements

### Requirement: Store data problems are detected
The system SHALL detect bins holding more than one product, bins holding more than their capacity, bins with no capacity value, and counts older than the most recent count by more than a stated number of days.

#### Scenario: Mixed-product bin flagged
- **GIVEN** a bin holds two different products
- **WHEN** flags are generated
- **THEN** a flag names the bin, both products and their quantities

#### Scenario: Over-capacity bin flagged
- **GIVEN** a bin holds more units than its capacity
- **WHEN** flags are generated
- **THEN** a flag names the bin, its quantity and its capacity

#### Scenario: Missing capacity flagged
- **GIVEN** a bin has no capacity value
- **WHEN** flags are generated
- **THEN** a flag names the bin and states its capacity is unknown

#### Scenario: Stale count flagged
- **GIVEN** a bin's last count is older than the stated threshold relative to the newest count
- **WHEN** flags are generated
- **THEN** a flag names the bin and its count date

### Requirement: The stock count is treated as truth
The system SHALL treat the latest stock count as the true contents of every bin and SHALL NOT alter counted quantities to resolve a flag.

#### Scenario: Counted quantity is kept
- **GIVEN** a bin whose count exceeds its capacity
- **WHEN** the plan is produced
- **THEN** the planning input still shows the counted quantity for that bin

### Requirement: Over-capacity and unknown-capacity bins receive no new stock
The system SHALL NOT plan any receipt or merge into a bin that is over capacity or has unknown capacity.

#### Scenario: Over-capacity bin not used as a destination
- **GIVEN** a bin is over capacity
- **WHEN** the plan is produced
- **THEN** no move or putaway adds stock to that bin

#### Scenario: Unknown-capacity bin excluded from receipts
- **GIVEN** a bin has no capacity value
- **WHEN** the plan is produced
- **THEN** no incoming delivery is assigned to that bin
- **AND** its existing stock still counts toward units used

### Requirement: Mixed bins are corrected first
The system SHALL plan the removal of the minority product from a mixed-product bin as the first moves, to a bin that holds that product and has room.

#### Scenario: Oil moved out of the mixed bin
- **GIVEN** a bin holds 110 dowels and 12 oil, and another bin holds only oil with room for 12 more
- **WHEN** the plan is produced
- **THEN** the first move takes 12 oil from the mixed bin to the oil bin

### Requirement: Each flag shows its handling decision
The system SHALL show every flag with a plain statement of how the plan handles it.

#### Scenario: Flag panel lists decisions
- **WHEN** a user opens the data flags view
- **THEN** each flag appears with its bin, the problem, and the decision taken
