# Spec Delta

## Purpose

Answers "what are you unsure about?" with the numbers and rules the answer relies on, and what changes if each is wrong.

## ADDED Requirements

### Requirement: Assumptions are listed beside the answer
The system SHALL show a register on the December page. Each entry has the assumption, its source (brief, data or our guess), the effect on bins if wrong, and who can confirm it. At minimum: bench arrival date; dispatch lead time; orders draw from stock on hand and no other outbound is modelled (movement history does not reconcile to the count); `FG-CHR-FLD` and `FG-BEN-3S` orders are met from stock, not new production; Large goods only go in Large bins; one product per bin; bin capacities are in units, not volume; the 7 Nov counts for `C-01-2` and `C-02-2` are stale; the existing plan's merges are carried out first.

#### Scenario: Register shown
- **GIVEN** the December page
- **WHEN** it renders
- **THEN** every assumption above is listed with source, effect and owner

### Requirement: Key assumptions can be varied
The system SHALL let the user change the bench arrival date and the dispatch lead time, and SHALL recompute the answer in the browser from fixtures, with no network call.

#### Scenario: Earlier arrival
- **GIVEN** the arrival date moved to 2026-11-30
- **WHEN** the page recomputes
- **THEN** the peak window lengthens, the result is shown, and the default is restorable

### Requirement: Open questions are stated for the organiser
The system SHALL list the questions it cannot answer from the data, including: whether Bulk bins may hold Large goods, whether existing `FG-BEN-2S` stock is already promised, and the real arrival date of the benches.

#### Scenario: Questions listed
- **GIVEN** the register
- **WHEN** viewed
- **THEN** each open question names the lever that would change if it is answered
