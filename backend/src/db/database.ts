import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      password    TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id                 TEXT PRIMARY KEY,
      user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title              TEXT NOT NULL,
      notes              TEXT,
      category           TEXT NOT NULL DEFAULT 'work',
      priority           TEXT NOT NULL DEFAULT 'medium',
      energy_required    TEXT NOT NULL DEFAULT 'medium',
      estimated_minutes  INTEGER NOT NULL DEFAULT 30,
      due_date           TEXT,
      completed          BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at       TEXT,
      created_at         TEXT NOT NULL,
      parent_id          TEXT,
      impact             INTEGER DEFAULT 5
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      work_start         TEXT NOT NULL DEFAULT '09:00',
      work_end           TEXT NOT NULL DEFAULT '18:00',
      peak_energy        TEXT NOT NULL DEFAULT 'morning',
      notifications      BOOLEAN NOT NULL DEFAULT TRUE,
      mood               TEXT NOT NULL DEFAULT 'focused',
      dark_mode          BOOLEAN NOT NULL DEFAULT FALSE,
      three_choices_mode BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS stats (
      user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date                 TEXT NOT NULL,
      decisions_avoided    INTEGER NOT NULL DEFAULT 0,
      streak_days          INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    )
  `;
}
