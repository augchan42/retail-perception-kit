"use client";

import { useState } from "react";
import { Camera, Upload, Search, CheckCircle, AlertTriangle, Package, MapPin } from "lucide-react";

interface Observation {
  id: string;
  url: string;
  name: string;
}

interface Finding {
  type: string;
  location: string;
  confidence: number;
}

interface Task {
  id: string;
  description: string;
  findingType: string;
}

const MOCK_FINDINGS: Finding[] = [
  { type: "empty_shelf", location: "aisle-3-bay-2", confidence: 0.91 },
  { type: "compliance_mismatch", location: "promo-endcap-1", confidence: 0.84 },
  { type: "sign_missing", location: "aisle-7", confidence: 0.78 },
];

const MOCK_TASKS: Task[] = [
  { id: "t1", description: "Restock aisle 3 bay 2", findingType: "empty_shelf" },
  { id: "t2", description: "Correct promo endcap signage", findingType: "compliance_mismatch" },
  { id: "t3", description: "Replace missing aisle 7 sign", findingType: "sign_missing" },
];

const FINDING_ICONS: Record<string, React.ReactNode> = {
  empty_shelf: <Package className="w-4 h-4" />,
  compliance_mismatch: <AlertTriangle className="w-4 h-4" />,
  sign_missing: <MapPin className="w-4 h-4" />,
};

const FINDING_LABELS: Record<string, string> = {
  empty_shelf: "Empty Shelf",
  compliance_mismatch: "Compliance Issue",
  sign_missing: "Missing Sign",
};

export default function Home() {
  const [domainId, setDomainId] = useState("");
  const [markerId, setMarkerId] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // V1: Uses mock VLM client. 
  // REAL INTEGRATION: Replace with RealVLMClient that calls Ollama/vlm-node.
  // See /lib/vlm-client.ts for integration points.
  const handleAnalyze = async () => {
    if (observations.length === 0) return;
    
    setIsAnalyzing(true);
    
    // Simulate VLM processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // V1: Return mock findings
    // REAL: Call VLMClient.analyze(observations, domainId) and parse response
    setFindings(MOCK_FINDINGS);
    setTasks(MOCK_TASKS);
    setIsAnalyzing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newObservations: Observation[] = Array.from(files).map((file, i) => ({
      id: `obs-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setObservations([...observations, ...newObservations]);
  };

  const reset = () => {
    setFindings([]);
    setTasks([]);
  };

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Retail Perception Kit</h1>
        <p className="text-gray-600 mt-2">
          Phone-based audit demo — perception first, robots later
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          Demo Mode (Mock VLM)
        </div>
      </header>

      {/* Domain Localization */}
      <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-500" />
          Domain Localization
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain ID</label>
            <input
              type="text"
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              placeholder="e.g., store-17"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {/* REAL INTEGRATION: Use Posemesh SDK to resolve marker → domain */}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marker/Portal ID</label>
            <input
              type="text"
              value={markerId}
              onChange={(e) => setMarkerId(e.target.value)}
              placeholder="e.g., portal-42"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Observation Capture */}
      <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-gray-500" />
          Capture Observations
        </h2>
        
        {/* V1: Image upload as fallback for camera API complexity */}
        {/* REAL: Use getUserMedia for real camera capture */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:underline">Click to upload</span>
            <span className="text-gray-500"> or drag and drop</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
        </div>

        {/* Gallery */}
        {observations.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {observations.map((obs) => (
              <div key={obs.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={obs.url} alt={obs.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={observations.length === 0 || isAnalyzing}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <span className="animate-spin">⏳</span>
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze Observations
            </>
          )}
        </button>
      </section>

      {/* Results */}
      {(findings.length > 0 || tasks.length > 0) && (
        <div className="space-y-6">
          {/* Findings */}
          <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Findings ({findings.length})
              </h2>
              <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">
                Reset
              </button>
            </div>
            <div className="space-y-3">
              {findings.map((finding, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-orange-500 mt-0.5">
                    {FINDING_ICONS[finding.type] || <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{FINDING_LABELS[finding.type] || finding.type}</div>
                    <div className="text-sm text-gray-600">{finding.location}</div>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded ${
                      finding.confidence >= 0.9 ? "bg-green-100 text-green-800" :
                      finding.confidence >= 0.8 ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {Math.round(finding.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tasks */}
          <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Generated Tasks ({tasks.length})
            </h2>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="font-medium text-green-900">{task.description}</div>
                </div>
              ))}
            </div>
            
            {/* Future: Add pathfinding integration */}
            {/* REAL INTEGRATION: Use pathfinding repo to route staff to task locations */}
          </section>
        </div>
      )}

      {/* Integration Notes */}
      <footer className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Integration Points (Auki Repos)</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Domain:</strong> Replace manual input with Posemesh SDK for real localization</li>
          <li><strong>VLM:</strong> Connect to vlm-node API or local Ollama for real analysis</li>
          <li><strong>Storage:</strong> Store findings in domain-server as domain metadata</li>
          <li><strong>Routing:</strong> Use pathfinding repo to route staff to issues</li>
        </ul>
      </footer>
    </main>
  );
}