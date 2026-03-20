/**
 * VLM Client Interface
 * 
 * This file shows the integration points for real VLM analysis.
 * 
 * V1: Uses MockVLMClient for demo purposes.
 * 
 * REAL INTEGRATION:
 * 1. RealVLMClient connects to local Ollama instance
 * 2. Or connect to vlm-node API (see vlm-node repo)
 * 
 * Repos:
 * - vlm-node: https://github.com/aukilabs/vlm-node
 * - Ollama: https://ollama.com
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
  analyze(observations: { id: string; url: string }[], domainId: string): Promise<VLMAnalysisResult>;
}

/**
 * Mock VLM Client
 * Returns sample findings for demo purposes
 */
export class MockVLMClient implements VLMClient {
  async analyze(observations: { id: string; url: string }[], domainId: string): Promise<VLMAnalysisResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return sample findings
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
 * Real VLM Client (TODO: Implement)
 * 
 * Connect to Ollama or vlm-node:
 * 
 * Option 1: Local Ollama
 * const response = await fetch('http://localhost:11434/api/generate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     model: 'moondream:1.8b',
 *     prompt: 'Analyze this retail image for: empty shelves, compliance issues, missing signs',
 *     images: [base64Image]
 *   })
 * });
 * 
 * Option 2: vlm-node API
 * const response = await fetch('https://your-vlm-node.com/api/v1/jobs', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     job_type: 'task_timing_v1',
 *     domain_id: domainId,
 *     input: {
 *       prompt: 'Analyze for retail compliance...',
 *       vlm_prompt: 'Describe what you see in this image'
 *     }
 *   })
 * });
 * 
 * Then parse response into Finding[] format.
 */
export class RealVLMClient implements VLMClient {
  private endpoint: string;
  private model: string;

  constructor(endpoint: string = "http://localhost:11434", model: string = "moondream:1.8b") {
    this.endpoint = endpoint;
    this.model = model;
  }

  async analyze(observations: { id: string; url: string }[], domainId: string): Promise<VLMAnalysisResult> {
    // TODO: Implement actual VLM call
    throw new Error("Not implemented - connect to Ollama or vlm-node");
  }
}

// V1: Export mock by default
// Change to RealVLMClient for real integration
export const vlmClient = new MockVLMClient();