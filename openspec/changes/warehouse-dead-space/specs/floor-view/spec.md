# Spec Delta

## Purpose

Lets a stores worker follow the plan on a phone without help: one clear instruction per move, in a sensible order, with progress that survives a page reload.

## ADDED Requirements

### Requirement: The plan is shown as an ordered checklist
The system SHALL list every merge and putaway as a numbered step with a plain-English instruction, ordered so that each step can be done when it is reached.

#### Scenario: Instruction names the bins
- **WHEN** the floor view loads
- **THEN** each step states the product, quantity, from bin and to bin in plain English

#### Scenario: Steps are in doable order
- **GIVEN** a putaway needs a bin freed by a merge
- **WHEN** the checklist is shown
- **THEN** that merge appears before the putaway

### Requirement: Steps can be ticked off
The system SHALL let a worker mark each step done and undo it, and SHALL show how many steps are complete.

#### Scenario: Tick a step
- **WHEN** the worker ticks a step
- **THEN** the step shows as done and the progress count increases

#### Scenario: Undo a tick
- **GIVEN** a step is done
- **WHEN** the worker unticks it
- **THEN** the step shows as not done and the progress count decreases

### Requirement: Progress survives a reload
The system SHALL keep tick-off progress on the device across page reloads, and SHALL still show the checklist if saved progress is unavailable.

#### Scenario: Reload keeps progress
- **GIVEN** three steps are ticked
- **WHEN** the page is reloaded
- **THEN** the same three steps are still ticked

#### Scenario: Storage unavailable
- **GIVEN** the browser blocks local storage
- **WHEN** the floor view loads
- **THEN** the checklist is shown with nothing ticked and no error screen

### Requirement: Saved progress is discarded when the plan changes
The system SHALL NOT apply saved ticks to a different plan.

#### Scenario: New plan clears old ticks
- **GIVEN** progress was saved for an earlier plan
- **WHEN** the plan content differs
- **THEN** the saved ticks are ignored

### Requirement: The floor view works on a phone
The system SHALL be usable at phone width with no horizontal scrolling and tap targets large enough for gloved or one-handed use.

#### Scenario: Phone width
- **WHEN** the floor view is opened at 360px width
- **THEN** all content is readable and tickable without horizontal scrolling

### Requirement: The floor view needs no personal data
The system SHALL NOT display or store worker names, mobiles or addresses.

#### Scenario: No personal fields shown
- **WHEN** the floor view is open
- **THEN** no worker identity appears on screen or in saved progress
