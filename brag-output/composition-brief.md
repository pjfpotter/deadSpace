# Hyperframes Composition Brief: Fernbrook dead space

## Objective
Create a short launch-style brag video for Fernbrook dead space, with narration.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape, 1920x1080
- Duration: 23 seconds

## Source Material
- Project root: this repo (Next.js app)
- Primary files read: README.md, docs/pitch-evidence.md, docs/brand-handoff.md, app/globals.css, app/components/FullnessView.tsx, MergesView.tsx, Nav.tsx, lib/solve.ts output (real plan steps)
- Product name: Fernbrook dead space (Fernbrook stores)
- Tagline / strongest claim: "Made slowly. Made to stay." / stores are "full", yet most bins are about half empty
- Key UI moments to recreate: fullness cards with bars (Small 43%, Medium 49%, Large 48%, Bulk 57%); merges list with "frees <bin>"; deliveries list with placed bins
- Copy that must appear verbatim:
  - "How full the stores are"
  - "Merges: what moves, and which bins it frees"
  - "Made slowly. Made to stay."

## Creative Direction
- Tone preset: deadpan
- Creative direction: quiet, receipts-first correction in Fernbrook's earthy brand voice
- Interpretation: long holds, linen whitespace, one idea per scene, dry narrator
- Hook: giant "Full." struck through, caption "the stores, apparently"
- Outro / punchline: "No extra space needed."
- Avoid: generic SaaS language, abstract filler, redesigning the brand

## Visual Identity
- Background: fern #2C4535 (hook, outro), linen #F3EEE4 (app scenes)
- Text: bark #1F1B17 on linen, linen on fern
- Accent: oak #C9A074; moss #8AA574, brook #5F8A94, stone #DDD5C6
- Display font: Fraunces; body Instrument Sans; mono DM Mono
- Visual references: fullness cards with progress bars, fern-frond logo mark (`assets/logo-mark-fern.svg`, recolour linen on fern)

## Storyboard
Use `brag-output/brag-plan.md` as the creative contract.
1. Hook, 4.0s
2. The receipts (fullness cards), 5.5s
3. Six moves (merges list, empty bins 2 → 7), 6.0s
4. Everyone gets a home (deliveries ticked), 4.5s
5. Outro, 3.0s

## Audio
- Audio role: warm bed, sparse accents, narrator on top
- Music: `assets/music/happy-beats-business-moves-vol-10-by-ende-dot-app.mp3`, ducked to 0.12-0.15 under the narration, fade out over the final 2s
- Music cue guidance: bundled preset for vol-10 (strong cues 15.82s, 20.19s); optional hints only
- Audio-reactive treatment: subtle warmth on the oak underline and logo
- Voiceover: Kokoro `af_heart` via `npx hyperframes tts`, script in brag-plan.md, track index 3. Scene durations may flex to the generated WAV but total stays 15-25s
- SFX: soft clicks/ticks/drops from the bundled brag SFX library, chosen after the animation exists
- Audio files: copy into `composition/assets/`

## Hyperframes Instructions
Load hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes, hyperframes-cli. Do not use the generic hyperframes promo workflow.
- Show real UI and copy from the project (see Source Material)
- Keep all text readable; hold each read at least ~0.8s (labels) / ~0.3s per word (sentences)
- Run `npx hyperframes check` before render
- Local only; no publishing
