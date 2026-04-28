import { useMemo, useState } from "react";
import { RefreshCw, Sparkles, Layers } from "lucide-react";
import { useStore, recommendTasks } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Recommend() {
  const store = useStore();
  const [seed, setSeed] = useState(0);
  const limit = store.settings.threeChoicesMode ? 3 : 5;
  const recs = useMemo(() => recommendTasks(store.tasks, store.settings, limit), [store.tasks, store.settings, seed, limit]);

  return (
    <div className="container mx-auto p-6 md:p-10 max-w-4xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-primary">Smart recommendations</div>
        <h1 className="font-display text-4xl md:text-5xl mt-2">What you should do next.</h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Suggestions adapt to your mood, energy, urgency, and the regret of leaving things undone.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 surface-card rounded-2xl p-4 border border-border/60">
        <div className="flex items-center gap-3">
          <Layers className="size-4 text-primary" />
          <span className="text-sm font-medium">3 Choices Only Mode</span>
          <Switch
            checked={store.settings.threeChoicesMode}
            onCheckedChange={(v) => { store.setSettings({ threeChoicesMode: v }); if (v) store.incDecisionsAvoided(2); }}
          />
        </div>
        <Button variant="ghost" onClick={() => { setSeed((s) => s + 1); store.incDecisionsAvoided(1); }}>
          <RefreshCw className="mr-2 size-4" /> Refresh
        </Button>
      </div>

      {recs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nothing to recommend. Add tasks first.
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map(({ task, reason, score }, i) => (
            <div
              key={task.id}
              className="surface-card rounded-3xl p-5 border border-border/60 hover:-translate-y-0.5 hover:shadow-elegant transition-smooth animate-slide-in-right"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-gradient-hero text-primary-foreground flex items-center justify-center font-display text-xl shadow-glow shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl">{task.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{task.category}</span>
                    <span>•</span>
                    <span>{task.estimatedMinutes}m</span>
                    <span>•</span>
                    <span className="capitalize">{task.energyRequired} energy</span>
                    <span>•</span>
                    <span className="capitalize">{task.priority} priority</span>
                  </div>
                  <div className="mt-3 inline-flex items-start gap-2 text-sm bg-primary/5 text-foreground rounded-xl px-3 py-2 border border-primary/10">
                    <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
                    <span><span className="font-medium">Why:</span> {reason}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" className="rounded-full" onClick={() => { store.toggleComplete(task.id); toast.success("Nice. One less decision."); store.incDecisionsAvoided(1); }}>
                    Do it
                  </Button>
                  <div className="text-[10px] text-center text-muted-foreground">match {Math.round(score)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
