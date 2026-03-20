# ADR-001: Local VLM Selection for Retail Image Analysis

**Status:** Accepted
**Date:** 2026-03-20
**Decision Makers:** Team

## Context

The Retail Perception Kit MVP needs a vision-language model (VLM) to analyze retail shelf images and return structured findings (empty shelves, compliance issues, missing signage). The demo targets follow-on grant funding, so it must run reliably on local hardware without cloud API dependencies or costs.

**Target hardware:** MacBook Pro with 96GB unified memory (Apple Silicon).

**Requirements:**
- Analyze retail images at reasonable resolution (shelf photos, signage, endcaps)
- Return structured output (JSON) that maps to our `Finding[]` interface (`type`, `location`, `confidence`)
- Run locally with acceptable latency for a live demo (~10-30s per analysis)
- No cloud API keys or costs
- Strong OCR and spatial reasoning for shelf/label detection

## Options Considered

### 1. Qwen3-VL-32B via Ollama (selected)

- Released October 2025; latest and most capable open-source VLM from Alibaba/Qwen
- Available sizes: 2B, 4B, 8B, 32B (dense) and 30B-A3B, 235B-A22B (MoE)
- ~20GB at Q4_K_M quantization — fits comfortably in 96GB with room for OS + app
- Native resolution support up to 1280×1280 (no forced downscaling of shelf photos)
- Strong OCR (32 languages), spatial reasoning, and structured JSON output
- Available on Ollama: `ollama pull qwen3-vl:32b-instruct`
- REST API at `localhost:11434` integrates directly with our Next.js app
- Estimated speed: ~3-5 tok/s on Apple Silicon with 96GB

### 2. Qwen3-VL-8B via Ollama

- ~5GB at Q4 quantization
- Faster inference (~10 tok/s) but noticeably lower quality on complex scenes
- Good fallback if 32B proves too slow for live demo pacing

### 3. Qwen2.5-VL-72B via Ollama

- Previous generation, ~42GB at Q4 quantization — fits in 96GB
- Top-tier quality but slow (~1-2 tok/s), likely too slow for live demo
- Superseded by Qwen3-VL in most benchmarks

### 4. Qwen2.5-VL-7B / moondream:1.8b

- Already referenced in our `RealVLMClient` stub
- Much weaker on structured output and spatial reasoning
- Superseded by Qwen3-VL family

### 5. Apple FastVLM (MLX/CoreML)

- Apple's own VLM, optimized for Apple Silicon (CVPR 2025)
- 85x faster, 3x smaller than comparable models
- Less proven for structured retail analysis tasks
- Requires MLX pipeline instead of Ollama REST API
- Worth revisiting if inference speed becomes a bottleneck

### 6. mlx-vlm (MLX framework)

- Community package for running VLMs via Apple's MLX framework
- Slightly better Metal utilization than Ollama on Apple Silicon
- More complex setup; less ergonomic API for our Next.js integration
- Worth revisiting for production but adds complexity for MVP

### 7. vLLM

- High-throughput inference server designed for NVIDIA GPU clusters
- Optimized for concurrent multi-user serving, not single-user latency
- macOS/Apple Silicon support is limited/experimental
- Overkill for a local demo on one MacBook
- **Future relevance:** When scaling to production (Linux server with NVIDIA GPUs serving multiple stores concurrently), vLLM becomes the right choice. Not needed for the grant demo.

## Decision

**Use Qwen3-VL-32B-Instruct via Ollama** as the primary model, with **Qwen3-VL-8B** as a fast fallback.

## Rationale

- **Best quality-to-speed ratio** on our hardware — 32B at Q4 fits in ~20GB, leaving 70+ GB headroom
- **Ollama REST API** is the simplest integration path: our `RealVLMClient` just needs to POST to `localhost:11434/api/generate` with base64 images
- **Structured output** capability means we can prompt for JSON matching our `Finding[]` schema directly
- **Native resolution** handling avoids downscaling shelf photos where small details (price tags, labels) matter
- **No cloud dependency** — entire demo runs offline, which is a plus for grant presentations in venues with unreliable wifi

## Inference Stack

Ollama is a user-friendly wrapper around **llama.cpp**, which is the actual inference engine. Understanding the layers matters for debugging and future optimization:

| Layer | What | Role |
|-------|------|------|
| **Model format** | GGUF (quantized) | Optimized for CPU/Metal inference, smaller than full-precision weights |
| **Inference engine** | llama.cpp (bundled in Ollama) | Runs the model on Apple Silicon via Metal GPU acceleration |
| **API layer** | Ollama REST API (`localhost:11434`) | Simple HTTP interface, no config needed |
| **Our code** | `RealVLMClient` → Ollama API | Already stubbed in `src/lib/vlm-client.ts` |

**Why not llama.cpp directly?** You *can* run llama.cpp's `llama-server` directly with a GGUF file for slightly more control (context size tuning, batch size, etc.), but Ollama handles model management, quantization selection, and Metal configuration automatically. For the MVP, the convenience wins.

**Why not vLLM?** vLLM is designed for high-throughput production serving on NVIDIA GPUs — multiple concurrent requests across many stores. It's the right tool when we scale to a centralized VLM endpoint serving 100,000+ locations, but for a local MacBook demo it adds complexity with no benefit. macOS support is also limited.

## Setup

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model (~20GB download)
ollama pull qwen3-vl:32b-instruct

# Quick fallback (smaller, faster)
ollama pull qwen3-vl:8b-instruct

# Test with a retail image
ollama run qwen3-vl:32b-instruct "Analyze this retail shelf image for empty sections, misplaced products, missing price tags, or compliance issues. Return JSON."
```

## Integration

The existing `RealVLMClient` in `src/lib/vlm-client.ts` needs to be updated:
- Change default endpoint from `http://localhost:11434` (already correct for Ollama)
- Change default model from `moondream:1.8b` to `qwen3-vl:32b-instruct`
- Implement the `analyze()` method to POST to Ollama's `/api/generate` endpoint with base64-encoded images
- Parse the VLM's text/JSON response into our `Finding[]` format

## Consequences

- **Demo depends on Ollama being installed and model pre-pulled** — must be part of demo prep checklist
- **First inference is slower** (model loading into memory) — warm up before demo
- **32B model may take 20-30s per image** — acceptable for demo but may need the 8B fallback for rapid-fire scenarios
- **Model output is non-deterministic** — prompt engineering needed to get reliable structured JSON

## References

- [Qwen3-VL on Ollama](https://ollama.com/library/qwen3-vl)
- [Qwen3-VL GitHub](https://github.com/QwenLM/Qwen3-VL)
- [Qwen3-VL Technical Report (arXiv)](https://arxiv.org/abs/2511.21631)
- [MLX-VLM (alternative runner)](https://github.com/Blaizzy/mlx-vlm)
- [Apple FastVLM](https://machinelearning.apple.com/research/fast-vision-language-models)
