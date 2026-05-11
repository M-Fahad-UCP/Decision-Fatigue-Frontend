import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sql } from "../db/database";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, name, password } = req.body as { email?: string; name?: string; password?: string };

  if (!email || !name || !password) {
    res.status(400).json({ error: "email, name and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(password, 10);

  await sql`INSERT INTO users (id, email, name, password) VALUES (${id}, ${email}, ${name}, ${hash})`;
  await sql`INSERT INTO settings (user_id) VALUES (${id})`;

  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id, email, name } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  const user = rows[0] as { id: string; email: string; name: string; password: string } | undefined;

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

export default router;
