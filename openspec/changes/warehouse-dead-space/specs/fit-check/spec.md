# Spec Delta

## Purpose

Lets the stores team ask whether a given quantity of a product fits in the stores, now and after the merges, before agreeing to take it.

## ADDED Requirements

### Requirement: A product and quantity can be checked
The system SHALL accept a product and a whole-number quantity greater than zero and report whether it fits now and whether it fits after the merges.

#### Scenario: Fits now
- **GIVEN** a product whose existing bins have room for the quantity
- **WHEN** the user checks that product and quantity
- **THEN** the result says it fits now and names the bins

#### Scenario: Fits only after merges
- **GIVEN** a quantity that needs a bin that only the merges free
- **WHEN** the user checks it
- **THEN** the result says it fits after merges and names the merge that frees the bin

#### Scenario: Does not fit
- **GIVEN** a quantity larger than all room available
- **WHEN** the user checks it
- **THEN** the result says it does not fit and states how many units are short

### Requirement: The check follows the store rules
The system SHALL count only room allowed by the store rules: same-product bins with spare capacity and empty bins of the right size class, excluding flagged bins.

#### Scenario: Wrong size class ignored
- **GIVEN** empty bins exist only in other size classes
- **WHEN** the user checks a product
- **THEN** those bins are not counted as room

### Requirement: Invalid input is rejected clearly
The system SHALL reject an unknown product, a zero or negative quantity, or a non-integer quantity with a message saying what is wrong.

#### Scenario: Unknown product
- **WHEN** the user enters a product code that does not exist
- **THEN** the system says the product is unknown and does not report a result

#### Scenario: Zero quantity
- **WHEN** the user enters a quantity of 0
- **THEN** the system asks for a quantity greater than zero

### Requirement: The check is instant
The system SHALL give a fit-check answer without waiting on the solver or any LLM.

#### Scenario: Answer without external calls
- **WHEN** the user submits a check
- **THEN** the answer appears without a network request to an LLM
