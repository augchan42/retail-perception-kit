import type { Finding } from "./vlm-client";

export interface PlannerContext {
  findings: Finding[];
  domainId?: string;
}

export interface PlannedAction {
  id: string;
  description: string;
  findingType: string;
  priority: number;
  urgency: "immediate" | "soon" | "routine";
  reasoning: string;
  estimatedEffort: string;
}

export interface ActionPlan {
  actions: PlannedAction[];
  summary: string;
  frameworkUsed: string;
  reasoningTrace?: string;
}

export interface Planner {
  plan(context: PlannerContext): Promise<ActionPlan>;
}

const URGENCY_MAP: Record<string, PlannedAction["urgency"]> = {
  spill: "immediate",
  obstruction: "immediate",
  empty_shelf: "soon",
  compliance_mismatch: "soon",
  sign_missing: "routine",
};

const URGENCY_RANK: Record<PlannedAction["urgency"], number> = {
  immediate: 0,
  soon: 1,
  routine: 2,
};

const EFFORT_MAP: Record<string, string> = {
  spill: "5-10 min",
  obstruction: "5 min",
  empty_shelf: "10-15 min",
  compliance_mismatch: "10-20 min",
  sign_missing: "5-10 min",
};

const TASK_DESCRIPTIONS: Record<string, (location: string) => string> = {
  empty_shelf: (loc) => `Restock shelves at ${loc}`,
  compliance_mismatch: (loc) => `Fix compliance issue at ${loc}`,
  sign_missing: (loc) => `Replace missing signage at ${loc}`,
  spill: (loc) => `Clean up spill at ${loc}`,
  obstruction: (loc) => `Clear obstruction at ${loc}`,
};

const URGENCY_REASONING: Record<string, string> = {
  spill: "Safety hazard — slip risk requires immediate attention",
  obstruction: "Safety and accessibility hazard — must be cleared promptly",
  empty_shelf: "Direct revenue impact — every minute of empty shelf is lost sales",
  compliance_mismatch: "Regulatory or brand standards risk — address before next audit window",
  sign_missing: "Customer experience issue — low urgency but contributes to friction",
};

export class DirectPlanner implements Planner {
  async plan(context: PlannerContext): Promise<ActionPlan> {
    const sorted = [...context.findings].sort((a, b) => {
      const urgencyDiff =
        URGENCY_RANK[URGENCY_MAP[a.type] ?? "routine"] -
        URGENCY_RANK[URGENCY_MAP[b.type] ?? "routine"];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });

    const actions: PlannedAction[] = sorted.map((f, i) => ({
      id: `pa-${i}`,
      description: (
        TASK_DESCRIPTIONS[f.type] ??
        ((loc: string) => `Address issue at ${loc}`)
      )(f.location),
      findingType: f.type,
      priority: i + 1,
      urgency: URGENCY_MAP[f.type] ?? "routine",
      reasoning: URGENCY_REASONING[f.type] ?? "Standard priority",
      estimatedEffort: EFFORT_MAP[f.type] ?? "10 min",
    }));

    const immediateCount = actions.filter(
      (a) => a.urgency === "immediate"
    ).length;

    const summary =
      immediateCount > 0
        ? `${immediateCount} immediate action${immediateCount > 1 ? "s" : ""}, ${actions.length} total`
        : `${actions.length} task${actions.length !== 1 ? "s" : ""} prioritized by urgency`;

    return {
      actions,
      summary,
      frameworkUsed: "direct",
    };
  }
}
