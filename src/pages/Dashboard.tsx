import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Focus, Wand2, RefreshCw, Clock, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { useStore, recommendTasks, dailyProgress } from "@/lib/store";
import { CognitiveLoadMeter } from "@/components/CognitiveLoadMeter";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const energyColor = (e: string) =>
  e === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  : e === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

const priorityColor = (p: string) =>
  p === "high" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
  : p === "medium" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

function buildTimeBlocks(recs: { task: { estimatedMinutes: number; title: string }; reason: string }[]): string[] {
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  return recs.map(({ task }) => {
    const start = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    now.setMinutes(now.getMinutes() + task.estimatedMinutes + 5);
    return start;
  });
}

export default function Dashboard() {
  const store = useStore();
  const nav = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [planLocked, setPlanLocked] = useState(false);
  const recs = useMemo(() => recommendTasks(store.tasks, store.settings, 3), [store.tasks, store.settings, refreshKey]);
  const progress = dailyProgress(store.tasks);
  const timeBlocks = useMemo(() => buildTimeBlocks(recs), [recs]);

  const handleAutoDecide = () => {
    if (recs.length === 0) {
      toast.info("No tasks to plan. Add some first!");
      return;
    }
    setPlanLocked(false);
    setShowAutoPlan(true);
  };

  const lockInPlan = () => {
    setPlanLocked(true);
    store.incDecisionsAvoided(recs.length + 2);
    toast.success("Plan locked in!", {
      description: `${recs.length} task${recs.length === 1 ? "" : "s"} queued. Decision fatigue: avoided.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:p-6 md:p-10 max-w-6xl">
      {/* Auto-Decide Dialog */}
      <Dialog open={showAutoPlan} onOpenChange={setShowAutoPlan}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Wand2 className="size-5 text-primary" /> Your Auto-Decided Plan
            </DialogTitle>
            <DialogDescription>
              We picked the best tasks for right now based on your energy, priorities, and deadlines. Stop deciding — just execute.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            {recs.map(({ task, reason }, i) => (
              <div key={task.id} className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium leading-snug truncate">{task.title}</div>
                      <div className="text-xs text-muted-foreground italic mt-0.5">"{reason}"</div>
                    </div>
                  </div>
                  {planLocked && <CheckCircle2 className="size-4 text-green-500 flex-shrink-0 mt-0.5" />}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    <Clock className="size-3" /> {timeBlocks[i]} · {task.estimatedMinutes} min
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${energyColor(task.energyRequired)}`}>
                    <Zap className="size-3 inline mr-1" />{task.energyRequired} energy
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {planLocked ? (
            <div className="flex gap-2 mt-2">
              <Button className="flex-1 rounded-full shadow-glow" onClick={() => { setShowAutoPlan(false); nav("/focus"); }}>
                <Focus className="mr-2 size-4" /> Start Focus Mode <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => setShowAutoPlan(false)}>
                Got it
              </Button>
            </div>
          ) : (
            <Button className="w-full rounded-full shadow-glow mt-2" onClick={lockInPlan}>
              <Wand2 className="mr-2 size-4" /> Lock In This Plan
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8 animate-fade-in">
        <div>
          <div className="text-sm text-muted-foreground">{greeting()},</div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mt-1 leading-tight">let's keep it simple today.</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAutoDecide} className="rounded-full shadow-glow flex-1 sm:flex-none">
            <Wand2 className="mr-2 size-4" /> Auto-Decide
          </Button>
          <Button asChild variant="secondary" className="rounded-full flex-1 sm:flex-none">
            <Link to="/focus"><Focus className="mr-2 size-4" /> Focus Mode</Link>
          </Button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <CognitiveLoadMeter tasks={store.tasks} />

        <div className="surface-card rounded-3xl p-6 border border-border/60">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Daily Progress</div>
          <div className="font-display text-4xl mt-1">{progress}%</div>
          <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-hero transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {progress === 100 ? "All clear. Rest is productive too." : "Steady wins beat perfect days."}
          </div>
        </div>

        <div className="surface-card rounded-3xl p-6 border border-border/60 relative overflow-hidden">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Decisions Avoided Today</div>
          <div className="font-display text-5xl mt-1 gradient-text">{store.stats.decisionsAvoidedToday}</div>
          <div className="mt-3 text-sm text-muted-foreground">
            Streak: <span className="font-semibold text-foreground">{store.stats.streakDays} day{store.stats.streakDays === 1 ? "" : "s"}</span>
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 size-32 text-primary/5" />
        </div>
      </div>

      {/* Top 3 recommended */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4 gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-primary">What to do next</div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Top 3 for right now</h2>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setRefreshKey((k) => k + 1); store.incDecisionsAvoided(1); }}>
            <RefreshCw className="sm:mr-2 size-4" /> <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {recs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 sm:p-10 text-center text-muted-foreground">
            All clear. <Link to="/tasks" className="text-primary underline-offset-4 hover:underline">Add a task</Link> to get a recommendation.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map(({ task, reason }, i) => (
              <div key={task.id} className="surface-card rounded-3xl p-5 border border-border/60 animate-scale-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">#{i + 1} pick</span>
                  <span className="text-xs text-muted-foreground capitalize">{task.priority} priority</span>
                </div>
                <div className="font-display text-lg leading-snug">{task.title}</div>
                <div className="mt-2 text-sm text-muted-foreground italic">"{reason}"</div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => store.toggleComplete(task.id)} className="rounded-full">
                    Mark done
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to="/focus">Focus</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Priority list */}
      <section>
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl mb-4">Today's priorities</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(["high", "medium", "low"] as const).map((p) => {
            const items = store.tasks.filter((t) => t.priority === p && !t.completed).slice(0, 5);
            return (
              <div key={p} className="rounded-3xl border border-border bg-card/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-display capitalize text-lg">{p}</div>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">Nothing here. Nice.</div>}
                  {items.map((t) => <TaskCard key={t.id} task={t} compact />)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
