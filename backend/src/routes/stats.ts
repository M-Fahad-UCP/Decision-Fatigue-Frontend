import { Router } from "express";
import { sql } from "../db/database";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const todayISO = () => new Date().toISOString().slice(0, 10);

async function getOrCreateToday(userId: string) {
  const today = todayISO();
  await sql`
    INSERT INTO stats (user_id, date, decisions_avoided, streak_days)
    VALUES (${userId}, ${today}, 0, 0)
    ON CONFLICT (user_id, date) DO NOTHING
  `;
  const rows = await sql`SELECT * FROM stats WHERE user_id = ${userId} AND date = ${today}`;
  return rows[0] as { user_id: string; date: string; decisions_avoided: number; streak_days: number };
}

// GET /api/stats
router.get("/", async (req: AuthRequest, res) => {
  const today = await getOrCreateToday(req.userId!);
  const history = await sql`
    SELECT date, decisions_avoided, streak_days
    FROM stats WHERE user_id = ${req.userId!}
    ORDER BY date DESC LIMIT 30
  ` as Array<{ date: string; decisions_avoided: number; streak_days: number }>;

  res.json({
    decisionsAvoidedToday: today.decisions_avoided,
    streakDays: today.streak_days,
    lastActiveDate: today.date,
    history: history.map((r) => ({ date: r.date, decisionsAvoided: r.decisions_avoided })),
  });
});

// POST /api/stats/inc
router.post("/inc", async (req: AuthRequest, res) => {
  const { amount = 1 } = req.body as { amount?: number };
  await getOrCreateToday(req.userId!);
  await sql`
    UPDATE stats SET decisions_avoided = decisions_avoided + ${amount}
    WHERE user_id = ${req.userId!} AND date = ${todayISO()}
  `;
  const rows = await sql`SELECT decisions_avoided FROM stats WHERE user_id = ${req.userId!} AND date = ${todayISO()}`;
  res.json({ decisionsAvoidedToday: (rows[0] as { decisions_avoided: number }).decisions_avoided });
});

// PUT /api/stats — bulk sync from client
router.put("/", async (req: AuthRequest, res) => {
  const { decisionsAvoidedToday, streakDays, history } = req.body;
  const today = todayISO();

  await sql`
    INSERT INTO stats (user_id, date, decisions_avoided, streak_days)
    VALUES (${req.userId!}, ${today}, ${decisionsAvoidedToday ?? 0}, ${streakDays ?? 0})
    ON CONFLICT (user_id, date) DO UPDATE SET
      decisions_avoided = EXCLUDED.decisions_avoided,
      streak_days = EXCLUDED.streak_days
  `;

  if (Array.isArray(history)) {
    for (const r of history as Array<{ date: string; decisionsAvoided: number }>) {
      await sql`
        INSERT INTO stats (user_id, date, decisions_avoided, streak_days)
        VALUES (${req.userId!}, ${r.date}, ${r.decisionsAvoided ?? 0}, 0)
        ON CONFLICT (user_id, date) DO NOTHING
      `;
    }
  }
  res.json({ ok: true });
});

export default router;
