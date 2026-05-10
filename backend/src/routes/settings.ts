import { Router } from "express";
import { sql } from "../db/database";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

type SettingsRow = {
  user_id: string; work_start: string; work_end: string; peak_energy: string;
  notifications: boolean; mood: string; dark_mode: boolean; three_choices_mode: boolean;
};

const rowToSettings = (r: SettingsRow) => ({
  workStart: r.work_start,
  workEnd: r.work_end,
  peakEnergy: r.peak_energy,
  notifications: r.notifications,
  mood: r.mood,
  darkMode: r.dark_mode,
  threeChoicesMode: r.three_choices_mode,
});

// GET /api/settings
router.get("/", async (req: AuthRequest, res) => {
  const rows = await sql`SELECT * FROM settings WHERE user_id = ${req.userId!}` as SettingsRow[];
  if (rows.length === 0) { res.status(404).json({ error: "Settings not found" }); return; }
  res.json(rowToSettings(rows[0]));
});

// PUT /api/settings
router.put("/", async (req: AuthRequest, res) => {
  const b = req.body;
  await sql`
    UPDATE settings SET
      work_start         = COALESCE(${b.workStart ?? null}, work_start),
      work_end           = COALESCE(${b.workEnd ?? null}, work_end),
      peak_energy        = COALESCE(${b.peakEnergy ?? null}, peak_energy),
      notifications      = COALESCE(${b.notifications ?? null}, notifications),
      mood               = COALESCE(${b.mood ?? null}, mood),
      dark_mode          = COALESCE(${b.darkMode ?? null}, dark_mode),
      three_choices_mode = COALESCE(${b.threeChoicesMode ?? null}, three_choices_mode)
    WHERE user_id = ${req.userId!}
  `;
  const rows = await sql`SELECT * FROM settings WHERE user_id = ${req.userId!}` as SettingsRow[];
  res.json(rowToSettings(rows[0]));
});

export default router;
