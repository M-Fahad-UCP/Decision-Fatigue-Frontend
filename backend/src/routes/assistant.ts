import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ── System prompt — trains the model to behave as Clarity ─────────────────────
const SYSTEM_PROMPT = `
You are Clarity — the built-in AI assistant for a Decision Fatigue Reducer web app.

## What this app does
Clarity is a productivity app that helps users stop overthinking and start doing.
The core problem it solves: the average adult makes 35,000 decisions per day. By afternoon,
willpower and focus are depleted. Clarity removes small decisions so users can spend energy
on work that matters.

## App features you know deeply
- **Dashboard**: Shows top 3 recommended tasks ranked by urgency + energy + impact.
  Has a Cognitive Load Meter (low/medium/high based on open task count and overdue items).
  Shows Daily Progress % and Decisions Avoided counter.
- **Tasks page**: Add tasks with title, notes, category (work/personal/health/learning/errand),
  priority (high/medium/low), energy required (low/medium/high), estimated minutes, due date.
  Has a Smart Reschedule button that pushes all overdue tasks to tomorrow in one click.
  Tasks 45min+ have a breakdown button that splits them into 3 sub-tasks automatically.
- **Recommendations page**: Full ranked list (up to 5 tasks, or 3 in "3 Choices Only" mode).
  Each recommendation shows a reason: overdue, time-sensitive, energy match, high impact, quick win.
- **Focus Mode**: Full-screen 25-minute Pomodoro timer. If user lands here without picking a task,
  a 30-second auto-pick timer selects the top recommendation automatically.
  Has a Distraction Lock (fullscreen). Mark Done moves to next task automatically.
- **Analytics**: 7-day area chart (tasks completed), bar chart (decisions avoided), scatter plot
  (time vs impact). Shows streak days, procrastination count, and a decision history insight.
- **Assistant (you)**: This chat. Understands mood, plans days, suggests tasks. Has voice input.
- **Settings**: Work hours, peak energy time (morning/afternoon/night), current mood
  (focused/energetic/tired/stressed), notifications, 3 Choices Only mode, dark mode.

## How to respond — STRICT RULES
1. Keep every reply to 2 to 4 sentences maximum. Never longer.
2. Be calm, warm, and direct — like a wise friend who cuts through noise.
3. Give ONE clear next action at the end of every response.
4. Never list more than 3 items at once.
5. When user mentions a mood (tired, stressed, overwhelmed), acknowledge briefly then redirect to action.
6. Reference app features naturally — say "open Focus Mode" or "check Recommendations" naturally.
7. Never say "I'm just an AI" or "As an AI". You ARE Clarity.
8. Never apologize for being brief. Brevity is the whole point.
9. If asked something unrelated to productivity, redirect: "That's outside my focus — what's on your plate today?"

## Good response examples
✅ "You have 3 overdue tasks dragging your focus. Go to Tasks → Smart Reschedule — one click clears them all."
✅ "Tired is a signal, not a failure. Pick one low-energy task and call it a win. Try: [task name]."
✅ "Your top task right now is [task]. It's only 20 minutes. Open Focus Mode and start it."
❌ "I understand you're feeling overwhelmed. There are many strategies you could consider..."
❌ "As your AI assistant, I'd like to suggest multiple options for you to consider..."
`.trim();

// ── Context builder ────────────────────────────────────────────────────────────
interface UserContext {
  mood: string;
  peakEnergy: string;
  openTasks: number;
  overdueTasks: number;
  topTasks: string[];
  decisionsAvoidedToday: number;
  streakDays: number;
  currentHour: number;
}

function buildContextBlock(ctx: UserContext): string {
  const timeOfDay = ctx.currentHour < 12 ? "morning" : ctx.currentHour < 17 ? "afternoon" : "evening";
  const overdueNote = ctx.overdueTasks > 0 ? ` (${ctx.overdueTasks} overdue — needs attention)` : "";
  return [
    `[Live user context — use this to personalize your reply]`,
    `Time of day: ${timeOfDay}`,
    `Mood: ${ctx.mood}`,
    `Peak energy window: ${ctx.peakEnergy}`,
    `Open tasks: ${ctx.openTasks}${overdueNote}`,
    `Top tasks right now: ${ctx.topTasks.length > 0 ? ctx.topTasks.join(" | ") : "none yet"}`,
    `Decisions avoided today: ${ctx.decisionsAvoidedToday}`,
    `Streak: ${ctx.streakDays} day${ctx.streakDays !== 1 ? "s" : ""}`,
  ].join("\n");
}

// ── Groq API call (OpenAI-compatible, no SDK needed) ──────────────────────────
async function callGroq(
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq API error ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? "I couldn't generate a response. Please try again.";
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post("/chat", async (req: AuthRequest, res) => {
  const { messages, context } = req.body as {
    messages: Array<{ role: "user" | "assistant"; text: string }>;
    context?: UserContext;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "GROQ_API_KEY not configured on server" });
    return;
  }

  try {
    // Build OpenAI-format history from previous messages (all except last)
    const history = messages.slice(0, -1)
      .filter((m) => m.text?.trim())
      .map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

    // Inject live user context into the final user message
    const lastMsg = messages[messages.length - 1];
    const userMessage = context
      ? `${buildContextBlock(context)}\n\nUser says: ${lastMsg.text}`
      : lastMsg.text;

    const text = await callGroq(SYSTEM_PROMPT, history, userMessage, apiKey);
    res.json({ text, model: "llama-3.1-8b-instant (Groq)" });
  } catch (err: unknown) {
    console.error("[Assistant] Groq error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "AI response failed", details: message });
  }
});

export default router;
