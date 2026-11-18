<img src="public/brand/logo-mark-fern.svg" alt="Fernbrook" height="72">

# Fernbrook dead space

*Made slowly. Made to stay.*

**Live app: https://fernbrook-dead-space.vercel.app**

This is a hackathon project, built by a small team (data and testing, business, brand and developer) for the 1066 Manufacturing Hackathon on 18 Nov 2026. Fernbrook Furniture Co. says its stores are "full", yet most bins are about half empty and next week's deliveries won't fit. We built a web app that shows how full the stores really are, lists the bin merges that free space, and plans where every incoming delivery goes.

A 23-second narrated launch video is in `brag-output/brag.mp4`.

Fernbrook is an invented company. All names, suppliers and numbers in the brief are made up.

## What we're building

- How full the stores are: space used, empty bins, bins under half full
- A merge list: which product moves from which bin to which, and which bins it frees
- A putaway plan for next week's deliveries and production runs
- Also: a "can we fit it?" check, data-problem flags, a phone-friendly floor checklist, and AI-written move instructions that are checked against the plan
- Stretch: run-out warnings, fast-mover slotting, capacity as real space

Status: built for the hackathon and live at the URL above. The plan lives in `openspec/changes/warehouse-dead-space/`, and [docs/pitch-evidence.md](docs/pitch-evidence.md) shows what is done and what is next.

## Who reads what

Everyone, first (5 minutes):
- [The brief](docs/README_warehouse_dead_space.md)
- [The proposal](openspec/changes/warehouse-dead-space/proposal.md)

| Role | Read these | You produce |
|---|---|---|
| **Data and testing** | [data-minimisation](openspec/changes/warehouse-dead-space/specs/data-minimisation/spec.md), [data-quality-flags](openspec/changes/warehouse-dead-space/specs/data-quality-flags/spec.md), [plan-validation](openspec/changes/warehouse-dead-space/specs/plan-validation/spec.md), [move-instruction-checking](openspec/changes/warehouse-dead-space/specs/move-instruction-checking/spec.md) | Test cases, data-problem findings, AI mistakes found |
| **Business** | Proposal (Why, Impact), [store-fullness](openspec/changes/warehouse-dead-space/specs/store-fullness/spec.md), [incoming-putaway](openspec/changes/warehouse-dead-space/specs/incoming-putaway/spec.md), [run-out-risk](openspec/changes/warehouse-dead-space/specs/run-out-risk/spec.md) | Business case and next steps |
| **Brand** | Proposal, [floor-view](openspec/changes/warehouse-dead-space/specs/floor-view/spec.md) | Name, look, logo, pitch slides, demo script |
| **Developer** | Everything, starting with [design.md](openspec/changes/warehouse-dead-space/design.md) and [tasks.md](openspec/changes/warehouse-dead-space/tasks.md) | The app |

## Sending your work

Don't commit to this repo. Send your work to the developer, who adds it. It lands here:

- Business case: `docs/business-case.md`
- AI mistakes and test findings: `docs/ai-error-log.md`
- Brand assets (logo, colours, fonts): `public/brand/`; tokens live in `app/globals.css`; handoff in [docs/brand-handoff.md](docs/brand-handoff.md)
- Pitch slides and demo script: `docs/`

## The data is secret

This repo is public, but the Fernbrook data is not in it and must never be committed.

- `data/` and all `*.csv` files are gitignored.
- The raw files contain personal details (staff names, personal mobiles, home addresses, supplier contacts).
- Don't paste raw data into chats, issues, docs or AI tools. Ask the developer for a sanitised extract.
- The app only uses bin codes, product codes and quantities.

If you need the raw data for your work, ask the developer to share it directly.

## The rules of the stores

1. One product per bin.
2. Capacity is counted in units.
3. Bin codes read aisle, bay, shelf (`A-03-2`). Bulk areas are `BULK-01` to `BULK-04`.
4. Each product and bin is Small, Medium, Large or Bulk. A product only goes in a matching bin.

## Tech

Next.js (App Router, TypeScript), deployed to Vercel. Planning is done by a deterministic solver with a separate rules validator; AI only words the move instructions. Specs and tasks are managed with [OpenSpec](https://github.com/Fission-AI/OpenSpec).
