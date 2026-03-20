import { NextRequest, NextResponse } from "next/server";
import { RealVLMClient } from "@/lib/vlm-client";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB decoded

const vlm = new RealVLMClient(
  process.env.OLLAMA_ENDPOINT,
  process.env.OLLAMA_MODEL,
);

export async function POST(req: NextRequest) {
  try {
    const { images, domainId } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Too many images (max ${MAX_IMAGES})` },
        { status: 400 },
      );
    }

    // Strip data URL prefixes — Ollama expects raw base64
    const base64Images: string[] = [];
    for (const img of images) {
      if (typeof img !== "string") {
        return NextResponse.json({ error: "Each image must be a base64 string" }, { status: 400 });
      }
      const raw = img.replace(/^data:image\/[^;]+;base64,/, "");
      // Rough decoded-size check: base64 is ~4/3 of original
      if (raw.length * 0.75 > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json({ error: "Image exceeds 10MB limit" }, { status: 400 });
      }
      base64Images.push(raw);
    }

    const result = await vlm.analyze(base64Images, domainId ?? "");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    // Distinguish Ollama not running from other errors
    const isConnectionError =
      message.includes("ECONNREFUSED") || message.includes("fetch failed");

    if (isConnectionError) {
      return NextResponse.json(
        { error: "Ollama is not running. Start it with: ollama serve" },
        { status: 503 },
      );
    }

    // Don't leak internal error details to the client
    console.error("VLM analysis failed:", message);
    return NextResponse.json(
      { error: "Analysis failed. Check server logs for details." },
      { status: 500 },
    );
  }
}
