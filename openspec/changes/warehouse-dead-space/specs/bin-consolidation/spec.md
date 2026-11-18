# Spec Delta

## Purpose

Produces a list of merges that gathers each product into as few bins as the store rules allow, freeing whole bins without breaking any rule or moving stock twice.

## ADDED Requirements

### Requirement: Merge list names product, source, destination and result
The system SHALL list each move as product, from bin, to bin and quantity, and SHALL state which bins the plan frees.

#### Scenario: Bench legs merged
- **GIVEN** `CP-LEG-BEN` is held as 40 units in `B-01-1` and 14 in `B-01-2`, each bin with capacity 60
- **WHEN** the merge list is produced
- **THEN** it contains one move of 14 units from `B-01-2` to `B-01-1`
- **AND** it states `B-01-2` is freed

### Requirement: Merges respect the store rules
The system SHALL only produce moves that keep one product per bin, stay within capacity and put each product in a bin of its own size class.

#### Scenario: Product too large for one bin stays split
- **GIVEN** a product totals more units than any single bin of its size class can hold
- **WHEN** the merge list is produced
- **THEN** that product keeps the fewest bins that can hold it
- **AND** no bin exceeds its capacity

#### Scenario: Different products never combined
- **WHEN** the merge list is produced
- **THEN** no move places a product in a bin that holds a different product

### Requirement: Each stock movement is planned once
The system SHALL NOT move the same stock more than once, nor move stock into a bin that is later emptied.

#### Scenario: No chained moves
- **WHEN** the merge list is produced
- **THEN** no bin appears as both a destination and a source of stock for the same product

### Requirement: Fewest bins used, then fewest units moved
The system SHALL choose the plan that leaves the fewest bins occupied and, among those, moves the fewest units.

#### Scenario: Smaller stock moves into the fuller bin
- **GIVEN** a product held as 70 units in one bin and 35 in another, both with capacity 120
- **WHEN** the merge list is produced
- **THEN** the 35 units move into the bin holding 70

### Requirement: Locked bins are not merge destinations
The system SHALL NOT use over-capacity or unknown-capacity bins as merge destinations, as set out in the data quality flags.

#### Scenario: Locked bin untouched as destination
- **GIVEN** a bin is flagged as over capacity
- **WHEN** the merge list is produced
- **THEN** no move adds stock to it

### Requirement: Merge result is reproducible
The system SHALL produce the same merge list for the same sanitised input.

#### Scenario: Repeated run identical
- **WHEN** the plan is produced twice from the same input
- **THEN** both runs return identical moves
