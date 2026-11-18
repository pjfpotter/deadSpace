# Task: apply the Fernbrook brand identity to this repo

Fernbrook is a furniture manufacturer. Apply the identity below across the UI. Don't invent other colours or fonts. If a stack-specific choice is needed (CSS variables vs Tailwind theme vs a tokens file), follow the repo's existing convention and keep all brand values in ONE place.

## Colour tokens
| Token       | Hex     | Use |
|-------------|---------|-----|
| fern        | #2C4535 | Primary: logo, headlines, large fields |
| linen       | #F3EEE4 | Default page background |
| oak         | #C9A074 | Warm accent: panels, tags, highlights |
| moss        | #8AA574 | Soft accent, fills |
| brook       | #5F8A94 | Cool accent, FILLS ONLY |
| brook-deep  | #3F6770 | Brook-coloured text on linen |
| stone       | #DDD5C6 | Borders, rules, quiet panels |
| bark        | #1F1B17 | Body text |

Approved text/background pairings (contrast checked): bark on linen 14.8, linen on fern 9.0, bark on oak 7.1, bark on moss 6.3, bark on brook 4.5, brook-deep on linen 5.4.
Do NOT use: linen text on brook or oak, fern text on moss.
Rough proportion: mostly linen and fern, oak as the warm note, the rest sparingly.

## Typography (all Google Fonts)
- Display: Fraunces, weight 400 (300 for large quotes), letter-spacing -0.02em to -0.03em, `font-variation-settings: 'opsz' 144` at large sizes. Fallback Georgia, serif.
- Body/UI: Instrument Sans 400 body (16-18px, line-height 1.6), 500/600 for labels and buttons. Fallback system-ui, sans-serif.
- Detail: DM Mono 400/500 for dimensions, codes and small uppercase labels (12-14px, letter-spacing 0.12em). Never for paragraphs.

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## Logo
Mark = fern frond on a short plinth. Save as `logo-mark.svg`; it uses `currentColor` so it takes the text colour. Wordmark = "Fernbrook" in Fraunces 400, letter-spacing -0.03em, set to the right of the mark (horizontal lockup) with a gap of about 0.25x the mark height. Stacked version (mark above wordmark) for square or narrow spaces.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 2 64 118" fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M50 114V8M34 114H66M50 98L75.5 79.4M50 82L75.5 63.4M50 66L73 49.3M50 51L69.6 36.7M50 37L65.3 25.8M50 25L60.2 17.6M50 91L24.5 72.4M50 75L26.2 57.6M50 59L28.75 43.5M50 44L32.2 31M50 31L36.4 21.1M50 19L41.5 12.8"/>
</svg>
```

Rules: fern on linen/stone, linen on fern, fern on oak. Keep one mark-width of clear space on every side. Mark alone: minimum 30px high; below ~50px bump stroke-width to 7.5, below ~35px to 9.

## Voice
Tagline: "Made slowly. Made to stay." (always Fraunces). Brand idea: "Furniture you grow into."
Tone: plain, patient, warm. Say what it is and how it's made; no hype, no countdowns.
Use: oak, grain, joint, mend, season, settle, keep. Avoid: premium, luxury, curated, statement piece, elevate.

## To do
1. Add the tokens (single source of truth) and wire up the fonts.
2. Add `logo-mark.svg` and a Logo component (horizontal + stacked); use it in the header and README.
3. Restyle existing components to the palette and type scale; replace stray hard-coded colours.
4. Favicon: mark in fern (linen variant for dark mode). Update page title and meta description (tagline), and the social share image (fern background, linen lockup).
5. Check text/background contrast against the pairings above, then summarise what changed.
