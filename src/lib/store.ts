import { useEffect, useState, useCallback } from "react";
import type { Task, Settings, AppStats, Priority, Category, Energy } from "./types";
import {
  apiGetTasks, apiCreateTask, apiUpdateTask, apiDeleteTask,
  apiGetSettings, apiUpdateSettings,
  apiGetStats, apiIncDecisionsAvoided,
} from "./api";
import { isAuthenticated } from "./auth";

const TASKS_KEY = "dfr.tasks.v1";
const SETTINGS_KEY = "dfr.settings.v1";
const STATS_KEY = "dfr.stats.v1";

const todayISO = () => new Date().toISOString().slice(0, 10);

const defaultSettings: Settings = {
  workStart: "09:00",
  workEnd: "18:00",
  peakEnergy: "morning",
  notifications: true,
  mood: "focused",
  darkMode: false,
  threeChoicesMode: false,
};

const defaultStats: AppStats = {
  decisionsAvoidedToday: 0,
  streakDays: 0,
  lastActiveDate: todayISO(),
  history: [],
};

const seedTasks = (): Task[] => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const inDays = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return iso(d); };
  return [
    { id: crypto.randomUUID(), title: "Draft project proposal", category: "work", priority: "high", energyRequired: "high", estimatedMinutes: 60, dueDate: inDays(1), completed: false, createdAt: iso(now), impact: 9 },
    { id: crypto.randomUUID(), title: "30-minute walk", category: "health", priority: "medium", energyRequired: "low", estimatedMinutes: 30, dueDate: inDays(0), completed: false, createdAt: iso(now), impact: 7 },
    { id: crypto.randomUUID(), title: "Reply to client emails", category: "work", priority: "medium", energyRequired: "medium", estimatedMinutes: 25, dueDate: inDays(0), completed: false, createdAt: iso(now), impact: 6 },
    { id: crypto.randomUUID(), title: "Read 20 pages of book", category: "learning", priority: "low", energyRequired: "low", estimatedMinutes: 25, dueDate: inDays(2), completed: false, createdAt: iso(now), impact: 5 },
    { id: crypto.randomUUID(), title: "Plan weekly groceries", category: "errand", priority: "low", energyRequired: "low", estimatedMinutes: 15, dueDate: inDays(1), completed: false, createdAt: iso(now), impact: 4 },
  ];
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

let _tasks: Task[] = load<Task[] | null>(TASKS_KEY, null) ?? seedTasks();
let _settings: Settings = load<Settings>(SETTINGS_KEY, defaultSettings);
let _stats: AppStats = load<AppStats>(STATS_KEY, defaultStats);

// Track whether we've loaded from the API in this session
let _apiLoaded = false;

const persist = () => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(_tasks));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(_settings));
  localStorage.setItem(STATS_KEY, JSON.stringify(_stats));
};

// Reset daily counters
(function rolloverDailyStats() {
  const t = todayISO();
  if (_stats.lastActiveDate !== t) {
    _stats.history = [
      ..._stats.history,
      {
        date: _stats.lastActiveDate,
        completed: _tasks.filter((x) => x.completedAt?.startsWith(_stats.lastActiveDate)).length,
        created: _tasks.filter((x) => x.createdAt.startsWith(_stats.lastActiveDate)).length,
        decisionsAvoided: _stats.decisionsAvoidedToday,
      },
    ].slice(-30);
    _stats.decisionsAvoidedToday = 0;
    _stats.lastActiveDate = t;
    persist();
  }
})();

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", _settings.darkMode);
  }, []);

  // Load from API once per session when logged in
  useEffect(() => {
    if (_apiLoaded || !isAuthenticated()) return;
    _apiLoaded = true;

    Promise.all([apiGetTasks(), apiGetSettings(), apiGetStats()])
      .then(([tasks, settings, stats]) => {
        _tasks = tasks;
        _settings = settings;
        _stats = stats;
        persist();
        document.documentElement.classList.toggle("dark", settings.darkMode);
        notify();
      })
      .catch(() => {
        // API unreachable — keep using localStorage data silently
      });
  }, []);

  const update = useCallback(() => { persist(); notify(); }, []);

  return {
    tasks: _tasks,
    settings: _settings,
    stats: _stats,

    addTask: (t: Omit<Task, "id" | "createdAt" | "completed">) => {
      const newTask: Task = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString(), completed: false };
      _tasks = [newTask, ..._tasks];
      update();
      if (isAuthenticated()) {
        apiCreateTask(newTask).catch(() => {});
      }
    },

    updateTask: (id: string, patch: Partial<Task>) => {
      _tasks = _tasks.map((x) => (x.id === id ? { ...x, ...patch } : x));
      update();
      if (isAuthenticated()) {
        apiUpdateTask(id, patch).catch(() => {});
      }
    },

    deleteTask: (id: string) => {
      _tasks = _tasks.filter((x) => x.id !== id && x.parentId !== id);
      update();
      if (isAuthenticated()) {
        apiDeleteTask(id).catch(() => {});
      }
    },

    toggleComplete: (id: string) => {
      _tasks = _tasks.map((x) =>
        x.id === id
          ? { ...x, completed: !x.completed, completedAt: !x.completed ? new Date().toISOString() : undefined }
          : x
      );
      update();
      const updated = _tasks.find((x) => x.id === id);
      if (isAuthenticated() && updated) {
        apiUpdateTask(id, { completed: updated.completed, completedAt: updated.completedAt }).catch(() => {});
      }
    },

    breakdownTask: (id: string, steps: string[]) => {
      const parent = _tasks.find((t) => t.id === id);
      if (!parent) return;
      const subs: Task[] = steps.map((s) => ({
        id: crypto.randomUUID(),
        title: s,
        category: parent.category,
        priority: parent.priority,
        energyRequired: parent.energyRequired,
        estimatedMinutes: Math.max(10, Math.round(parent.estimatedMinutes / steps.length)),
        dueDate: parent.dueDate,
        completed: false,
        createdAt: new Date().toISOString(),
        parentId: parent.id,
        impact: parent.impact,
      }));
      _tasks = [..._tasks, ...subs];
      update();
      if (isAuthenticated()) {
        subs.forEach((s) => apiCreateTask(s).catch(() => {}));
      }
    },

    rescheduleOverdue: () => {
      const today = todayISO();
      let changed = 0;
      const updates: Array<{ id: string; dueDate: string }> = [];
      _tasks = _tasks.map((x) => {
        if (!x.completed && x.dueDate && x.dueDate.slice(0, 10) < today) {
          changed++;
          const next = new Date(); next.setDate(next.getDate() + 1);
          const dueDate = next.toISOString();
          updates.push({ id: x.id, dueDate });
          return { ...x, dueDate };
        }
        return x;
      });
      if (changed > 0) {
        update();
        if (isAuthenticated()) {
          updates.forEach(({ id, dueDate }) => apiUpdateTask(id, { dueDate }).catch(() => {}));
        }
      }
      return changed;
    },

    setSettings: (patch: Partial<Settings>) => {
      _settings = { ..._settings, ...patch };
      if (typeof patch.darkMode === "boolean") {
        document.documentElement.classList.toggle("dark", patch.darkMode);
      }
      update();
      if (isAuthenticated()) {
        apiUpdateSettings(patch).catch(() => {});
      }
    },

    incDecisionsAvoided: (n = 1) => {
      _stats = { ..._stats, decisionsAvoidedToday: _stats.decisionsAvoidedToday + n };
      update();
      if (isAuthenticated()) {
        apiIncDecisionsAvoided(n).catch(() => {});
      }
    },
  };
}

export type Store = ReturnType<typeof useStore>;

// ======== Recommendation engine ========

const energyScore = (e: Energy) => ({ low: 1, medium: 2, high: 3 }[e]);
const priorityScore = (p: Priority) => ({ low: 1, medium: 2, high: 3 }[p]);

function currentEnergy(settings: Settings): Energy {
  const hour = new Date().getHours();
  const peak = settings.peakEnergy;
  const peakHours = peak === "morning" ? [7, 12] : peak === "afternoon" ? [12, 17] : [18, 23];
  const inPeak = hour >= peakHours[0] && hour <= peakHours[1];
  if (settings.mood === "tired") return inPeak ? "medium" : "low";
  if (settings.mood === "stressed") return "medium";
  if (settings.mood === "energetic") return "high";
  return inPeak ? "high" : "medium";
}

export function recommendTasks(tasks: Task[], settings: Settings, limit = 3): { task: Task; reason: string; score: number }[] {
  const today = todayISO();
  const energy = energyScore(currentEnergy(settings));
  const open = tasks.filter((t) => !t.completed);

  const scored = open.map((t) => {
    const dueDays = t.dueDate ? Math.max(0, Math.ceil((+new Date(t.dueDate) - +new Date()) / 86400000)) : 7;
    const urgency = Math.max(0, 7 - dueDays);
    const overdue = t.dueDate && t.dueDate.slice(0, 10) < today ? 4 : 0;
    const energyMatch = 4 - Math.abs(energyScore(t.energyRequired) - energy) * 2;
    const impact = (t.impact ?? 5) / 2;
    const prio = priorityScore(t.priority) * 1.5;
    const score = urgency + overdue + energyMatch + impact + prio;

    let reason = "Balanced choice for now";
    if (overdue) reason = "Overdue — close it out to clear mental load";
    else if (urgency >= 5) reason = "Time-sensitive — handle today";
    else if (energyMatch >= 3 && energyScore(t.energyRequired) === energy) reason = `Matches your current ${currentEnergy(settings)} energy`;
    else if ((t.impact ?? 0) >= 8) reason = "High impact — future-you will thank you";
    else if (t.estimatedMinutes <= 20) reason = "Quick win — minimize regret of not starting";
    return { task: t, reason, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function cognitiveLoad(tasks: Task[]): { level: "low" | "medium" | "high"; openCount: number; pct: number } {
  const open = tasks.filter((t) => !t.completed).length;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate.slice(0, 10) < todayISO()).length;
  const score = open + overdue * 2;
  const pct = Math.min(100, (score / 20) * 100);
  const level = score < 6 ? "low" : score < 14 ? "medium" : "high";
  return { level, openCount: open, pct };
}

export function dailyProgress(tasks: Task[]): number {
  const today = todayISO();
  const todays = tasks.filter((t) => (t.dueDate?.slice(0, 10) === today) || (t.completedAt?.startsWith(today)));
  if (todays.length === 0) return 0;
  return Math.round((todays.filter((t) => t.completed).length / todays.length) * 100);
}

export function autoBreakdown(title: string): string[] {
  return [
    `Outline: ${title}`,
    `Draft first half of: ${title}`,
    `Finish & polish: ${title}`,
  ];
}
