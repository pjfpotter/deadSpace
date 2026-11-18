# Spec Delta

## Purpose

Shows capacity as real space rather than raw units, using clearly labelled assumed weights by size class, because the data holds no product dimensions.

## ADDED Requirements

### Requirement: Space is estimated from size-class weights
The system SHALL convert units to space using an assumed space-per-unit value for each size class, held in one editable place.

#### Scenario: Space used calculated
- **GIVEN** an assumed weight for a size class and a bin holding some units of that class
- **WHEN** the real-space view loads
- **THEN** the bin's space used equals units multiplied by the weight

### Requirement: Assumptions are labelled
The system SHALL state wherever real space is shown that the weights are assumptions and that the data has no product dimensions.

#### Scenario: Assumption label visible
- **WHEN** the real-space view loads
- **THEN** a visible note says the weights are assumed

### Requirement: Real space does not change the plan
The system SHALL keep the capacity-in-units rule for all merges and putaway, and SHALL present real space as information only.

#### Scenario: Plan identical with real space on
- **WHEN** the real-space view is shown
- **THEN** the merge list and putaway plan are the same as without it

### Requirement: Real space exposes a poor fit
The system SHALL show the units-based fill and the real-space fill side by side for each size class.

#### Scenario: Side by side
- **WHEN** the real-space view loads
- **THEN** each size class shows percentage full by units and by estimated space
