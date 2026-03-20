"use client";

import { useState } from "react";
import {
  Camera,
  Search,
  AlertTriangle,
  Package,
  MapPin,
  Droplets,
  Ban,
  HelpCircle,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Finding } from "@/lib/vlm-client";

interface Observation {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface Task {
  id: string;
  description: string;
  findingType: string;
}

const FINDING_ICONS: Record<string, React.ReactNode> = {
  empty_shelf: <Package className="w-5 h-5" />,
  compliance_mismatch: <AlertTriangle className="w-5 h-5" />,
  sign_missing: <MapPin className="w-5 h-5" />,
  spill: <Droplets className="w-5 h-5" />,
  obstruction: <Ban className="w-5 h-5" />,
};

const FINDING_LABELS: Record<string, string> = {
  empty_shelf: "Empty Shelf",
  compliance_mismatch: "Compliance Issue",
  sign_missing: "Missing Sign",
  spill: "Spill Detected",
  obstruction: "Obstruction",
};

const TASK_TEMPLATES: Record<string, (location: string) => string> = {
  empty_shelf: (loc) => `Restock shelves at ${loc}`,
  compliance_mismatch: (loc) => `Fix compliance issue at ${loc}`,
  sign_missing: (loc) => `Replace missing signage at ${loc}`,
  spill: (loc) => `Clean up spill at ${loc}`,
  obstruction: (loc) => `Clear obstruction at ${loc}`,
};

function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-ink-muted hover:text-ink-secondary transition-colors cursor-help"
        aria-label="Help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 left-0 top-8 w-72 p-4 bg-white border border-border rounded-xl shadow-xl text-xl text-ink-secondary leading-relaxed">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-ink-muted hover:text-ink-secondary"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pr-5">{text}</div>
          </div>
        </>
      )}
    </span>
  );
}

function generateTasks(findings: Finding[]): Task[] {
  return findings.map((f, i) => ({
    id: `t-${i}`,
    description:
      (TASK_TEMPLATES[f.type] ?? ((loc: string) => `Address issue at ${loc}`))(
        f.location
      ),
    findingType: f.type,
  }));
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [domainId, setDomainId] = useState("");
  const [markerId, setMarkerId] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(true);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [showDomain, setShowDomain] = useState(false);

  const hasResults = findings.length > 0 || tasks.length > 0;

  const handleAnalyze = async () => {
    if (observations.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setRawResponse(null);

    if (useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockFindings: Finding[] = [
        { type: "empty_shelf", location: "aisle-3-bay-2", confidence: 0.91 },
        {
          type: "compliance_mismatch",
          location: "promo-endcap-1",
          confidence: 0.84,
        },
        { type: "sign_missing", location: "aisle-7", confidence: 0.78 },
      ];
      setFindings(mockFindings);
      setTasks(generateTasks(mockFindings));
      setRawResponse("[Mock VLM Response]");
      setIsAnalyzing(false);
      return;
    }

    try {
      const base64Images = await Promise.all(
        observations.map((obs) => fileToBase64(obs.file))
      );

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: base64Images, domainId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Analysis failed (${res.status})`);
      }

      const vlmFindings: Finding[] = data.findings ?? [];
      setFindings(vlmFindings);
      setTasks(generateTasks(vlmFindings));
      setRawResponse(data.rawResponse ?? null);

      if (vlmFindings.length === 0) {
        setError(
          "No issues detected. The image may not contain retail problems, or try a clearer photo."
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
      setFindings([]);
      setTasks([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newObservations: Observation[] = Array.from(files).map(
      (file, i) => ({
        id: `obs-${Date.now()}-${i}`,
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      })
    );

    setObservations((current) => [...current, ...newObservations]);
  };

  const removeObservation = (id: string) => {
    setObservations((current) => {
      const obs = current.find((o) => o.id === id);
      if (obs) URL.revokeObjectURL(obs.url);
      return current.filter((o) => o.id !== id);
    });
  };

  const reset = () => {
    observations.forEach((obs) => URL.revokeObjectURL(obs.url));
    setObservations([]);
    setFindings([]);
    setTasks([]);
    setError(null);
    setRawResponse(null);
  };

  return (
    <main className="min-h-screen bg-parchment bg-dot text-ink font-display">
      {/* Header */}
      <header className="max-w-3xl mx-auto px-4 md:px-8 pt-10 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="opacity-0 animate-fade-in stagger-1">
            <div className="font-mono text-xl font-medium tracking-[0.25em] text-accent mb-3 uppercase">
              Auki Labs
            </div>
            <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-light text-ink tracking-tight leading-[1.05]">
              Retail Perception Kit
            </h1>
            <p className="font-mono text-xl text-ink-muted mt-3 tracking-wide">
              perception-first audit · real-world web
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1 shrink-0 opacity-0 animate-fade-in stagger-1">
            <button
              onClick={() => setUseMock(!useMock)}
              className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xl font-medium rounded-full border transition-all ${
                useMock
                  ? "border-border text-ink-muted hover:border-border-strong hover:text-ink-secondary"
                  : "border-accent/30 text-accent bg-accent-light hover:bg-accent/10"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  useMock ? "bg-ink-muted" : "bg-accent"
                }`}
              />
              {useMock ? "MOCK" : "LIVE"}
            </button>
            <HelpTip text="Mock mode returns sample data instantly. Live mode sends images to a local Qwen3-VL model via Ollama for real AI analysis (~20-30s). Toggle to switch." />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-3 pb-20">
        {/* Step 01 — Set Location */}
        <section className="opacity-0 animate-slide-up stagger-1">
          <button
            onClick={() => setShowDomain(!showDomain)}
            className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-xl border border-border hover:border-border-strong hover:bg-surface-hover transition-all text-left"
          >
            <span className="font-mono text-xl font-semibold text-accent tracking-widest shrink-0 tabular-nums">
              01
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-display font-semibold text-xl text-ink">
                Set Location
              </span>
            </div>
            <span className="font-mono text-xl font-medium tracking-widest text-accent/70 border border-accent/20 rounded-full px-3 py-0.5 shrink-0 uppercase">
              Optional
            </span>
            {domainId && (
              <span className="font-mono text-xl text-accent/80 bg-accent-light px-3 py-0.5 rounded-full shrink-0 truncate max-w-[120px]">
                {domainId}
              </span>
            )}
            {showDomain ? (
              <ChevronUp className="w-5 h-5 text-ink-muted shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-ink-muted shrink-0" />
            )}
          </button>
          {showDomain && (
            <div className="mt-1 bg-white rounded-xl border border-border p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-mono text-xl font-medium text-ink-muted mb-2 tracking-wider uppercase">
                    Domain ID
                  </label>
                  <input
                    type="text"
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    placeholder="e.g. store-17"
                    className="w-full px-4 py-3 text-2xl bg-parchment border border-border rounded-xl text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xl font-medium text-ink-muted mb-2 tracking-wider uppercase">
                    Marker / Portal ID
                  </label>
                  <input
                    type="text"
                    value={markerId}
                    onChange={(e) => setMarkerId(e.target.value)}
                    placeholder="e.g. portal-42"
                    className="w-full px-4 py-3 text-2xl bg-parchment border border-border rounded-xl text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Step 02 — Upload */}
        <section className="bg-white rounded-xl border border-border p-5 md:p-6 opacity-0 animate-slide-up stagger-2">
          <div className="flex items-center gap-4 mb-5">
            <span className="font-mono text-xl font-semibold text-accent tracking-widest tabular-nums shrink-0">
              02
            </span>
            <div className="flex-1 h-px bg-border" />
            <span className="font-display text-xl font-semibold text-ink shrink-0">
              Upload Shelf Photos
            </span>
            <HelpTip text="Take photos of retail shelves, endcaps, or aisles. The AI detects empty shelves, compliance issues, missing signs, spills, and obstructions. Clear, well-lit photos work best." />
          </div>

          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id="photo-upload"
            />
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/40 hover:bg-accent-light/50 transition-all">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-accent-light border border-accent/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="font-display font-semibold text-xl text-ink mb-2">
                Drop photos here
              </div>
              <div className="font-mono text-xl text-ink-muted leading-relaxed">
                Shelf photos, endcaps, aisle views
                <br />
                <span className="text-ink-muted/60">
                  PNG, JPG · up to 10MB · max 5 images
                </span>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {observations.length > 0 && (
            <div className="grid grid-cols-5 gap-3 mt-5">
              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className="relative group aspect-square bg-parchment rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={obs.url}
                    alt={obs.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={() => removeObservation(obs.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                  >
                    <X className="w-3 h-3 text-ink" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 03 — Analyze */}
        <section className="opacity-0 animate-slide-up stagger-3">
          <div className="flex items-center gap-4 mb-3">
            <span className="font-mono text-xl font-semibold text-accent tracking-widest tabular-nums shrink-0">
              03
            </span>
            <div className="flex-1 h-px bg-border" />
            <span className="font-display text-xl font-semibold text-ink shrink-0">
              Analyze
            </span>
          </div>
          <button
            onClick={hasResults ? reset : handleAnalyze}
            disabled={
              hasResults ? false : observations.length === 0 || isAnalyzing
            }
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
              hasResults
                ? "bg-white border border-border text-ink-secondary hover:bg-surface-hover hover:text-ink hover:border-border-strong"
                : "bg-accent text-white hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-accent"
            }`}
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin font-mono text-xl">⟳</span>
                <span className="font-mono text-xl tracking-wide">
                  {useMock ? "Analyzing..." : "Analyzing with Qwen3-VL..."}
                </span>
              </>
            ) : hasResults ? (
              <>
                <RotateCcw className="w-5 h-5" />
                <span className="font-display text-xl font-semibold">
                  New Scan
                </span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span className="font-display text-xl font-semibold">
                  Analyze
                  {observations.length > 0
                    ? ` ${observations.length} Photo${observations.length > 1 ? "s" : ""}`
                    : ""}
                </span>
              </>
            )}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="opacity-0 animate-fade-in bg-red-50 border border-red-200 rounded-xl p-4 mt-3">
            <div className="flex items-center gap-2 text-red-600 font-mono text-xl">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-4 mt-5 opacity-0 animate-slide-up stagger-4">
            {/* Findings */}
            <section className="bg-white rounded-xl border border-border p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent" />
                  <span className="font-display font-semibold text-xl text-ink">
                    {findings.length} Issue{findings.length !== 1 ? "s" : ""} Found
                  </span>
                </div>
                <HelpTip text="Issues detected by the AI with confidence scores. Higher confidence means the model is more certain about the detection." />
              </div>
              <div className="space-y-3">
                {findings.map((finding, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-parchment rounded-xl border border-border"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent-light border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      {FINDING_ICONS[finding.type] || (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-xl text-ink">
                        {FINDING_LABELS[finding.type] || finding.type}
                      </div>
                      <div className="font-mono text-xl text-ink-muted truncate mt-1">
                        {finding.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xl text-ink-secondary tabular-nums">
                        {Math.round(finding.confidence * 100)}%
                      </span>
                      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${finding.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tasks */}
            <section className="bg-white rounded-xl border border-border p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <svg
                  className="w-5 h-5 text-sage shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span className="font-display font-semibold text-xl text-ink">
                  {tasks.length} Task{tasks.length !== 1 ? "s" : ""} Generated
                </span>
                <HelpTip text="Actionable tasks auto-generated from findings. In production, these would be assigned to staff and routed via Auki's pathfinding." />
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 bg-parchment rounded-xl border border-border"
                  >
                    <div className="w-6 h-6 rounded border-2 border-border-strong mt-0.5 shrink-0" />
                    <div className="font-mono text-xl text-ink-secondary leading-relaxed pt-0.5">
                      {task.description}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Raw VLM Response */}
            {rawResponse && !useMock && (
              <details className="bg-parchment rounded-xl border border-border p-5">
                <summary className="font-mono text-xl font-medium text-ink-muted cursor-pointer hover:text-ink-secondary tracking-wider uppercase">
                  Raw VLM Response
                </summary>
                <pre className="mt-4 font-mono text-xl text-ink-muted whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {rawResponse}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-6" />
      </div>
    </main>
  );
}
