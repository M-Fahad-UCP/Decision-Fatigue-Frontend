import { useState } from "react";
import { Plus, CalendarClock } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Category, Energy, Priority } from "@/lib/types";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const cats: Category[] = ["work", "personal", "health", "learning", "errand"];

export default function Tasks() {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("work");
  const [priority, setPriority] = useState<Priority>("medium");
  const [energy, setEnergy] = useState<Energy>("medium");
  const [estimate, setEstimate] = useState(30);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  const add = () => {
    if (!title.trim()) return;
    store.addTask({
      title: title.trim(),
      category,
      priority,
      energyRequired: energy,
      estimatedMinutes: estimate,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      impact: priority === "high" ? 8 : priority === "medium" ? 6 : 4,
    });
    setTitle("");
    toast.success("Task added");
  };

  const visible = store.tasks.filter((t) =>
    filter === "all" ? true : filter === "open" ? !t.completed : t.completed
  );

  const handleReschedule = () => {
    const n = store.rescheduleOverdue();
    toast.success(n > 0 ? `Rescheduled ${n} overdue task${n === 1 ? "" : "s"} to tomorrow.` : "Nothing overdue. ✨");
    if (n > 0) store.incDecisionsAvoided(n);
  };

  return (
    <div className="container mx-auto p-6 md:p-10 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Tasks</h1>
          <p className="text-muted-foreground mt-2">Add it, prioritize it, then forget about it.</p>
        </div>
        <Button onClick={handleReschedule} variant="outline" className="rounded-full">
          <CalendarClock className="mr-2 size-4" /> Smart Reschedule
        </Button>
      </div>

      {/* Add form */}
      <div className="surface-card rounded-3xl p-5 md:p-6 border border-border/60 mb-8">
        <div className="grid md:grid-cols-12 gap-3">
          <Input
            className="md:col-span-4 rounded-xl"
            placeholder="What do you want to get done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="md:col-span-2 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className="md:col-span-2 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{(["high","medium","low"] as Priority[]).map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={energy} onValueChange={(v) => setEnergy(v as Energy)}>
            <SelectTrigger className="md:col-span-2 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{(["low","medium","high"] as Energy[]).map((p) => <SelectItem key={p} value={p} className="capitalize">{p} energy</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={add} className="md:col-span-2 rounded-xl">
            <Plus className="mr-1 size-4" /> Add
          </Button>
        </div>
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
            {f}
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
