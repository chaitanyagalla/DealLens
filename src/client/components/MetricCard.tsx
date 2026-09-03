interface MetricCardProps {
  label: string;
  score: number;
  helper: string;
  tone?: "acid" | "mint" | "warn";
}

const toneStyles = {
  acid: "text-acid bg-acid",
  mint: "text-mint bg-mint",
  warn: "text-warn bg-warn",
} as const;

export function MetricCard({ label, score, helper, tone = "acid" }: MetricCardProps) {
  const [textTone, barTone] = toneStyles[tone].split(" ");

  return (
    <article className="rounded-xl border border-line bg-panel px-5 py-5 shadow-lg shadow-black/10">
      <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <strong className={`font-mono text-4xl font-medium ${textTone}`}>{score}</strong>
        <span className="pb-1 font-mono text-xs text-muted">/ 100</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden="true">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">{helper}</p>
    </article>
  );
}

