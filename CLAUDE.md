# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev         # Start dev server at http://localhost:3000
pnpm build       # Production build
pnpm start       # Start production server
pnpm lint        # Run ESLint on src/
pnpm lint:fix    # Auto-fix lint issues
pnpm typecheck   # Type-check without emitting
```

## Architecture

Next.js 16 (App Router) + React 19 + Tailwind CSS 3 single-page demo app. No tests, no database.

**Purpose:** Phone-based retail audit demo proving Auki's "perception-first" thesis — phones capture retail observations (images), a VLM analyzes them for issues (empty shelves, compliance violations, missing signs), and actionable tasks are generated.

**Flow:** Domain input → Image upload → VLM analysis → Findings → Planning → Prioritized Action Plan

### Key Files

- `src/app/page.tsx` — Entire UI (single client component). Supports mock mode (default) and live Ollama mode via toggle.
- `src/app/api/analyze/route.ts` — Server-side API route that proxies image analysis requests to local Ollama. Handles input validation, base64 processing, and error sanitization.
- `src/lib/vlm-client.ts` — `VLMClient` interface with `MockVLMClient` (offline demo) and `RealVLMClient` (Ollama integration via `/api/chat`). Includes prompt engineering and JSON response parsing.
- `src/lib/planner.ts` — `Planner` interface with `DirectPlanner` (deterministic urgency-based prioritization). Sits between VLM findings and task display, producing prioritized action plans with reasoning traces. See ADR-002.

### Import alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Environment Variables (optional)

- `OLLAMA_ENDPOINT` — Ollama API URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL` — Model to use (default: `qwen3-vl:32b-instruct`)

## Current State (V2 - Ollama Integration)

The app defaults to **mock mode** for safe demos without dependencies. Toggling to **live mode** sends uploaded images to a local Ollama instance running Qwen3-VL-32B for real analysis. Tasks are generated dynamically from VLM findings.

See `docs/adr/001-local-vlm-selection.md` for model selection rationale and `docs/adr/002-planning-layer-design.md` for the planning layer design (framework-conditioned reasoning, convergence with warring states research).

### Ollama Setup

```bash
brew install ollama
brew services start ollama
ollama pull qwen3-vl:32b-instruct    # ~20GB
ollama pull qwen3-vl:8b-instruct     # Fast fallback (~5GB)
```

## Future Integration Points (Auki Repos)

- **domain-server** — Replace manual domain ID input; store findings as domain metadata
- **posemesh** — SDK-based localization instead of manual marker input
- **pathfinding** — Route staff to task locations
