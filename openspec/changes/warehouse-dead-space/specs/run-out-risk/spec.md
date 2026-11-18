# Spec Delta

## Purpose

Warns the stores team which products are likely to run out soon, using counted stock, incoming deliveries and recent usage, so shortages are seen before they stop work.

## ADDED Requirements

### Requirement: Days of cover are estimated per product
The system SHALL estimate each product's days of cover as counted stock divided by its average daily outbound units over the movement history.

#### Scenario: Cover calculated
- **GIVEN** a product with 9 units counted and 2 units used per day
- **WHEN** run-out risk is calculated
- **THEN** its days of cover is shown as 4.5

### Requirement: Products at risk are flagged
The system SHALL flag products whose days of cover fall below a stated threshold, and products with no stock.

#### Scenario: Low cover flagged
- **GIVEN** a product with days of cover below the threshold
- **WHEN** the run-out view loads
- **THEN** it appears in the at-risk list with its cover

#### Scenario: Zero stock flagged
- **GIVEN** a product with no counted stock
- **WHEN** the run-out view loads
- **THEN** it appears as out of stock

### Requirement: Incoming stock is taken into account
The system SHALL show whether an incoming delivery or run covers an at-risk product, and when it is due.

#### Scenario: Delivery due shown
- **GIVEN** an out-of-stock product has an incoming line due on a stated date
- **WHEN** the run-out view loads
- **THEN** the view shows that line and its due date next to the product

### Requirement: Estimates state their basis
The system SHALL state how many days of history the estimate used and that movement records do not reconcile exactly to the count.

#### Scenario: Basis shown
- **WHEN** the run-out view loads
- **THEN** it shows the history period used and the reconciliation caveat

### Requirement: Products with no usage history are handled
The system SHALL NOT report infinite or invalid cover for products with no outbound history.

#### Scenario: No usage
- **GIVEN** a product with no outbound movements
- **WHEN** run-out risk is calculated
- **THEN** its cover is shown as unknown, not as a number
