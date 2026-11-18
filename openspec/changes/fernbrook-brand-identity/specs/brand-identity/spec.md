# Spec Delta

## Purpose

Makes the app look and read like Fernbrook: one set of colour tokens, three brand fonts, the fern-frond logo, and plain, patient copy. Presentation only; no behaviour changes.

## ADDED Requirements

### Requirement: Brand colours live in one place
The system SHALL define the eight brand tokens (fern #2C4535, linen #F3EEE4, oak #C9A074, moss #8AA574, brook #5F8A94, brook-deep #3F6770, stone #DDD5C6, bark #1F1B17) once, in `app/globals.css`, and SHALL NOT use any other colour value in components or assets except `currentColor` and values derived from those tokens.

#### Scenario: Change a token
- **WHEN** a token value in `app/globals.css` is edited
- **THEN** every page, the header and the logo follow it with no other file changed

#### Scenario: No stray hard-coded colours
- **WHEN** the components are searched for hex values, `white` or `black`
- **THEN** none are found outside `app/globals.css` and the static brand SVGs

### Requirement: Only approved text and background pairings are used
The system SHALL use bark on linen, linen on fern, bark on oak, bark on moss, bark on brook and brook-deep on linen for text, and SHALL NOT use linen text on brook or oak, fern text on moss, or brook as a text colour on linen. Brook SHALL be used for fills only.

#### Scenario: Contrast ratios hold
- **WHEN** the contrast test runs
- **THEN** bark on linen is at least 14.8, linen on fern 9.0, bark on oak 7.1, bark on moss 6.3, bark on brook 4.5 and brook-deep on linen 5.4 (to one decimal place), and muted text on linen is at least 4.5

#### Scenario: Forbidden pairing introduced
- **GIVEN** a semantic token pairs linen text with an oak or brook background
- **WHEN** the contrast test runs
- **THEN** it fails

### Requirement: Brand fonts and type scale
The system SHALL use Fraunces for display text (weight 400, letter-spacing -0.02em to -0.03em, optical size 144 at large sizes, fallback Georgia, serif), Instrument Sans for body and UI (400 body at 16-18px with line-height 1.6, 500/600 for labels and buttons, fallback system-ui, sans-serif) and DM Mono for dimensions, codes and small uppercase labels (400/500, 12-14px, letter-spacing 0.12em), and SHALL NOT set paragraphs in DM Mono.

#### Scenario: Fonts load
- **WHEN** any page loads
- **THEN** headings render in Fraunces, body text in Instrument Sans and bin or product codes in DM Mono, with the stated fallbacks while loading

### Requirement: Logo mark and lockups
The system SHALL provide the fern-frond mark as `public/brand/logo-mark.svg` using `currentColor`, and a `Logo` component with a horizontal lockup (wordmark right of the mark, gap about 0.25x mark height) and a stacked lockup, with the wordmark in Fraunces 400 at letter-spacing -0.03em. Stroke width SHALL be 7.5 below about 50px and 9 below about 35px, and the mark alone SHALL NOT be shown below 30px high.

#### Scenario: Header and README
- **WHEN** the app header or the README is viewed
- **THEN** each shows the horizontal lockup in linen on fern (header) or fern on linen (README)

#### Scenario: Small mark
- **GIVEN** the mark is rendered 32px high
- **THEN** its stroke width is 9

### Requirement: Favicon, metadata and share image
The system SHALL serve a favicon of the mark in fern, in linen when the browser prefers dark, SHALL set the page title to include "Fernbrook" and the description to the tagline "Made slowly. Made to stay.", and SHALL generate a social share image with a fern background and a linen lockup.

#### Scenario: Share preview
- **WHEN** the site URL is shared
- **THEN** the preview image is fern with the linen mark, wordmark and tagline

### Requirement: Voice
The system SHALL write interface copy plainly and warmly, saying what a thing is and how it is made, and SHALL NOT use the words premium, luxury, curated, statement piece or elevate, nor hype or countdowns.

#### Scenario: Banned words
- **WHEN** the app source and README are searched for the banned words
- **THEN** none are found
