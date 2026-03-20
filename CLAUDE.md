# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run Next.js linter
```

## Architecture

Next.js 16 (App Router) + React 19 + Tailwind CSS 3 single-page demo app. No tests, no API routes, no database.

**Purpose:** Phone-based retail audit demo proving Auki's "perception-first" thesis — phones capture retail observations (images), a VLM analyzes them for issues (empty shelves, compliance violations, missing signs), and actionable tasks are generated.

**Flow:** Domain input → Image upload → VLM analysis → Findings + Tasks

### Key Files

- `src/app/page.tsx` — Entire UI (single client component). Currently uses inline mock data instead of the VLM client.
- `src/lib/vlm-client.ts` — `VLMClient` interface with `MockVLMClient` (working) and `RealVLMClient` (stub). The mock client is exported as the default but is not yet wired into the page component.

### Import alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Current State (V1 - Mock)

Everything runs client-side with hardcoded mock findings. The `VLMClient` interface in `vlm-client.ts` is defined but the page component uses its own inline mock data rather than importing the client.

## Future Integration Points (Auki Repos)

- **vlm-node** / **Ollama** — Replace mock with real image analysis
- **domain-server** — Replace manual domain ID input; store findings as domain metadata
- **posemesh** — SDK-based localization instead of manual marker input
- **pathfinding** — Route staff to task locations
