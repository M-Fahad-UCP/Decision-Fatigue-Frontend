// Core types for the Decision Fatigue Reducer app

export type Priority = "high" | "medium" | "low";
export type Category = "work" | "personal" | "health" | "learning" | "errand";
export type Energy = "low" | "medium" | "high";
export type Mood = "tired" | "energetic" | "stressed" | "focused";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: Category;
  priority: Priority;
  energyRequired: Energy;
  estimatedMinutes: number;
  dueDate?: string; // ISO date
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  parentId?: string; // for auto-broken-down subtasks
  impact?: number; // 1-10 perceived impact
}

export interface Settings {
  workStart: string; // "09:00"
  workEnd: string; // "18:00"
  peakEnergy: "morning" | "afternoon" | "night";
  notifications: boolean;
  mood: Mood;
  darkMode: boolean;
  threeChoicesMode: boolean;
}

export interface AppStats {
  decisionsAvoidedToday: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  history: { date: string; completed: number; created: number; decisionsAvoided: number }[];
}
