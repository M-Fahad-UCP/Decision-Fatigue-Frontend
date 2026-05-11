import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db/database";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import settingsRoutes from "./routes/settings";
import statsRoutes from "./routes/stats";
import assistantRoutes from "./routes/assistant";

const app = express();

// Allow the configured CLIENT_ORIGIN, any *.onrender.com subdomain (Render preview URLs),
// and localhost for local development.
const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN,
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any Render.com subdomain automatically
      if (origin.endsWith(".onrender.com")) return callback(null, true);
      // Allow explicitly listed origins
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/assistant", assistantRoutes);

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
