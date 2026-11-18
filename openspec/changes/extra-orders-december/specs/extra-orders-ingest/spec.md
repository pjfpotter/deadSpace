# Spec Delta

## Purpose

Brings the late customer orders into the app as sanitised, dated outbound demand.

## ADDED Requirements

### Requirement: Customer orders are ingested as outbound demand
The system SHALL read `docs/spec-update/warehouse_extra_orders.csv` and write `fixtures/orders.json` with `orderRef`, `customerLabel`, `deliveryDate`, `sku` and `quantity`. The orders SHALL be treated as stock leaving the stores, not arriving.

#### Scenario: Three orders ingested
- **GIVEN** the CSV with CO-8801 (40 × FG-BEN-2S, 2026-12-04), CO-8802 (16 × FG-CHR-FLD, 2026-12-04) and CO-8803 (24 × FG-BEN-3S, 2026-12-11)
- **WHEN** the ingest runs
- **THEN** `fixtures/orders.json` holds exactly those three orders and each SKU exists in the products fixture

#### Scenario: Bad row rejected
- **GIVEN** a row with an unknown SKU, a non-positive quantity or an invalid date
- **WHEN** the ingest runs
- **THEN** it fails with a message naming the row, and writes nothing

### Requirement: Bench production arrival is an explicit input
The system SHALL model the 40 extra `FG-BEN-2S` as one receipt whose date is an input, because the brief gives only "in the weeks after" the runs on the Incoming list (the last is WO-1033 on 2026-11-27). The default SHALL be the worst case that still meets CO-8801: the day before delivery, with the receipt clearly labelled as assumed.

#### Scenario: Default arrival
- **GIVEN** no arrival date has been chosen
- **WHEN** the timeline is built
- **THEN** the 40 benches arrive on 2026-12-03 and the page says the date is assumed

#### Scenario: Arrival before the last known run is refused
- **GIVEN** an arrival date on or before 2026-11-27
- **WHEN** the user enters it
- **THEN** it is rejected with a message that the benches follow the production runs already listed

### Requirement: Customer data is minimised
The system SHALL NOT store anything about customers beyond a pseudonymous label already present in the CSV.

#### Scenario: Privacy test
- **GIVEN** the sanitised fixtures
- **WHEN** the privacy test runs
- **THEN** no fixture contains personal fields, and `docs/data-minimisation.md` lists the orders columns as kept or dropped with reasons
