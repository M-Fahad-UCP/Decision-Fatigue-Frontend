import { useState, useMemo } from "react";
import { Plus, CalendarClock, ChevronDown, ChevronUp, ArrowRight, CalendarCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Category, Energy, Priority } from "@/lib/types";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const cats: Category[] = ["work", "personal", "health", "learning", "errand"];

const todayStr = () => new Date().toISOString().slice(0, 10);
const tomorrowLabel = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

export default function Tasks() {
  const store = useStore();
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  // Basic fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("work");
  const [priority, setPriority] = useState<Priority>("medium");
  const [energy, setEnergy] = useState<Energy>("medium");

  // Advanced fields (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notes, setNotes] = useState("");
  const [estimate, setEstimate] = useState(30);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  const overdueTasks = useMemo(() => {
    const today = todayStr();
    return store.tasks.filter((t) => !t.completed && t.dueDate && t.dueDate.slice(0, 10) < today);
  }, [store.tasks]);

  const add = () => {
    if (!title.trim()) { toast.error("Please enter a task title."); return; }
    store.addTask({
      title: title.trim(),
      notes: notes.trim() || undefined,
      category,
      priority,
      energyRequired: energy,
      estimatedMinutes: estimate,
      dueDate: new Date(dueDate).toISOString(),
      impact: priority === "high" ? 8 : priority === "medium" ? 6 : 4,
    });
    setTitle("");
    setNotes("");
    toast.success("Task added");
  };

  const visible = store.tasks.filter((t) =>
    filter === "all" ? true : filter === "open" ? !t.completed : t.completed
  );

  const handleRescheduleOpen = () => {
    if (overdueTasks.length === 0) {
      toast.success("Nothing overdue — you're all caught up!");
      return;
    }
    setShowRescheduleDialog(true);
  };

  const confirmReschedule = () => {
    const n = store.rescheduleOverdue();
    setShowRescheduleDialog(false);
    toast.success(`Rescheduled ${n} task${n === 1 ? "" : "s"} to tomorrow.`);
    if (n > 0) store.incDecisionsAvoided(n);
  };

  return (
    <div className="container mx-auto p-6 md:p-10 max-w-6xl">
      {/* Smart Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" /> Smart Reschedule
            </DialogTitle>
            <DialogDescription>
              {overdueTasks.length} overdue task{overdueTasks.length === 1 ? "" : "s"} will be moved to tomorrow ({tomorrowLabel()}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 my-2 max-h-64 overflow-y-auto pr-1">
            {overdueTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">{t.category} · {t.priority} priority</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-muted-foreground">
                  <span className="text-rose-500 font-medium line-through">{t.dueDate ? formatDate(t.dueDate) : "No date"}</span>
                  <ArrowRight className="size-3" />
                  <span className="text-green-600 dark:text-green-400 font-medium">{tomorrowLabel()}</span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setShowRescheduleDialog(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={confirmReschedule}>
              <CalendarCheck className="mr-2 size-4" /> Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Tasks</h1>
          <p className="text-muted-foreground mt-2">Add it, prioritize it, then forget about it.</p>
        </div>
        <Button onClick={handleRescheduleOpen} variant="outline" className="rounded-full">
          <CalendarClock className="mr-2 size-4" /> Smart Reschedule
          {overdueTasks.length > 0 && (
            <span className="ml-1.5 size-5 rounded-full bg-rose-500 text-white text-xs font-bold inline-flex items-center justify-center">
              {overdueTasks.length}
            </span>
          )}
        </Button>
      </div>

      {/* Add form */}
      <div className="surface-card rounded-3xl p-5 md:p-6 border border-border/60 mb-8">
        {/* Row 1: main fields */}
        <div className="grid md:grid-cols-12 gap-3">
          <Input
            className="md:col-span-4 rounded-xl"
            placeholder="What do you want to get done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !showAdvanced && add()}
          />
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="md:col-span-2 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className="md:col-span-2 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{(["high", "medium", "low"] as Priority[]).map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={energy} onValueChange={(v) => setEnergy(v as Energy)}>
            <SelectTrigger className="md:col-span-2 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{(["low", "medium", "high"] as Energy[]).map((e) => <SelectItem key={e} value={e} className="capitalize">{e} energy</SelectItem>)}</SelectContent>
          </Select>
          <Button
            variant="ghost"
            className="md:col-span-2 rounded-xl text-muted-foreground text-sm"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? <ChevronUp className="mr-1 size-4" /> : <ChevronDown className="mr-1 size-4" />}
            More
          </Button>
        </div>

        {/* Row 2: advanced fields */}
        {showAdvanced && (
          <div className="grid md:grid-cols-12 gap-3 mt-3 pt-3 border-t border-border/50 animate-fade-in">
            <Input
              className="md:col-span-5 rounded-xl"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Due date</span>
              <Input
                type="date"
                className="rounded-xl"
                value={dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Est. min</span>
              <Input
                type="number"
                className="rounded-xl"
                value={estimate}
                min={5}
                max={480}
                step={5}
                onChange={(e) => setEstimate(Number(e.target.value))}
              />
            </div>
            <Button onClick={add} className="md:col-span-2 rounded-xl">
              <Plus className="mr-1 size-4" /> Add Task
            </Button>
          </div>
        )}

        {/* Row 3: simple add button when advanced is hidden */}
        {!showAdvanced && (
          <div className="mt-3 flex justify-end">
            <Button onClick={add} className="rounded-xl px-6">
              <Plus className="mr-1 size-4" /> Add Task
            </Button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(["open", "all", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-smooth capitalize ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-secondary"
            }`}
          >
            {f} {f === "open" ? `(${store.tasks.filter(t => !t.completed).length})` : f === "done" ? `(${store.tasks.filter(t => t.completed).length})` : `(${store.tasks.length})`}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <div className="font-display text-xl mb-2">Nothing here yet.</div>
          <div className="text-muted-foreground">Start by adding your first task above. Small steps.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {visible.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}
