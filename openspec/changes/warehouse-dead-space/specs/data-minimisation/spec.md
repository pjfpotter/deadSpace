# Spec Delta

## Purpose

Ensures the app and any LLM only ever see the data needed to plan the stores, with personal and irrelevant fields removed up front and the choice of what to keep documented.

## ADDED Requirements

### Requirement: Personal data is removed before use
The system SHALL produce sanitised datasets that contain no counter or picker names, personal mobile numbers, home addresses or supplier contact details.

#### Scenario: Sanitised stock has no personal fields
- **WHEN** the ingest step processes `stock.csv`
- **THEN** the sanitised stock contains only bin, product, quantity and count date
- **AND** counter name, counter mobile and counter home address are absent

#### Scenario: Sanitised movements have no picker fields
- **WHEN** the ingest step processes `movements.csv`
- **THEN** picker name and picker personal mobile are absent from the output

#### Scenario: Sanitised products have no contact details
- **WHEN** the ingest step processes `products.csv`
- **THEN** supplier contact email and mobile are absent from the output

### Requirement: Only needed columns are kept
The system SHALL keep only the columns required by a shipped feature and drop others, including unit cost and reorder quantities.

#### Scenario: Unneeded business columns dropped
- **WHEN** the ingest step processes `products.csv`
- **THEN** unit cost is not present in the sanitised output

### Requirement: Raw data stays out of the app and repo
The system SHALL keep raw CSVs out of the deployed app, version control and any LLM prompt.

#### Scenario: Raw files are excluded from version control
- **WHEN** a developer lists files that would be committed
- **THEN** no raw CSV containing personal data is among them

#### Scenario: LLM input is sanitised
- **WHEN** a prompt is built for an LLM
- **THEN** it contains only bin codes, product codes, product names and quantities

### Requirement: Kept and dropped columns are documented
The system SHALL publish a column-by-column record of what was kept or dropped and why.

#### Scenario: Data minimisation table generated
- **WHEN** the ingest step completes
- **THEN** a human-readable table lists every source column with a kept or dropped decision and a reason
