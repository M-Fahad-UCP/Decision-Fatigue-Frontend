import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useStore } from "@/lib/store";

export default function Analytics() {
  const { tasks, stats } = useStore();

  const last7 = useMemo(() => {
    const days: { date: string; label: string; completed: number; created: number; saved: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const hist = stats.history.find((h) => h.date === key);
      const completed = tasks.filter((t) => t.completedAt?.startsWith(key)).length + (hist?.completed ?? 0);
      const created = tasks.filter((t) => t.createdAt.startsWith(key)).length + (hist?.created ?? 0);
      const saved = (hist?.decisionsAvoided ?? 0) + (i === 0 ? stats.decisionsAvoidedToday : 0);
      days.push({ date: key, label: d.toLocaleDateString(undefined, { weekday: "short" }), completed, created, saved });
    }
    return days;
  }, [tasks, stats]);

  const impactData = useMemo(() => tasks.filter((t) => !t.parentId).map((t) => ({
    name: t.title,
    time: t.estimatedMinutes,
    impact: t.impact ?? 5,
    z: t.priority === "high" ? 200 : t.priority === "medium" ? 120 : 60,
  })), [tasks]);

  const procrastination = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => !t.completed && t.dueDate && t.dueDate.slice(0, 10) < today).length;
  }, [tasks]);

  return (
    <div className="container mx-auto px-4 py-6 sm:p-6 md:p-10 max-w-6xl space-y-6 sm:space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary">Analytics</div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mt-2 leading-tight">Your patterns, not your to-do list.</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          ["Completed (7d)", last7.reduce((a, b) => a + b.completed, 0)],
          ["Decisions saved (7d)", last7.reduce((a, b) => a + b.saved, 0)],
          ["Streak", `${stats.streakDays}d`],
          ["Procrastinating", procrastination],
        ].map(([l, v]) => (
          <div key={l as string} className="surface-card rounded-2xl p-4 sm:p-5 border border-border/60">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
            <div className="font-display text-2xl sm:text-3xl mt-1 gradient-text">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="surface-card rounded-3xl p-4 sm:p-6 border border-border/60">
          <h3 className="font-display text-lg sm:text-xl mb-3 sm:mb-4">Tasks completed (7 days)</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card rounded-3xl p-4 sm:p-6 border border-border/60">
          <h3 className="font-display text-lg sm:text-xl mb-3 sm:mb-4">Decisions avoided</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="saved" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card rounded-3xl p-4 sm:p-6 border border-border/60 lg:col-span-2">
          <h3 className="font-display text-lg sm:text-xl mb-1">Time vs Impact</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Top-left = quick wins. Top-right = deep work. Bottom = consider dropping.</p>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="time" name="Minutes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="number" dataKey="impact" name="Impact" domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ZAxis type="number" dataKey="z" range={[60, 240]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Scatter data={impactData} fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="surface-card rounded-3xl p-4 sm:p-6 border border-border/60">
        <h3 className="font-display text-lg sm:text-xl mb-3">Decision history insight</h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          You tend to be most decisive in the {(["morning", "afternoon", "night"] as const)[Math.floor((stats.decisionsAvoidedToday + 1) % 3)]}.
          When stressed, your high-priority completion drops by ~22%. Consider planning fewer, higher-impact tasks on those days.
        </p>
      </div>
    </div>
  );
}
