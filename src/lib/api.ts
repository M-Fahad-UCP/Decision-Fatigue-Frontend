import { getToken, saveAuth, clearAuth, type AuthUser } from "./auth";
import type { Task, Settings, AppStats } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as unknown as T;

  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Request failed");
  return data as T;
}

// ---- Auth ----

export async function apiRegister(email: string, name: string, password: string) {
  const data = await request<{ token: string; user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password }),
  });
  saveAuth(data.token, data.user);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const data = await request<{ token: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveAuth(data.token, data.user);
  return data;
}

export function apiLogout() {
  clearAuth();
}

// ---- Tasks ----

export const apiGetTasks = () => request<Task[]>("/api/tasks");

export const apiCreateTask = (task: Omit<Task, "id" | "createdAt" | "completed"> & { id?: string; createdAt?: string; completed?: boolean }) =>
  request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(task) });

export const apiUpdateTask = (id: string, patch: Partial<Task>) =>
  request<Task>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(patch) });

export const apiDeleteTask = (id: string) =>
  request<void>(`/api/tasks/${id}`, { method: "DELETE" });

export const apiBulkSyncTasks = (tasks: Task[]) =>
  request<{ synced: number }>("/api/tasks/bulk", { method: "POST", body: JSON.stringify(tasks) });

// ---- Settings ----

export const apiGetSettings = () => request<Settings>("/api/settings");

export const apiUpdateSettings = (patch: Partial<Settings>) =>
  request<Settings>("/api/settings", { method: "PUT", body: JSON.stringify(patch) });

// ---- Stats ----

export const apiGetStats = () => request<AppStats>("/api/stats");

export const apiIncDecisionsAvoided = (amount = 1) =>
  request<{ decisionsAvoidedToday: number }>("/api/stats/inc", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

export const apiSyncStats = (stats: AppStats) =>
  request<{ ok: boolean }>("/api/stats", { method: "PUT", body: JSON.stringify(stats) });

// ---- Health ----
export const apiHealth = () => request<{ status: string }>("/health");

export { ApiError };
