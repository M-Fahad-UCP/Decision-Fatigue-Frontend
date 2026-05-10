import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db/database";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import settingsRoutes from "./routes/settings";
import statsRoutes from "./routes/stats";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:8080", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stats", statsRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Initialize DB tables then start server (local dev only — Vercel uses the export below)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT ?? 3001;
  initDb()
    .then(() => app.listen(PORT, () => console.log(`Clarity API → http://localhost:${PORT}`)))
    .catch((err) => { console.error("DB init failed", err); process.exit(1); });
} else {
  // On Vercel the tables are created once via the Neon dashboard migration
}

export default app;
