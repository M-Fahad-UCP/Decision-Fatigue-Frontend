import { useState, useRef, useEffect } from "react";
import { Bot, Mic, MicOff, Send, Sparkles } from "lucide-react";
import { useStore, recommendTasks } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; text: string };

// Web Speech API type augmentation
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

function buildReply(q: string, tasks: ReturnType<typeof useStore>["tasks"], settings: ReturnType<typeof useStore>["settings"]): string {
  const lower = q.toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(lower)) {
    const h = new Date().getHours();
    const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return `${greet}! I'm Clarity. Ask me what you should do next, tell me how you feel, or say "plan my day."`;
  }

  // Mood updates
  if (lower.includes("tired") || lower.includes("exhausted") || lower.includes("sleepy")) {
    return "Got it — switching to low-energy mode. I'll only suggest quick, easy tasks for now. Rest is productive too.";
  }
  if (lower.includes("stressed") || lower.includes("anxious") || lower.includes("overwhelmed")) {
    return "Totally understandable. Let's narrow your focus. Pick ONE thing from your list and ignore the rest. Which category feels safest right now — work, personal, or health?";
  }
  if (lower.includes("energetic") || lower.includes("focused") || lower.includes("motivated") || lower.includes("ready")) {
    return "Love that energy! This is the perfect time to tackle your highest-priority task. Go for it.";
  }

  // Plan / what next
  if (/plan|next|do|start|begin|suggest|recommend|help/.test(lower)) {
    const recs = recommendTasks(tasks, settings, 3);
    if (recs.length === 0) return "You have no open tasks. Add one from the Tasks page and I'll plan from there.";
    return (
      "Here's your next 3 (ranked by urgency + energy match):\n" +
      recs.map((r, i) => `${i + 1}. ${r.task.title} (${r.task.estimatedMinutes}m) — ${r.reason}`).join("\n")
    );
  }

  // How many tasks
  if (/how many|count/.test(lower)) {
    const open = tasks.filter((t) => !t.completed).length;
    const done = tasks.filter((t) => t.completed).length;
    return `You have ${open} open task${open !== 1 ? "s" : ""} and ${done} completed. ${open > 10 ? "That's a lot — want me to trim it down?" : ""}`;
  }

  // Focus mode hint
  if (/focus|pomodoro|timer|block/.test(lower)) {
    return "Open Focus Mode from the sidebar — it'll lock you in for 25 minutes on your top task. No decisions needed.";
  }

  // Stats / progress
  if (/progress|stats|streak|decisions/.test(lower)) {
    const open = tasks.filter((t) => !t.completed).length;
    const done = tasks.filter((t) => t.completed).length;
    return `So far: ${done} done, ${open} open. Every completed task is a decision you've already made — that's the point.`;
  }

  // Break down task
  if (/break|breakdown|split|smaller/.test(lower)) {
    return "Find the task in your Tasks page and tap the breakdown button — it'll split it into 3 smaller steps automatically.";
  }

  // Overdue
  if (/overdue|late|missed/.test(lower)) {
    const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10));
    if (overdue.length === 0) return "No overdue tasks. You're on top of things.";
    return `You have ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}. Go to Tasks → Smart Reschedule to push them to tomorrow in one click.`;
  }

  // Default
  return "I can plan your next hours, adjust to your mood, count your tasks, or remind you about overdue items. Try: "what should I do next?" or "I'm feeling tired."";
}

export default function Assistant() {
  const store = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi — I'm Clarity. Tell me how you feel or ask 'what should I do next?' and I'll plan it for you." },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = (role: Msg["role"], text: string) =>
    setMessages((m) => [...m, { role, text }]);

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    addMsg("user", q);
    setTimeout(() => {
      addMsg("assistant", buildReply(q, store.tasks, store.settings));
      store.incDecisionsAvoided(1);
    }, 400);
  };

  const autoPlan = () => {
    const recs = recommendTasks(store.tasks, store.settings, 4);
    addMsg("user", "Plan my next few hours.");
    setTimeout(() => {
      addMsg(
        "assistant",
        recs.length === 0
          ? "Nothing to plan yet — add some tasks first."
          : "Here's a calm plan for your next few hours:\n" +
            recs.map((r, i) => `${i + 1}. ${r.task.title} — ${r.task.estimatedMinutes}m`).join("\n") +
            "\n\nStart with #1 and don't look at the rest until it's done."
      );
      store.incDecisionsAvoided(recs.length + 1);
    }, 400);
    toast.success("Plan generated");
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      send(transcript);
    };

    recognition.onerror = () => {
      toast.error("Couldn't understand audio. Please try again.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    toast.info("Listening… speak now");
  };

  return (
    <div className="container mx-auto p-6 md:p-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow">
          <Bot className="size-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl">Assistant</h1>
          <p className="text-sm text-muted-foreground">Your calm second brain.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={autoPlan} variant="outline" className="rounded-full">
          <Sparkles className="mr-2 size-4" /> Auto-plan my day
        </Button>
      </div>

      <div className="surface-card rounded-3xl border border-border/60 p-5 space-y-3 min-h-[400px] max-h-[60vh] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-line text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant={listening ? "destructive" : "outline"}
          size="icon"
          className="rounded-full shrink-0"
          onClick={toggleVoice}
          title={listening ? "Stop listening" : "Voice input"}
        >
          {listening ? <MicOff className="size-4 animate-pulse" /> : <Mic className="size-4" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={listening ? "Listening…" : "Ask anything…"}
          className="rounded-full"
          disabled={listening}
        />
        <Button onClick={() => send()} className="rounded-full shrink-0" disabled={!input.trim() && !listening}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
