import type { LeadDecision, PriorityLabel } from "../../shared/contracts";

const badgeBase = "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium";

const decisionStyles: Record<LeadDecision, string> = {
  SHORTLIST: "border-mint/25 bg-mint/10 text-mint",
  RESEARCH: "border-warn/25 bg-warn/10 text-warn",
  REJECT: "border-danger/25 bg-danger/10 text-danger",
};

const priorityStyles: Record<PriorityLabel, string> = {
  High: "border-warn/25 bg-warn/10 text-warn",
  Medium: "border-mint/25 bg-mint/10 text-mint",
  Low: "border-white/10 bg-white/5 text-muted",
};

export function formatDecision(decision: LeadDecision): string {
  if (decision === "SHORTLIST") return "Shortlist";
  if (decision === "RESEARCH") return "Research";
  return "Reject";
}

export function DecisionBadge({ decision }: { decision: LeadDecision }) {
  return (
    <span className={`${badgeBase} ${decisionStyles[decision]}`}>
      {formatDecision(decision)}
    </span>
  );
}

export function PriorityBadge({ label }: { label: PriorityLabel }) {
  return <span className={`${badgeBase} ${priorityStyles[label]}`}>{label}</span>;
}
