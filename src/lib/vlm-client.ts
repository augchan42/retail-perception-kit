/**
 * VLM Client Interface
 *
 * V1: MockVLMClient for offline demo
 * V2: RealVLMClient connects to local Ollama (Qwen3-VL-32B)
 *
 * See ADR-001 for model selection rationale.
 */

export interface Finding {
  type: "empty_shelf" | "compliance_mismatch" | "sign_missing" | "spill" | "obstruction";
  location: string;
  confidence: number;
}

export interface VLMAnalysisResult {
  findings: Finding[];
  rawResponse?: string;
}

export interface VLMClient {
  analyze(images: string[], domainId: string): Promise<VLMAnalysisResult>;
}

const VALID_FINDING_TYPES = new Set([
  "empty_shelf",
  "compliance_mismatch",
  "sign_missing",
  "spill",
  "obstruction",
]);

const SYSTEM_PROMPT = `You are a retail shelf auditor. Analyze the provided retail store image(s) and identify issues.

Return ONLY a JSON array of findings. Each finding must have:
- "type": one of "empty_shelf", "compliance_mismatch", "sign_missing", "spill", "obstruction"
- "location": a short description of where in the image (e.g. "top shelf, left side")
- "confidence": a number between 0 and 1

Example output:
[
  {"type": "empty_shelf", "location": "bottom shelf, center", "confidence": 0.92},
  {"type": "sign_missing", "location": "endcap display", "confidence": 0.78}
]

If you see no issues, return an empty array: []

Return ONLY the JSON array, no other text.`;

/**
 * Parse the VLM's text response into typed Finding[].
 * Handles markdown code fences and extracts the JSON array.
 */
function parseFindings(raw: string): Finding[] {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Find the JSON array in the response
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];

  try {
    const parsed = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (f: Record<string, unknown>) =>
          VALID_FINDING_TYPES.has(f.type as string) &&
          typeof f.location === "string" &&
          typeof f.confidence === "number"
      )
      .map((f: Record<string, unknown>) => ({
        type: f.type as Finding["type"],
        location: f.location as string,
        confidence: Math.max(0, Math.min(1, f.confidence as number)),
      }));
  } catch {
    return [];
  }
}

/**
 * Mock VLM Client — returns sample findings for offline demos.
 */
export class MockVLMClient implements VLMClient {
  async analyze(_images: string[], _domainId: string): Promise<VLMAnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      findings: [
        { type: "empty_shelf", location: "aisle-3-bay-2", confidence: 0.91 },
        { type: "compliance_mismatch", location: "promo-endcap-1", confidence: 0.84 },
        { type: "sign_missing", location: "aisle-7", confidence: 0.78 },
      ],
      rawResponse: "[Mock VLM Response]",
    };
  }
}

/**
 * Real VLM Client — calls local Ollama with Qwen3-VL.
 * Used via the /api/analyze server route (not directly from the browser).
 */
export class RealVLMClient implements VLMClient {
  private endpoint: string;
  private model: string;

  constructor(
    endpoint?: string,
    model?: string,
  ) {
    this.endpoint = endpoint || "http://localhost:11434";
    this.model = model || "qwen3-vl:32b-instruct";
  }

  async analyze(base64Images: string[], domainId: string): Promise<VLMAnalysisResult> {
    const domainContext = domainId ? ` This is store/domain: ${domainId}.` : "";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    let response: Response;
    try {
      response = await fetch(`${this.endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze these retail shelf image(s) for issues.${domainContext}`,
              images: base64Images,
            },
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const raw: string = data.message?.content ?? "";
    const findings = parseFindings(raw);

    return { findings, rawResponse: raw };
  }
}

export const mockClient = new MockVLMClient();
