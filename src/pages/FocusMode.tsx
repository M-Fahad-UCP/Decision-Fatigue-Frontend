import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Pause, Check, ArrowLeft, Maximize2, Timer as TimerIcon } from "lucide-react";
import { useStore, recommendTasks } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const POMODORO = 25 * 60;
const DECIDE_LIMIT = 30;

export default function FocusMode() {
  const store = useStore();
  const nav = useNavigate();
  const recs = useMemo(() => recommendTasks(store.tasks, store.settings, 1), [store.tasks, store.settings]);
  const [task, setTask] = useState(recs[0]?.task);
  const [seconds, setSeconds] = useState(POMODORO);
  const [running, setRunning] = useState(false);
  const [decideLeft, setDecideLeft] = useState(DECIDE_LIMIT);
  const [locked, setLocked] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => { setTask(recs[0]?.task); }, [recs]);

  // Pomodoro
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          toast.success("Pomodoro done. Take a breath.");
          return POMODORO;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // Decision timer — auto-pick if user idles
  useEffect(() => {
    if (task || running) return;
    if (decideLeft <= 0) {
      if (recs[0]) {
        setTask(recs[0].task);
        store.incDecisionsAvoided(1);
        toast("We picked one for you", { description: "No more thinking — just go." });
      }
      return;
    }
    const t = setTimeout(() => setDecideLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [task, decideLeft, running, recs, store]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const done = () => {
    if (!task) return;
    store.toggleComplete(task.id);
    toast.success("Done. That's a win.");
    setRunning(false);
    setSeconds(POMODORO);
    setTask(recommendTasks(store.tasks.filter((t) => t.id !== task.id), store.settings, 1)[0]?.task);
  };

  const enterFullscreen = async () => {
    try { await document.documentElement.requestFullscreen(); setLocked(true); } catch {}
  };
  const exitFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
    setLocked(false);
  };

  // No tasks at all — show a helpful empty state instead of a broken countdown
  const noTasks = recs.length === 0 && !task;

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <div className="container mx-auto p-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => { exitFullscreen(); nav("/dashboard"); }}>
          <ArrowLeft className="mr-2 size-4" /> Exit Focus
        </Button>
        <Button variant="outline" size="sm" onClick={locked ? exitFullscreen : enterFullscreen}>
          <Maximize2 className="mr-2 size-4" /> {locked ? "Unlock" : "Distraction Lock"}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-xl text-center animate-fade-in-up">
          {noTasks ? (
            <div>
              <div className="text-xs uppercase tracking-widest text-primary mb-3">Nothing to focus on</div>
              <h1 className="font-display text-5xl mb-6">Add a task first.</h1>
              <p className="text-muted-foreground mb-8">You have no open tasks. Head over to Tasks and add something — then come back here.</p>
              <Button asChild size="lg" className="rounded-full">
                <Link to="/tasks">Go to Tasks</Link>
              </Button>
            </div>
          ) : !task ? (
            <div>
              <div className="text-xs uppercase tracking-widest text-primary mb-3">Decision Timer</div>
              <h1 className="font-display text-5xl mb-6">Pick something — or we will.</h1>
              <div className="font-display text-7xl gradient-text mb-2">{decideLeft}s</div>
              <p className="text-muted-foreground mb-8">Auto-selecting in {decideLeft} seconds. Momentum &gt; perfection.</p>
              <Button size="lg" className="rounded-full" onClick={() => setTask(recs[0]?.task)}>Use suggestion</Button>
            </div>
          ) : (
            <>
              <div className="text-xs uppercase tracking-widest text-primary mb-3">Now focusing on</div>
              <h1 className="font-display text-4xl md:text-5xl leading-tight mb-10">{task.title}</h1>

              <div className="relative inline-flex items-center justify-center mb-10">
                <svg width="260" height="260" className="-rotate-90">
                  <circle cx="130" cy="130" r="118" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
                  <circle
                    cx="130" cy="130" r="118"
                    stroke="hsl(var(--primary))" strokeWidth="10" fill="none"
                    strokeDasharray={2 * Math.PI * 118}
                    strokeDashoffset={2 * Math.PI * 118 * (1 - seconds / POMODORO)}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <TimerIcon className="size-5 text-muted-foreground mb-2" />
                  <div className="font-display text-6xl tabular-nums">{fmt(seconds)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Pomodoro</div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button size="lg" onClick={() => setRunning((r) => !r)} className="rounded-full px-8 shadow-glow">
                  {running ? <><Pause className="mr-2 size-4" />Pause</> : <><Play className="mr-2 size-4" />Start</>}
                </Button>
                <Button size="lg" variant="secondary" onClick={done} className="rounded-full px-8">
                  <Check className="mr-2 size-4" /> Mark Done
                </Button>
              </div>
            </>
          ) /* end task active branch */ }
        </div>
      </div>
    </div>
  );
}
