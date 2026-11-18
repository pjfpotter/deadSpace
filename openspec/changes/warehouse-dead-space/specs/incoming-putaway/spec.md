# Spec Delta

## Purpose

Tells the stores team which bin each incoming delivery or production run goes into, and what must happen first when it cannot all fit as the stores stand.

## ADDED Requirements

### Requirement: Every incoming line is assigned to bins
The system SHALL assign each incoming reference, product and quantity to one or more bins, covering the full quantity.

#### Scenario: Full quantity placed
- **GIVEN** an incoming line of 48 units of a product
- **WHEN** the putaway plan is produced
- **THEN** the quantities assigned to bins for that line total 48

### Requirement: Existing bins of the same product are used first
The system SHALL top up bins that already hold the product, up to capacity, before using an empty bin.

#### Scenario: Top up before empty bin
- **GIVEN** the product's bin has room for 12 units and the incoming quantity is 30
- **WHEN** the putaway plan is produced
- **THEN** 12 units go to that bin and only the remaining 18 go to another bin

### Requirement: Products with no stock get an empty bin
The system SHALL assign a product that holds no stock to an empty bin of its own size class.

#### Scenario: New product placed in empty bin
- **GIVEN** an incoming product has no stock and an empty bin of its size class exists
- **WHEN** the putaway plan is produced
- **THEN** it is assigned to that empty bin

### Requirement: Putaway follows the merges
The system SHALL plan putaway against the state after the merge list is applied, so freed bins can receive stock.

#### Scenario: Freed bins used for receipts
- **GIVEN** only one empty Medium bin exists and two Medium products with no stock are incoming
- **WHEN** the putaway plan is produced
- **THEN** a merge that frees a Medium bin appears before the second putaway
- **AND** the plan identifies that merge as the one that makes room

### Requirement: Receipts respect the store rules and flags
The system SHALL place receipts only where the store rules allow and SHALL NOT use over-capacity or unknown-capacity bins.

#### Scenario: Unknown-capacity bin avoided
- **WHEN** a Bulk delivery is planned
- **THEN** it is not assigned to a bin with no capacity value

### Requirement: Shortfalls are explained
The system SHALL, when an incoming line cannot be placed in full, state the units that cannot be placed and what must happen first to make room.

#### Scenario: Not everything fits
- **GIVEN** no combination of bins can hold an incoming line in full
- **WHEN** the putaway plan is produced
- **THEN** it reports the unplaced quantity for that line
- **AND** it states the action needed to make room, such as an extra bin or moving stock out
