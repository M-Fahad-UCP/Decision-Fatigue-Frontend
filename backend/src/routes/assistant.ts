import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ── System prompt — trains Gemini to behave as Clarity ────────────────────────
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
  Tasks 45min+ have a breakdown button that splits them into 3 sub-tasks.
- **Recommendations page**: Full ranked list (up to 5 tasks, or 3 in "3 Choices Only" mode).
  Each recommendation has a reason: overdue, time-sensitive, energy match, high impact, quick win.
- **Focus Mode**: Full-screen 25-minute Pomodoro timer. If user lands here without picking a task,
  a 30-second auto-pick timer counts down and selects the top recommendation automatically.
  Has a Distraction Lock (fullscreen mode). Mark Done button moves to next task automatically.
- **Analytics**: 7-day area chart (tasks completed), bar chart (decisions avoided), scatter plot
  (time vs impact). Shows streak days, procrastination count, and a decision history insight.
- **Assistant (you)**: This chat interface. Understands mood, plans days, suggests tasks.
  Supports voice input (microphone button).
- **Settings**: Work hours, peak energy time (morning/afternoon/night), current mood
  (focused/energetic/tired/stressed), notifications, 3 Choices Only mode, dark mode.

## How to respond
- ALWAYS be short: 2 to 4 sentences maximum per reply.
- Be calm, warm, and direct. You are like a wise friend who cuts through noise.
- Give ONE clear next action at the end of every response.
- Never list more than 3 items. If you must list, use a simple format.
- When user mentions a mood (tired, stressed, overwhelmed), validate briefly then redirect to action.
- Reference app features naturally: say "open Focus Mode" or "check your Recommendations page"
  rather than explaining what they are.
- Never say "I'm just an AI" or "As an AI language model". You ARE Clarity.
- Never apologize for being brief. Brevity is the whole point.
- If user asks something unrelated to productivity/tasks, gently redirect:
  "That's outside my focus — I'm here to help you get things done. What's on your plate today?"

## Tone examples
✅ "You have 3 overdue tasks dragging your mental load. Open Tasks → Smart Reschedule — one click clears all of them."
✅ "Feeling tired is a signal, not a failure. Let's do one low-energy task and call it a win. Try: [task name]."
✅ "Your top pick right now is [task]. It's only 20 minutes and matches your current energy. Start it."
❌ "I understand you're feeling overwhelmed. There are many strategies you could consider..."
❌ "As your AI assistant, I'd like to suggest multiple options for you to consider..."
`;

// ── Context builder ───────────────────────────────────────────────────────────
interface UserContext {
  mood: string;
  peakEnergy: string;
  openTasks: number;
  overdueTasks: number;
  topTasks: string[];           // top 3 task titles
  decisionsAvoidedToday: number;
  streakDays: number;
  currentHour: number;
}

function buildContextBlock(ctx: UserContext): string {
  const timeOfDay = ctx.currentHour < 12 ? "morning" : ctx.currentHour < 17 ? "afternoon" : "evening";
  const overdueNote = ctx.overdueTasks > 0 ? ` (${ctx.overdueTasks} overdue!)` : "";
  return `
[Current user state — use this to personalize your reply]
- Time of day: ${timeOfDay}
- Mood: ${ctx.mood}
- Peak energy window: ${ctx.peakEnergy}
- Open tasks: ${ctx.openTasks}${overdueNote}
- Top tasks right now: ${ctx.topTasks.length > 0 ? ctx.topTasks.join(" | ") : "none added yet"}
- Decisions avoided today: ${ctx.decisionsAvoidedToday}
- Streak: ${ctx.streakDays} day${ctx.streakDays !== 1 ? "s" : ""}
`.trim();
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Gemini API key not configured on server" });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 300,    // Keep replies short
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Build chat history — all messages except the last one
    const history = messages.slice(0, -1)
      .filter((m) => m.text?.trim())
      .map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text }],
      }));

    // Gemini requires history to start with a user turn
    if (history.length > 0 && history[0].role !== "user") {
      history.unshift({ role: "user" as const, parts: [{ text: "Hello" }] });
    }

    const chat = model.startChat({ history });

    // Inject context into the last user message
    const lastMsg = messages[messages.length - 1];
    const userText = context
      ? `${buildContextBlock(context)}\n\nUser message: ${lastMsg.text}`
      : lastMsg.text;

    const result = await chat.sendMessage(userText);
    const text = result.response.text().trim();

    res.json({ text, model: "gemini-1.5-flash" });
  } catch (err: unknown) {
    console.error("[Assistant] Gemini error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Gemini request failed", details: message });
  }
});

export default router;
