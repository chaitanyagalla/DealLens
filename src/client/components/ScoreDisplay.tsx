interface ScoreDisplayProps {
  score: number;
  label: string;
  tone?: "primary" | "neutral";
}

export function ScoreDisplay({ score, label, tone = "primary" }: ScoreDisplayProps) {
  return (
    <div className="min-w-20" aria-label={`${label}: ${score} out of 100`}>
      <span className={`font-mono text-base font-medium ${tone === "primary" ? "text-mint" : "text-ink"}`}>
        {score}
      </span>
      <div className="mt-2 h-1 w-full max-w-20 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
        <div
          className={`h-full rounded-full ${tone === "primary" ? "bg-mint" : "bg-muted"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

