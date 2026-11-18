# Spec Delta

## Purpose

Shows the stores manager how full the stores really are, so the claim that they are "full" can be tested against the latest count.

## ADDED Requirements

### Requirement: Space used is reported
The system SHALL report units used, known capacity and percentage used, overall and for each size class.

#### Scenario: Utilisation by size class
- **WHEN** the fullness view loads
- **THEN** each of Small, Medium, Large and Bulk shows units used, capacity and percentage used

#### Scenario: Unknown capacity excluded from percentages
- **GIVEN** a bin has no capacity value
- **WHEN** percentages are calculated
- **THEN** that bin's capacity is excluded from the denominator
- **AND** the view states that it was excluded

### Requirement: Empty bins are listed
The system SHALL list every bin that holds no stock.

#### Scenario: Empty bins shown
- **GIVEN** `A-05-1` and `B-03-3` hold no stock
- **WHEN** the fullness view loads
- **THEN** both appear in the empty bins list with their size class

### Requirement: Bins under half full are listed
The system SHALL list every bin that holds stock but less than half of its capacity.

#### Scenario: Under-half bins shown
- **GIVEN** a bin holds 14 units with capacity 60
- **WHEN** the fullness view loads
- **THEN** that bin appears in the under-half list with its quantity and capacity

#### Scenario: Exactly half is not under half
- **GIVEN** a bin holds 30 units with capacity 60
- **WHEN** the fullness view loads
- **THEN** that bin is not in the under-half list

### Requirement: Fullness reflects the plan
The system SHALL show fullness both for the current count and for the state after the merges are applied.

#### Scenario: Before and after comparison
- **WHEN** the fullness view loads
- **THEN** it shows empty bin counts before and after the merge list
