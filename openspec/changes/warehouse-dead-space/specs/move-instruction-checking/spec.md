# Spec Delta

## Purpose

Uses an LLM only to word move instructions, then proves each instruction matches the solver's move list and keeps a log of every mistake, so AI errors are caught, shown and never reach the floor.

## ADDED Requirements

### Requirement: The solver decides, the LLM only words
The system SHALL take every product, bin code and quantity from the solver's move list, and SHALL use an LLM only to phrase the instruction text.

#### Scenario: LLM receives only the move facts
- **WHEN** an instruction is requested for a move
- **THEN** the LLM input contains only that move's product name, product code, bins and quantity

### Requirement: Every instruction is checked against its move
The system SHALL check that each instruction mentions exactly the move's bin codes, product and quantity, and no others.

#### Scenario: Correct instruction passes
- **GIVEN** a move of 14 `CP-LEG-BEN` from `B-01-2` to `B-01-1`
- **WHEN** the instruction names those bins and the quantity 14
- **THEN** the check passes

#### Scenario: Wrong bin code detected
- **GIVEN** an instruction that names a bin not in the move
- **WHEN** it is checked
- **THEN** the check fails and names the unexpected bin

#### Scenario: Wrong quantity detected
- **GIVEN** an instruction stating a quantity that differs from the move
- **WHEN** it is checked
- **THEN** the check fails and names both quantities

#### Scenario: Missing detail detected
- **GIVEN** an instruction that omits the from bin, to bin or quantity
- **WHEN** it is checked
- **THEN** the check fails and names what is missing

### Requirement: Failed instructions are replaced, not shown
The system SHALL show a fixed template instruction built from the move whenever an LLM instruction fails its check or none is available.

#### Scenario: Fallback on failure
- **GIVEN** an LLM instruction fails its check
- **WHEN** the floor view is shown
- **THEN** that step displays the template instruction for the same move

#### Scenario: Fallback when the LLM is unreachable
- **GIVEN** the LLM cannot be reached
- **WHEN** the floor view is shown
- **THEN** every step shows its template instruction and the view still works

### Requirement: Every mistake is logged
The system SHALL record each failed check with the move, the wording produced, and the reason, for use as pitch evidence.

#### Scenario: Log entry written
- **WHEN** an instruction fails its check
- **THEN** a log entry holds the move, the faulty text and the failure reason

#### Scenario: Log summary available
- **WHEN** a user opens the AI check summary
- **THEN** it shows instructions checked, passed and failed

### Requirement: Instructions are prepared ahead of use
The system SHALL generate and check instructions before the demo and store the checked results, so the floor view needs no live LLM call.

#### Scenario: Stored instructions used
- **WHEN** the floor view loads
- **THEN** instructions come from stored checked results, not a live LLM call
