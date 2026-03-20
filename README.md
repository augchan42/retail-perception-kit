# Retail Perception Kit

A phone-based retail audit demo that demonstrates the "perception-first" thesis — phones pre-deploy environments before robots arrive.

**Current Status:** V1 Demo (Mock VLM)

## The Thesis

From Auki's strategy:
> Win by deploying perception first, using phones/glasses to pre-deploy environments, then let robots inherit that spatial context later.

This demo proves the concept: capture observations → analyze for retail findings → generate actionable tasks. Immediate business value from phones, without requiring robots.

## Demo

```bash
npm install
npm run dev
```

Open http://localhost:3000

1. Enter Domain ID and Marker ID (simulation)
2. Upload images (or use camera in V2)
3. Click "Analyze"
4. See findings and generated tasks

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Domain Input  │────▶│ VLM Client   │────▶│  Findings +     │
│  (Localization)│     │ (Mock/Real)  │     │  Tasks          │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
   domain-server           vlm-node                 pathfinding
   (future)              / Ollama                  (future)
```

## Integration Points (Auki Repos)

| Component | Current | Real Integration |
|-----------|---------|-----------------|
| Domain Localization | Manual input | Posemesh SDK → domain-server |
| Image Analysis | Mock responses | vlm-node API or Ollama |
| Findings Storage | In-memory | domain-server (domain metadata) |
| Task Routing | None | pathfinding repo |

### Repo Mapping

- **domain-server** — Store portals, reconstructions, domain data
  - Use for: Store findings as domain metadata, query domain info
  
- **reconstruction-server** — 3D reconstruction compute node
  - Use for: Generate domain from captured observations (future)

- **vlm-node** — VLM/LLM for retail image analysis
  - Use for: Real analysis API instead of mock
  - Key feature: Task timing detection in retail environments

- **posemesh** — Core spatial computing protocol
  - Use for: Replace manual domain/marker input with SDK

- **pathfinding** — Hybrid graph/navmesh pathfinding
  - Use for: Route staff to task locations

- **LandmarkCalibrationSampleARKit** — iOS marker-based localization
  - Use for: Mobile app foundation (V3+)

- **domain-viewer** — 3D domain visualization
  - Use for: Visualize captured domains with findings overlaid

## VLM Integration

### Option 1: vlm-node (Recommended)

See [vlm-node repo](https://github.com/aukilabs/vlm-node):

```bash
# Start vlm-node
cd vlm-node
make docker-cpu

# Submit job
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "job_type": "task_timing_v1",
    "domain_id": "store-17",
    "input": {
      "prompt": "Analyze for retail compliance: empty shelves, wrong prices, missing signs",
      "vlm_prompt": "Describe what you see in this retail image"
    }
  }'
```

### Option 2: Local Ollama

```bash
# Install Ollama
ollama pull moondream:1.8b

# Use in RealVLMClient
const client = new RealVLMClient("http://localhost:11434", "moondream:1.8b");
```

## Roadmap

- [x] V1: Mock VLM flow with image upload
- [ ] V2: Real camera capture (getUserMedia)
- [ ] V3: Real VLM integration (vlm-node or Ollama)
- [ ] V4: Domain localization (Posemesh SDK)
- [ ] V5: Mobile app (iOS/Android)

## Why This Matters

This demonstrates the "perception-first" thesis:

1. **Immediate value** — Phones capture observations and generate tasks without robots
2. **Lower risk** — No reliability burden of locomotion/manipulation
3. **Territory capture** — Environments become AI-accessible
4. **Robot-ready** — Domains prepared for robot handoff later

This is stronger than generic indoor directions — it's business output from day one.

## License

MIT