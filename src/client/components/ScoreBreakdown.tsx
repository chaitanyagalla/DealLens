import type { ScoreComponent } from "../../shared/contracts";

export function ScoreBreakdown({
  components,
}: {
  components: ScoreComponent[];
}) {
  return (
    <ul className="mt-5 border-t border-line/80">
      {components.map((component) => {
        const hasFullPoints = component.awardedPoints === component.maximumPoints;

        return (
          <li key={component.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-6 border-b border-line/80 py-4">
            <div>
              <p className="text-sm font-medium text-ink">{component.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{component.explanation}</p>
            </div>
            <span className={`shrink-0 font-mono text-xs ${hasFullPoints ? "text-ink" : "text-warn"}`}>
              {component.awardedPoints}<span className="text-muted"> / {component.maximumPoints}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
