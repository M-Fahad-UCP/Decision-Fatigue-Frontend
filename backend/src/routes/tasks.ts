import { Router } from "express";
import crypto from "crypto";
import { sql } from "../db/database";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

type TaskRow = {
  id: string; user_id: string; title: string; notes: string | null;
  category: string; priority: string; energy_required: string;
  estimated_minutes: number; due_date: string | null; completed: boolean;
  completed_at: string | null; created_at: string; parent_id: string | null;
  impact: number | null;
};

const rowToTask = (r: TaskRow) => ({
  id: r.id,
  title: r.title,
  notes: r.notes ?? undefined,
  category: r.category,
  priority: r.priority,
  energyRequired: r.energy_required,
  estimatedMinutes: r.estimated_minutes,
  dueDate: r.due_date ?? undefined,
  completed: r.completed,
  completedAt: r.completed_at ?? undefined,
  createdAt: r.created_at,
  parentId: r.parent_id ?? undefined,
  impact: r.impact ?? undefined,
});

// GET /api/tasks
router.get("/", async (req: AuthRequest, res) => {
  const rows = await sql`SELECT * FROM tasks WHERE user_id = ${req.userId!} ORDER BY created_at DESC` as TaskRow[];
  res.json(rows.map(rowToTask));
});

// POST /api/tasks
router.post("/", async (req: AuthRequest, res) => {
  const b = req.body;
  const id = b.id ?? crypto.randomUUID();
  await sql`
    INSERT INTO tasks (id, user_id, title, notes, category, priority, energy_required,
      estimated_minutes, due_date, completed, completed_at, created_at, parent_id, impact)
    VALUES (
      ${id}, ${req.userId!}, ${b.title}, ${b.notes ?? null}, ${b.category ?? "work"},
      ${b.priority ?? "medium"}, ${b.energyRequired ?? "medium"},
      ${b.estimatedMinutes ?? 30}, ${b.dueDate ?? null},
      ${b.completed ?? false}, ${b.completedAt ?? null},
      ${b.createdAt ?? new Date().toISOString()},
      ${b.parentId ?? null}, ${b.impact ?? 5}
    )
  `;
  const rows = await sql`SELECT * FROM tasks WHERE id = ${id}` as TaskRow[];
  res.status(201).json(rowToTask(rows[0]));
});

// PUT /api/tasks/:id
router.put("/:id", async (req: AuthRequest, res) => {
  const rows = await sql`SELECT * FROM tasks WHERE id = ${req.params.id} AND user_id = ${req.userId!}` as TaskRow[];
  if (rows.length === 0) { res.status(404).json({ error: "Task not found" }); return; }
  const existing = rows[0];
  const b = req.body;

  await sql`
    UPDATE tasks SET
      title = ${b.title ?? existing.title},
      notes = ${b.notes !== undefined ? b.notes : existing.notes},
      category = ${b.category ?? existing.category},
      priority = ${b.priority ?? existing.priority},
      energy_required = ${b.energyRequired ?? existing.energy_required},
      estimated_minutes = ${b.estimatedMinutes ?? existing.estimated_minutes},
      due_date = ${b.dueDate !== undefined ? b.dueDate : existing.due_date},
      completed = ${b.completed !== undefined ? b.completed : existing.completed},
      completed_at = ${b.completedAt !== undefined ? b.completedAt : existing.completed_at},
      parent_id = ${b.parentId !== undefined ? b.parentId : existing.parent_id},
      impact = ${b.impact !== undefined ? b.impact : existing.impact}
    WHERE id = ${req.params.id} AND user_id = ${req.userId!}
  `;
  const updated = await sql`SELECT * FROM tasks WHERE id = ${req.params.id}` as TaskRow[];
  res.json(rowToTask(updated[0]));
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  await sql`DELETE FROM tasks WHERE parent_id = ${req.params.id} AND user_id = ${req.userId!}`;
  const result = await sql`DELETE FROM tasks WHERE id = ${req.params.id} AND user_id = ${req.userId!}`;
  if ((result as unknown as { rowCount: number }).rowCount === 0) {
    res.status(404).json({ error: "Task not found" }); return;
  }
  res.status(204).end();
});

// POST /api/tasks/bulk — sync all tasks at once
router.post("/bulk", async (req: AuthRequest, res) => {
  const tasks = req.body as Array<Record<string, unknown>>;
  if (!Array.isArray(tasks)) { res.status(400).json({ error: "Expected array" }); return; }

  for (const b of tasks) {
    await sql`
      INSERT INTO tasks (id, user_id, title, notes, category, priority, energy_required,
        estimated_minutes, due_date, completed, completed_at, created_at, parent_id, impact)
      VALUES (
        ${(b.id as string) ?? crypto.randomUUID()}, ${req.userId!}, ${b.title as string},
        ${(b.notes as string | null) ?? null}, ${(b.category as string) ?? "work"},
        ${(b.priority as string) ?? "medium"}, ${(b.energyRequired as string) ?? "medium"},
        ${(b.estimatedMinutes as number) ?? 30}, ${(b.dueDate as string | null) ?? null},
        ${(b.completed as boolean) ?? false}, ${(b.completedAt as string | null) ?? null},
        ${(b.createdAt as string) ?? new Date().toISOString()},
        ${(b.parentId as string | null) ?? null}, ${(b.impact as number) ?? 5}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  res.json({ synced: tasks.length });
});

export default router;
