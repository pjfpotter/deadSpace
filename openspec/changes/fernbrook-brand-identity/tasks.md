## 1. Tokens and fonts

- [x] 1.1 Replace the colour tokens in `app/globals.css` with the eight brand tokens plus semantic aliases; verify the only hex values in the app are in that file
- [x] 1.2 Load Fraunces, Instrument Sans and DM Mono with `next/font/google`, remove Manrope, set the type scale; verify the build succeeds and the fonts apply

## 2. Logo

- [x] 2.1 Replace `public/brand/logo-mark.svg` with the frond mark, remove `logo.svg`, add a fern copy for the README; verify the files
- [x] 2.2 Add `app/components/Logo.tsx` (horizontal, stacked, stroke bump) with a test of the stroke rule; use it in `Nav` and the README

## 3. Restyle

- [x] 3.1 Restyle `Nav`, `FullnessView` and the other components to the palette and type scale, replace `text-white` and hex values, use DM Mono for codes; verify by searching for stray colours
- [x] 3.2 Rewrite UI copy that breaks the voice rules; verify a search for the banned words

## 4. Favicon and share

- [x] 4.1 Replace `app/icon.svg` (fern mark, linen in dark mode) and the old `favicon.ico`; verify in a browser tab
- [x] 4.2 Update title and description in `app/layout.tsx` and add `app/opengraph-image.tsx`; verify the generated image renders

## 5. Check

- [x] 5.1 Add a contrast test that reads `app/globals.css` and checks every approved pairing and the forbidden ones; verify `npm test` passes
- [x] 5.2 Update `public/brand/README.md`, run `npm test`, `npm run lint`, `npm run build`, and summarise what changed; verify all pass
