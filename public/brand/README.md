# Fernbrook brand

Full handoff: [docs/brand-handoff.md](../../docs/brand-handoff.md). Spec: `openspec/changes/fernbrook-brand-identity`.

| Token | Value | Use |
|---|---|---|
| fern | `#2C4535` | Primary: logo, headlines, header |
| linen | `#F3EEE4` | Page background |
| oak | `#C9A074` | Warm accent |
| moss | `#8AA574` | Soft accent, fills |
| brook | `#5F8A94` | Cool accent, fills only |
| brook-deep | `#3F6770` | Brook-coloured text on linen |
| stone | `#DDD5C6` | Borders, quiet panels |
| bark | `#1F1B17` | Body text |

Tokens are defined once, in `app/globals.css`; `lib/brand.test.ts` checks the approved contrast pairings.

Fonts (Google, loaded in `app/layout.tsx`): Fraunces (display), Instrument Sans (body/UI), DM Mono (codes and small labels).

Files: `logo-mark.svg` (uses `currentColor`) and `logo-mark-fern.svg` (fixed fern, for places that cannot inherit colour, such as the README). The `Logo` component is `app/components/Logo.tsx`.
