# Spec Delta

## Purpose

Suggests keeping the products picked most often in the bins that are easiest to reach, using the movement history, so everyday picking is quicker.

## ADDED Requirements

### Requirement: Products are ranked by pick frequency
The system SHALL rank products within each size class by their number of outbound movements in the history.

#### Scenario: Ranking by outbound movements
- **WHEN** slotting is calculated
- **THEN** each size class lists its products from most to least picked

### Requirement: Easy-to-reach bins are defined by a stated rule
The system SHALL treat lower bay numbers and lower shelf numbers as easier to reach, and SHALL state this assumption in the view.

#### Scenario: Assumption shown
- **WHEN** the slotting view loads
- **THEN** it states how easy-to-reach was decided

### Requirement: Suggestions never break the store rules
The system SHALL only suggest swaps that keep one product per bin, stay within capacity and keep size-class matches.

#### Scenario: Swap respects rules
- **WHEN** a swap between two bins is suggested
- **THEN** both products fit the other bin's size class and capacity

### Requirement: Suggestions are separate from the main plan
The system SHALL present slotting suggestions as optional and SHALL NOT add them to the consolidation or putaway plan.

#### Scenario: Main plan unchanged
- **WHEN** slotting suggestions are shown
- **THEN** the merge list and putaway plan are unchanged
