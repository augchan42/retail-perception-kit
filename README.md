# Retail Perception Kit

A phone-based retail audit demo that demonstrates the "perception-first" thesis — phones pre-deploy environments before robots arrive.

**Current Status:** V2 (Ollama Integration + Planning Layer)

## The Thesis

From Auki's strategy:
> Win by deploying perception first, using phones/glasses to pre-deploy environments, then let robots inherit that spatial context later.

This demo proves the concept: capture observations → analyze with a local VLM → plan prioritized actions with reasoning. Immediate business value from phones, without requiring robots.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

1. (Optional) Enter Domain ID and Marker ID
2. Upload retail shelf photos
3. Click "Analyze"
4. See findings and a prioritized action plan with urgency labels and reasoning

The app defaults to **mock mode** for instant demos. Toggle to **live mode** to use a local Ollama VLM.

### Live Mode Setup (Optional)

```bash
brew install ollama
brew services start ollama
ollama pull qwen3-vl:32b-instruct    # ~20GB, primary model
ollama pull qwen3-vl:8b-instruct     # ~5GB, fast fallback
```

Environment variables (optional):
- `OLLAMA_ENDPOINT` — Ollama API URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL` — Model to use (default: `qwen3-vl:32b-instruct`)

## Architecture

```
Image(s)
  │
  ▼
┌─────────────┐
│  VLM Layer   │  ← Qwen3-VL via Ollama (or mock)
│  (Perception)│
└──────┬──────┘
       │ Finding[]
       ▼
┌─────────────┐
│  Planner     │  ← Urgency-based prioritization with reasoning
│  (Reasoning) │
└──────┬──────┘
       │ ActionPlan
       ▼
┌─────────────┐
│  UI Layer    │  ← Prioritized tasks with reasoning traces
│  (Action)    │
└─────────────┘
```

See `docs/adr/001-local-vlm-selection.md` for model selection and `docs/adr/002-planning-layer-design.md` for the planning layer design.

## Integration Points (Auki Repos)

| Component | Current | Real Integration |
|-----------|---------|-----------------|
| Domain Localization | Manual input | Posemesh SDK → domain-server |
| Image Analysis | Qwen3-VL via Ollama | vlm-node API or Ollama |
| Findings Storage | In-memory | domain-server (domain metadata) |
| Task Routing | Planner prioritization | pathfinding repo |

## Why This Matters

1. **Immediate value** — Phones capture observations and generate prioritized tasks without robots
2. **Lower risk** — No reliability burden of locomotion/manipulation
3. **Territory capture** — Environments become AI-accessible
4. **Robot-ready** — Domains prepared for robot handoff later

## License

MIT
