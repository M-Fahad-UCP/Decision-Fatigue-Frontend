import { useState, useRef, useEffect } from "react";
import { Bot, Mic, MicOff, Send, Sparkles, Zap } from "lucide-react";
import { useStore, recommendTasks } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { apiAssistantChat, type AssistantMessage, type AssistantContext } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ── Web Speech API types ───────────────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList { readonly [index: number]: SpeechRecognitionResult; readonly length: number; }
interface SpeechRecognitionResult { readonly [index: number]: SpeechRecognitionAlternative; isFinal: boolean; }
interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
interface SpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// ── Local fallback (used when Gemini is unavailable / not logged in) ──────────
function localReply(q: string, tasks: ReturnType<typeof useStore>["tasks"], settings: ReturnType<typeof useStore>["settings"]): string {
  const lower = q.toLowerCase();
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(lower)) {
    const h = new Date().getHours();
    return `${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}! I'm Clarity. Ask me what to do next, tell me your mood, or say "plan my day."`;
  }
  if (/tired|exhausted|sleepy/.test(lower)) return "Got it — low-energy mode on. I'll only suggest quick, easy tasks. Rest is productive too.";
  if (/stressed|anxious|overwhelmed/.test(lower)) return "Totally understandable. Let's pick ONE task and ignore the rest. Open Recommendations and tap the first item.";
  if (/energetic|focused|motivated|ready/.test(lower)) return "Love that energy! Tackle your highest-priority task right now — open Focus Mode and lock in.";
  if (/plan|next|do|start|begin|suggest|recommend|help/.test(lower)) {
    const recs = recommendTasks(tasks, settings, 3);
    if (recs.length === 0) return "No open tasks yet. Add one from the Tasks page and I'll plan from there.";
    return "Your next 3 (ranked for right now):\n" + recs.map((r, i) => `${i + 1}. ${r.task.title} — ${r.reason}`).join("\n");
  }
  if (/how many|count/.test(lower)) {
    const open = tasks.filter(t => !t.completed).length;
    return `${open} open task${open !== 1 ? "s" : ""}. ${open > 10 ? "That's a lot — want me to trim it down?" : "Manageable."}`;
  }
  if (/focus|pomodoro|timer/.test(lower)) return "Open Focus Mode from the sidebar — it locks you in for 25 minutes on your top task. No decisions needed.";
  if (/overdue|late|missed/.test(lower)) {
    const overdue = tasks.filter(t => !t.completed && t.dueDate && t.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)).length;
    if (overdue === 0) return "No overdue tasks. You're on top of things.";
    return `${overdue} overdue task${overdue > 1 ? "s" : ""}. Go to Tasks → Smart Reschedule to push them all to tomorrow in one click.`;
  }
  return `I can plan your next hours, adjust to your mood, or pick one task for you. Try: "what should I do next?"`;
}

// ── Typing indicator component ─────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Assistant() {
  const store = useStore();
  const { isLoggedIn } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: isLoggedIn
        ? "Hi — I'm Clarity, powered by Groq AI. Tell me how you feel or ask 'what should I do next?'"
        : "Hi — I'm Clarity. Sign in to unlock AI-powered responses. For now I'll use local suggestions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [usingAI, setUsingAI] = useState(false);   // true once we get a successful Gemini response

  // Scroll to bottom on every new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addMsg = (role: AssistantMessage["role"], text: string) =>
    setMessages((m) => [...m, { role, text }]);

  // Build context from current store state
  const buildContext = (): AssistantContext => {
    const today = new Date().toISOString().slice(0, 10);
    const topTasks = recommendTasks(store.tasks, store.settings, 3).map((r) => r.task.title);
    const overdueTasks = store.tasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate.slice(0, 10) < today
    ).length;
    return {
      mood: store.settings.mood,
      peakEnergy: store.settings.peakEnergy,
      openTasks: store.tasks.filter((t) => !t.completed).length,
      overdueTasks,
      topTasks,
      decisionsAvoidedToday: store.stats.decisionsAvoidedToday,
      streakDays: store.stats.streakDays,
      currentHour: new Date().getHours(),
    };
  };

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: AssistantMessage = { role: "user", text: q };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setLoading(true);

    try {
      if (isLoggedIn) {
        // ── Gemini path ──
        const data = await apiAssistantChat(updatedMsgs, buildContext());
        addMsg("assistant", data.text);
        if (!usingAI) setUsingAI(true);
      } else {
        // ── Local fallback ──
        await new Promise((r) => setTimeout(r, 400)); // brief delay feels natural
        addMsg("assistant", localReply(q, store.tasks, store.settings));
      }
    } catch {
      // Gemini failed — fall back silently
      addMsg("assistant", localReply(q, store.tasks, store.settings));
    } finally {
      setLoading(false);
      store.incDecisionsAvoided(1);
    }
  };

  const autoPlan = async () => {
    const planMsg = "Plan my next few hours.";
    addMsg("user", planMsg);
    setLoading(true);

    try {
      if (isLoggedIn) {
        const msgs: AssistantMessage[] = [...messages, { role: "user", text: planMsg }];
        const data = await apiAssistantChat(msgs, buildContext());
        addMsg("assistant", data.text);
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const recs = recommendTasks(store.tasks, store.settings, 4);
        addMsg(
          "assistant",
          recs.length === 0
            ? "No tasks yet — add some from the Tasks page and I'll plan from there."
            : "Here's a calm plan:\n" +
              recs.map((r, i) => `${i + 1}. ${r.task.title} — ${r.task.estimatedMinutes}m`).join("\n") +
              "\n\nStart with #1 and don't look at the rest until it's done."
        );
      }
    } catch {
      const recs = recommendTasks(store.tasks, store.settings, 3);
      addMsg(
        "assistant",
        recs.length === 0
          ? "No tasks to plan yet."
          : "Your top picks:\n" + recs.map((r, i) => `${i + 1}. ${r.task.title}`).join("\n")
      );
    } finally {
      setLoading(false);
      store.incDecisionsAvoided(2);
      toast.success("Day planned");
    }
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported. Try Chrome or Edge."); return; }

    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript;
      setInput(t);
      send(t);
    };
    recognition.onerror = () => { toast.error("Couldn't understand audio. Try again."); setListening(false); };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    toast.info("Listening… speak now");
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:p-6 md:p-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="size-10 sm:size-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow shrink-0">
          <Bot className="size-5 sm:size-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl">Assistant</h1>
            {usingAI && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                <Zap className="size-2.5" /> Groq AI
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {isLoggedIn ? "Powered by Groq AI · knows your tasks and mood" : "Sign in to unlock AI responses"}
          </p>
        </div>
      </div>

      {/* Quick action */}
      <div className="flex gap-2 mb-4">
        <Button onClick={autoPlan} variant="outline" className="rounded-full w-full sm:w-auto" disabled={loading}>
          <Sparkles className="mr-2 size-4" /> Auto-plan my day
        </Button>
      </div>

      {/* Chat window */}
      <div className="surface-card rounded-3xl border border-border/60 p-4 sm:p-5 space-y-3 min-h-[320px] sm:min-h-[400px] max-h-[55vh] sm:max-h-[60vh] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 whitespace-pre-line break-words text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="mt-4 flex gap-2">
        <Button
          variant={listening ? "destructive" : "outline"}
          size="icon"
          className="rounded-full shrink-0"
          onClick={toggleVoice}
          title={listening ? "Stop listening" : "Voice input"}
          disabled={loading}
        >
          {listening ? <MicOff className="size-4 animate-pulse" /> : <Mic className="size-4" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          placeholder={listening ? "Listening…" : loading ? "Clarity is thinking…" : "Ask anything…"}
          className="rounded-full"
          disabled={loading || listening}
        />
        <Button
          onClick={() => send()}
          className="rounded-full shrink-0"
          disabled={!input.trim() || loading}
        >
          <Send className="size-4" />
        </Button>
      </div>

      {!isLoggedIn && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <a href="/login" className="text-primary hover:underline underline-offset-4">Sign in</a> to unlock full Gemini AI responses with your task context.
        </p>
      )}
    </div>
  );
}
