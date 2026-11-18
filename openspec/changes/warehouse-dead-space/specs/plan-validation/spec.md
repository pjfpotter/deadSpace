# Spec Delta

## Purpose

Gives an independent check that any plan, from whatever source, obeys the store rules and conserves stock, so a plan that looks clever but breaks the rules is caught.

## ADDED Requirements

### Requirement: Plans are checked against the store rules
The system SHALL verify a plan's final state for one product per bin, capacity limits, size-class match and valid bin codes.

#### Scenario: Two products in one bin
- **GIVEN** a plan whose final state puts two products in one bin
- **WHEN** it is validated
- **THEN** validation fails and names the bin and both products

#### Scenario: Capacity exceeded
- **GIVEN** a plan whose final state holds 130 units in a bin of capacity 120
- **WHEN** it is validated
- **THEN** validation fails and names the bin, quantity and capacity

#### Scenario: Wrong size class
- **GIVEN** a plan placing a Large product in a Small bin
- **WHEN** it is validated
- **THEN** validation fails and names the product and bin

### Requirement: Stock is conserved
The system SHALL verify that, for every product, final units equal counted units plus incoming units, and that no move takes more than a bin holds.

#### Scenario: Units lost
- **GIVEN** a plan whose final total for a product is less than counted plus incoming
- **WHEN** it is validated
- **THEN** validation fails and states the missing units

#### Scenario: Move exceeds bin contents
- **GIVEN** a move of 20 units from a bin holding 14
- **WHEN** it is validated
- **THEN** validation fails and names the move

### Requirement: No stock is moved twice
The system SHALL verify that no stock is moved into a bin and later moved out of it.

#### Scenario: Chained move
- **GIVEN** a plan that moves units from bin X to Y and then from Y to Z
- **WHEN** it is validated
- **THEN** validation fails and names both moves

### Requirement: Flag policy is enforced
The system SHALL verify that no plan adds stock to a bin that is over capacity or has unknown capacity.

#### Scenario: Receipt into unknown-capacity bin
- **GIVEN** a plan assigns a delivery to a bin with no capacity value
- **WHEN** it is validated
- **THEN** validation fails and names the bin

### Requirement: The validator is independent of the solver
The system SHALL run validation separately from plan generation, so it can check plans that did not come from the solver.

#### Scenario: Hand-written plan checked
- **GIVEN** a plan written by hand
- **WHEN** it is validated
- **THEN** the validator returns a pass or the list of violations without using the solver

#### Scenario: Generated plan always validated
- **WHEN** the solver produces a plan for display
- **THEN** the plan passes validation before it is shown, or the app shows the violations instead
