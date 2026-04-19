# ADR-002: Planning Layer — Framework-Conditioned Reasoning Between Perception and Action

**Status:** Proposed
**Date:** 2026-04-19
**Depends on:** ADR-001 (Local VLM Selection)

## Context

The Retail Perception Kit currently runs a one-shot pipeline: image → VLM → flat findings list → templated tasks. There is no reasoning between perception and action. Every finding of the same type produces the same task template regardless of context, urgency, or strategic tradeoffs.

This ADR introduces a **planning layer** that sits between VLM findings and task generation. The planning layer takes structured observations and produces prioritized, reasoned action plans. The research question is whether the *framework* used for reasoning changes the quality of the plan.

### Motivation 1: The World Models Convergence

The AI field is converging on a shared architecture: **perception → latent state → planning → action**. The debate (LeCun, Schmidhuber, classical control theory) is about *who owns the lineage* and *whose framework operationalizes it best*, not whether the architecture is right. See the Bryson & Ho (1975) optimal control lineage, the Nguyen & Widrow (1990) neural emulator/controller work, and the Ha & Schmidhuber (2018) "World Models" popularization.

The retail perception kit already has the perception layer (VLM). Adding a planning layer turns it from a demo into a testbed for the question that actually matters: **what should the latent model look like?**

The dominant assumption is that the latent model should be a learned neural representation. This project tests an alternative: can a *symbolic reasoning framework* — a structured lens through which an agent interprets observations — serve as the "model" in a model-based planning loop? This is a lane nobody in the current debate is occupying.

### Motivation 2: Convergence with Warring States Research

The `warringstates-engine` project (sibling repo) runs a parallel experiment: 7 LLM agents play a Diplomacy-style strategy game. The experimental variable is **how the Han agent reasons about its situation** — through I-Ching hexagram consultation (yarrow), Tarot spreads, or generic reflection (control).

Results from 97+ games across v1 and v2:

| Finding | Implication for retail |
|---------|----------------------|
| Survival rates converge across conditions | The *what* of action may not change dramatically |
| Behavioral signatures diverge (yarrow: 2x support orders, 2x reasoning text) | The *how* and *why* of reasoning changes meaningfully |
| Variance compression under scrambled oracle (Levene's p=0.031) | Framework structure affects outcome distribution, not just mean |
| Named LLM anti-patterns (probe addiction, peace equilibrium crystallization) | Framework-conditioned reasoning may resist or amplify specific failure modes |

The retail planning layer replicates this experimental design in a real-world domain. Same structure: treatment (framework-informed reasoning) vs control (direct prioritization). Different domain: retail operations instead of statecraft.

### Motivation 3: Practical Value

Even without the research angle, a reasoning layer improves the product:

- **Prioritization**: 5 findings need ordering. "Spill in high-traffic aisle" should outrank "missing sign in stockroom."
- **Context sensitivity**: The same finding type at different locations may warrant different responses.
- **Resource awareness**: A single staff member can't address everything simultaneously. The plan should account for routing and effort.
- **Reasoning traces**: Showing *why* tasks are prioritized builds trust in the system. Retail managers want rationale, not just a list.

## Decision

### Architecture

```
Image(s)
  │
  ▼
┌─────────────┐
│  VLM Layer   │  ← Qwen3-VL via Ollama (ADR-001)
│  (Perception)│
└──────┬──────┘
       │ Finding[]
       ▼
┌─────────────┐
│  Planner     │  ← NEW: this ADR
│  (Reasoning) │
└──────┬──────┘
       │ ActionPlan
       ▼
┌─────────────┐
│  UI Layer    │  ← Prioritized tasks with reasoning traces
│  (Action)    │
└─────────────┘
```

### Planner Interface

```typescript
interface PlannerContext {
  findings: Finding[];
  domainId?: string;
  // Future phases may add:
  // storeProfile?: StoreProfile;  // store-specific context (layout, staff, hours)
}

interface PlannedAction {
  id: string;
  description: string;
  findingType: string;
  priority: number;          // 1 = highest
  urgency: "immediate" | "soon" | "routine";
  reasoning: string;         // WHY this priority — the experimental data
  estimatedEffort: string;   // "5 min", "15 min", etc.
}

interface ActionPlan {
  actions: PlannedAction[];
  summary: string;           // one-line plan overview
  frameworkUsed: string;     // which planner produced this
  reasoningTrace?: string;   // full reasoning (for research logging)
}

interface Planner {
  plan(context: PlannerContext): Promise<ActionPlan>;
}
```

### Planner Implementations

#### 1. `DirectPlanner` (Control)

Deterministic, no LLM call. Ranks findings by urgency tier first (immediate > soon > routine), then by confidence score as tiebreaker within each tier. Applies fixed urgency rules (spill/obstruction → immediate, empty shelf/compliance → soon, sign missing → routine). Each action includes a static reasoning string explaining the urgency classification and an estimated effort.

This is the **control condition**. It represents the null hypothesis: simple heuristic prioritization is sufficient.

#### 2. `LLMPlanner` (Treatment — Generic)

Sends findings to the same Ollama endpoint with a planning prompt. The prompt asks the LLM to reason about prioritization, considering:
- Safety impact (spills > compliance > cosmetic)
- Customer visibility (front-of-store > back)
- Cascading effects (empty shelf → lost sales accumulation)
- Staff efficiency (group nearby tasks)

No symbolic framework. Just "think about what matters and why." This isolates the effect of *having an LLM reason* from the effect of *reasoning through a specific framework*.

#### 3. `FrameworkPlanner` (Treatment — Symbolic)

Same LLM call, but the planning prompt includes a symbolic reasoning framework. The framework provides a structured lens:

**Sunzi-informed variant**: Findings are assessed through five factors (from Sunzi Bingfa ch.1): terrain (store layout), timing (time of day / traffic patterns), leadership (staff availability), doctrine (store standards), and conditions (seasonal / promotional context). The planner maps each finding to these factors before prioritizing.

**Hexagram-informed variant**: The set of findings is mapped to a hexagram via a deterministic hash (finding types + locations → hexagram index). The hexagram's judgment and line texts provide a reasoning frame. This directly parallels the warring states yarrow condition.

The symbolic framework is *not expected to produce objectively better plans*. The hypothesis, informed by the warring states results, is that it produces **qualitatively different reasoning** — different prioritization rationale, different grouping logic, different sensitivity to context. Whether "different" is also "better" is the empirical question.

### Experimental Design

| Condition | Planner | What it tests |
|-----------|---------|---------------|
| Control (heuristic) | `DirectPlanner` | Baseline: deterministic rules |
| LLM (generic) | `LLMPlanner` | Does LLM reasoning add value over heuristics? |
| LLM (Sunzi) | `FrameworkPlanner` (Sunzi) | Does a strategic framework change reasoning quality? |
| LLM (hexagram) | `FrameworkPlanner` (hexagram) | Does the warring states approach transfer to a real domain? |

Evaluation (for research, not for the demo):
- **Plan quality**: Does a retail operations expert prefer one plan over another? (human eval)
- **Reasoning diversity**: Do framework plans cite different factors than generic plans? (text analysis)
- **Consistency**: Given the same findings twice, does each planner produce the same priorities? (determinism test)
- **Failure modes**: Do the LLM anti-patterns from warring states (probe addiction, crystallization) appear in retail reasoning?

### UI Integration

A toggle in the header alongside the existing MOCK/LIVE toggle:

```
[MOCK ○ LIVE]   [DIRECT ○ REASONED]
```

When DIRECT: current behavior (findings → templated tasks, no LLM planning call).
When REASONED: findings → planner → prioritized tasks with reasoning traces shown.

The reasoning trace is displayed as an expandable section under each task, similar to the existing "Raw VLM Response" details element.

In research mode (future), a side-by-side comparison shows how two different planners prioritize the same findings.

### Data Logging

Every planning invocation logs:
- Timestamp
- Input findings (JSON)
- Planner used
- Output plan (JSON)
- Reasoning trace (full text)
- Latency (ms)

Logs are local (JSON lines to `data/planning-logs/`). No cloud dependency. This is the experimental data for comparing reasoning across conditions.

## Implementation Phases

### Phase 1 — DirectPlanner + Interface (This PR)

- Define `Planner`, `ActionPlan`, `PlannedAction` types in `src/lib/planner.ts`
- Implement `DirectPlanner` (deterministic, no LLM call)
- Wire into `page.tsx` replacing `generateTasks()`
- Add priority ordering and urgency labels to task display
- No new toggle yet — DirectPlanner is the default

### Phase 2 — LLMPlanner + Toggle

- Implement `LLMPlanner` with generic planning prompt
- Add DIRECT/REASONED toggle to UI
- Add reasoning trace display (expandable under each task)
- Route planning through `/api/plan` server endpoint (parallels `/api/analyze`)

### Phase 3 — FrameworkPlanner + Logging

- Implement `FrameworkPlanner` with Sunzi and hexagram variants
- Add framework selector (dropdown or toggle when REASONED mode is active)
- Add JSON-lines logging for all planning invocations
- Import relevant data from `warringstates-day/src/data/` (hexagram data, Sunzi chapter summaries)

### Phase 4 — Research Tooling

- Side-by-side comparison view (same findings, two planners)
- Log analysis scripts (reasoning diversity metrics, consistency tests)
- Export format compatible with warring states experiment analysis

## Connection to Warring States

| Warring States Concept | Retail Equivalent |
|----------------------|-------------------|
| Game state (territory, army, treasury) | Store state (findings, staff, time) |
| Han's yarrow consultation | Framework-informed planning |
| Control condition (no hexagram) | DirectPlanner / LLMPlanner |
| Per-round oracle prompt | Per-scan planning prompt |
| Memory bank (cross-game learning) | Planning logs (cross-scan patterns) |
| Behavioral signatures (support order rate, reasoning text length) | Planning signatures (priority ordering, reasoning diversity) |

The key parallel: in warring states, the oracle doesn't change *whether* Han survives (survival rates converge). It changes *how* Han reasons and acts (behavioral signatures diverge). The retail hypothesis is the same: the framework won't necessarily produce "better" task lists, but it will produce *differently reasoned* task lists, and the reasoning quality may matter for trust, adoption, and edge-case handling.

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Planning adds latency to an already slow pipeline | Medium | DirectPlanner is instant. LLMPlanner adds ~5-10s. Make it a toggle, not the default. |
| Symbolic frameworks feel gimmicky in a retail context | High | Frame as research, not product. The Sunzi variant is more defensible than hexagrams for retail — start there. |
| Overfitting to the warring states experimental design | Medium | The retail domain has different constraints. Adapt the experimental design, don't copy it blindly. |
| LLM planning produces confident-sounding nonsense | Medium | Always show the reasoning trace. Transparency is the mitigation. |
| Scope creep toward a full decision-support system | High | Hard gate: Phase 4 is research tooling, not product features. This is a demo + research instrument, not a production system. |

## References

- ADR-001: Local VLM Selection (this repo)
- `warringstates-engine` ADR-001: LLM Agent Architecture
- `warringstates-day` ADR-002: Game Engine Architecture (Phase 4 — Symbolic Priors)
- `warringstates-day` ADR-003: Autoresearch Findings and Seed Sensitivity
- Bryson & Ho, *Applied Optimal Control* (1975) — classical model-based planning lineage
- Nguyen & Widrow, "Neural Networks for Self-Learning Control Systems" (1990) — neural world model precursor
- Ha & Schmidhuber, "World Models" (2018) — popularization of neural world models
- LeCun, "A Path Towards Autonomous Machine Intelligence" (2022) — JEPA / world model manifesto
- Chan, "King Wen Sequence-Based Optimization" (arXiv:2604.09234) — Phase 1 negative results
- Sunzi Bingfa, Chapter 1 (Laying Plans) — five factors framework
