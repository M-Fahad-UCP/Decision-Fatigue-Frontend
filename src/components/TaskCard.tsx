import { Check, Clock, Flame, Trash2, Sparkles, Zap } from "lucide-react";
import type { Task } from "@/lib/types";
import { useStore, autoBreakdown } from "@/lib/store";
import { Button } from "@/components/ui/button";

const priorityStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning-foreground border-warning/30",
  low: "bg-success/10 text-success border-success/20",
} as const;

const categoryDot = {
  work: "bg-primary",
  personal: "bg-accent",
  health: "bg-success",
  learning: "bg-warning",
  errand: "bg-muted-foreground",
} as const;

export function TaskCard({ task, compact }: { task: Task; compact?: boolean }) {
  const { toggleComplete, deleteTask, breakdownTask } = useStore();

  return (
    <div
      className={`group relative rounded-2xl border border-border bg-card p-4 transition-smooth hover:shadow-soft hover:-translate-y-0.5 ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleComplete(task.id)}
          aria-label="Toggle complete"
          className={`mt-0.5 size-5 rounded-full border-2 flex items-center justify-center transition-smooth ${
            task.completed ? "bg-primary border-primary" : "border-border hover:border-primary"
          }`}
        >
          {task.completed && <Check className="size-3 text-primary-foreground" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`size-2 rounded-full ${categoryDot[task.category]}`} />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{task.category}</span>
            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-md border ${priorityStyles[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          <div className={`mt-1 font-medium ${task.completed ? "line-through" : ""}`}>{task.title}</div>
          {!compact && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" />{task.estimatedMinutes}m</span>
              <span className="inline-flex items-center gap-1"><Zap className="size-3" />{task.energyRequired} energy</span>
              {task.dueDate && (
                <span className="inline-flex items-center gap-1"><Flame className="size-3" />{new Date(task.dueDate).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>

        {!compact && (
          <div className="opacity-0 group-hover:opacity-100 transition-smooth flex gap-1">
            {task.estimatedMinutes >= 45 && !task.parentId && (
              <Button size="icon" variant="ghost" title="Break into smaller steps" onClick={() => breakdownTask(task.id, autoBreakdown(task.title))}>
                <Sparkles className="size-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" title="Delete" onClick={() => deleteTask(task.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
