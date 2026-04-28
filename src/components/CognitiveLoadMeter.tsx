import { cognitiveLoad } from "@/lib/store";
import type { Task } from "@/lib/types";

export function CognitiveLoadMeter({ tasks }: { tasks: Task[] }) {
  const { level, openCount, pct } = cognitiveLoad(tasks);
  const gradient =
    level === "low" ? "var(--gradient-meter-low)" : level === "medium" ? "var(--gradient-meter-med)" : "var(--gradient-meter-high)";
  const label = { low: "Low — clear mind", medium: "Medium — focus up", high: "High — let us decide for you" }[level];

  return (
    <div className="surface-card rounded-3xl p-6 border border-border/60">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Cognitive Load</div>
          <div className="font-display text-2xl mt-1 capitalize">{level}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-display gradient-text">{openCount}</div>
          <div className="text-xs text-muted-foreground">open tasks</div>
        </div>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: gradient }}
        />
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
