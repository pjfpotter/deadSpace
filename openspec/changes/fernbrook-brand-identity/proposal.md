# Proposal

## Why

The brand handoff (`docs/brand-handoff.md`) gives Fernbrook a real identity: eight colour tokens, three Google fonts, a fern-frond mark, and a plain, patient voice. The app still wears the placeholder look from the first build (Manrope, spruce green, a bench-shaped mark, white cards). Task 6.2 of `warehouse-dead-space` asked for the brand to be applied to the header and colours; this change replaces that with the supplied identity so the pitch, README and app all match.

## What Changes

- Replace the placeholder colour tokens with the eight brand tokens, held in one place (`app/globals.css`), with semantic aliases (`background`, `surface`, `muted`, `brand`, ...) mapped onto them so components keep their class names.
- Load Fraunces (display), Instrument Sans (body/UI) and DM Mono (detail) through `next/font/google` and apply the type scale from the handoff. Remove Manrope.
- Replace `public/brand/logo-mark.svg` with the fern-frond mark (`currentColor`), add a `Logo` component (horizontal and stacked), and use it in the header and README. Remove the old bench mark and `logo.svg`.
- Restyle existing components to the palette and type scale; replace hard-coded colours (`#f4f6f4`, `text-white`, white opacities).
- Favicon (fern mark, linen in dark mode), page title and description (tagline), and a generated social share image (fern background, linen lockup).
- Check every text/background pairing against the approved list with an automated test.
- Voice: UI copy and metadata use the tagline and avoid the banned words.

Out of scope: new pages, changes to any plan, solver or data logic, and a dark palette beyond what the tokens allow.

## Capabilities

### New Capabilities
- `brand-identity`: Colour tokens in one place, brand fonts, logo mark and component, favicon and share metadata, approved contrast pairings, and voice rules.

### Modified Capabilities
<!-- None. Behaviour of existing capabilities is unchanged; only presentation changes. -->
