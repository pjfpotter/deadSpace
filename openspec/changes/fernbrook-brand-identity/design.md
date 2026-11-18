# Design

## Decisions

**Single source of truth.** The repo already keeps colour tokens as CSS variables in `app/globals.css`, exposed to Tailwind v4 through `@theme inline`. Keep that. The eight brand tokens (`--fern`, `--linen`, `--oak`, `--moss`, `--brook`, `--brook-deep`, `--stone`, `--bark`) are defined once there. Semantic variables (`--background`, `--surface`, `--foreground`, `--muted`, `--line`, `--brand`, `--accent`, `--header-bg`, `--bar-track`, `--ok`, `--warn`, `--bad`) are defined only as references to those eight, so existing classes (`bg-surface`, `text-muted`, ...) keep working and no component holds a hex.

**Semantic mapping (light).** background linen, foreground bark, surface linen with a stone border (quiet panels are stone), line stone, track stone, brand and header fern with linen on top, accent oak, muted a mix of bark and linen (derived, not a new hue; checked at least 4.5 on linen).

**Status colours.** The handoff has no red or amber and says not to invent colours. `ok` is fern, `warn` is brook-deep, `bad` is bark. Anything that must stand out is also carried by weight, an oak fill or border, and wording, never by colour alone. Open question for the brand owner: if a true error colour is wanted it must come from them.

**Dark mode.** The handoff defines no dark palette. Reuse the same tokens swapped: background fern, surface bark, foreground linen, brand oak with bark text (7.1). The favicon uses linen in dark mode as specified.

**Fonts.** `next/font/google`: Fraunces (variable weight, `opsz` axis), Instrument Sans 400/500/600, DM Mono 400/500, exposed as `--font-display`, `--font-sans`, `--font-mono`. Headings use display at weight 400, letter-spacing -0.02em, `opsz` 144 at large sizes. Labels, dimensions and bin codes use DM Mono uppercase with 0.12em spacing, never paragraphs.

**Logo.** `Logo` renders the inline SVG with `currentColor`, `variant="horizontal" | "stacked"`, a stroke-width bump for small sizes (7.5 under 50px, 9 under 35px), and the wordmark as text in Fraunces. The README uses a static fern-coloured copy because `currentColor` renders black in an `<img>`.

**Share image.** `app/opengraph-image.tsx` via `next/og`: fern background, linen mark and wordmark, tagline. Fraunces is fetched at build; if the fetch fails the image falls back to the default serif so the build never breaks.

**Contrast check.** A vitest reads the tokens out of `app/globals.css`, computes WCAG ratios for each approved pairing and the derived muted colour, and fails if an approved pair drops below its stated value or a forbidden pairing appears in the semantic mapping.

## Risks

- Fonts come from Google at build time; offline builds fail, as they did with Manrope.
- Removing red from `bad` weakens at-a-glance alarms; mitigated by the non-colour cues above.
