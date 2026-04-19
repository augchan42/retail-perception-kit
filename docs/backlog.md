# Backlog

Items deferred from code review (2026-04-19, review-20260419-083233-038524).

## Infrastructure

- [ ] **Add test framework (Vitest)** — Add `vitest` with scripts `test`, `test:watch`. Start with `DirectPlanner`, `parseFindings`, and `/api/analyze` request validation. *Rationale for deferral: CLAUDE.md says "No tests, no database" — revisit when planner implementations multiply in Phase 2+.*

- [ ] **Centralize env config** — Extract `OLLAMA_ENDPOINT` / `OLLAMA_MODEL` reads into `src/lib/server-config.ts` with URL validation and `.env.example`. *Rationale: only 2 optional vars today; worth doing when Phase 2 adds planner config.*

- [ ] **Structured logging** — Replace ad-hoc `console.error` in API route with a small server logger utility. Log request-scoped metadata (image count, model, latency) without leaking image data. *Rationale: local demo, no observability needs yet.*

- [ ] **Add `AGENTS.md`** — Document project conventions, architecture boundaries, testing expectations. Mirror or symlink from `CLAUDE.md`. *Rationale: CLAUDE.md is sufficient for now.*

## Hardening

- [ ] **API pre-parse body size guard** — Check `content-length` header before `req.json()` to reject oversized payloads early. *Rationale: local demo, not exposed to untrusted clients.*

- [ ] **Base64 image validation** — Verify decoded content is valid base64 and matches PNG/JPEG/WebP magic bytes before forwarding to Ollama. *Rationale: Ollama handles bad input gracefully; adds complexity without demo value.*

- [ ] **Auth / rate limiting on `/api/analyze`** — Add before deploying beyond localhost. *Rationale: local demo only.*

## Code Quality

- [ ] **Decompose `page.tsx` into components** — Extract `ImageUploader`, `FindingsList`, `ActionPlanView`, and a `useRetailAnalysis()` hook. Keep `page.tsx` as a Server Component shell. *Rationale: premature for a single-page demo; revisit when Phase 2 adds the DIRECT/REASONED toggle.*

- [ ] **Use `useTransition` for result rendering** — Wrap post-analysis state updates in `useTransition` to keep loading feedback responsive. *Rationale: premature optimization; analysis latency dominates UX, not render time.*

- [ ] **Disable `allowJs` in tsconfig** — Set to `false` since the source tree is TypeScript-only. *Rationale: standard Next.js default, low risk.*

- [ ] **Enable `no-explicit-any` lint rule** — Set `@typescript-eslint/no-explicit-any` to `warn`. *Rationale: no current `any` abuse; revisit when codebase grows.*

- [ ] **Use `next/image` for blob previews or suppress lint** — Add a localized lint suppression for the `<img>` element used with blob URLs (can't use `next/image` optimization for object URLs). *Rationale: cosmetic lint warning only.*

## Architecture (Phase 2+)

- [ ] **Planner registry / factory** — Introduce a planner selection mechanism when `LLMPlanner` and `FrameworkPlanner` are added. `DirectPlanner` stays as baseline. *Tracked in ADR-002 Phase 2.*

- [ ] **Export `parseFindings` for testability** — Move VLM response parser to `src/lib/vlm-parser.ts` or export from `vlm-client.ts`. *Blocked on: test framework above.*
