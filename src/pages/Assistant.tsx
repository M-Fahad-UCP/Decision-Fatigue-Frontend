import { useState } from "react";
import { Bot, Mic, Send, Sparkles } from "lucide-react";
import { useStore, recommendTasks } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; text: string };

export default function Assistant() {
  const store = useStore();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi — I'm Clarity. Tell me how you feel or ask 'what should I do next?' and I'll plan it for you." },
  ]);
  const [input, setInput] = useState("");

  const respond = (q: string): string => {
    const lower = q.toLowerCase();
    if (lower.includes("plan") || lower.includes("next") || lower.includes("do")) {
      const recs = recommendTasks(store.tasks, store.settings, 3);
      if (recs.length === 0) return "You have no open tasks. Add one and I'll plan from there.";
      return "Here's your next 3:\n" + recs.map((r, i) => `${i + 1}. ${r.task.title} — ${r.reason}`).join("\n");
    }
    if (lower.includes("tired") || lower.includes("stressed")) {
      store.setSettings({ mood: lower.includes("tired") ? "tired" : "stressed" });
      return "Got it. I'll lean toward low-energy quick wins for the rest of today.";
    }
    if (lower.includes("focus")) return "Open Focus Mode from the sidebar — I'll start a 25-minute block on your top task.";
    return "I can plan your next hours, adjust to your mood, or pick one task for you. Try: 'what should I do next?'";
  };

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: respond(q) }]);
      store.incDecisionsAvoided(1);
    }, 500);
  };

  const autoPlan = () => {
    const recs = recommendTasks(store.tasks, store.settings, 4);
    setMessages((m) => [
      ...m,
      { role: "user", text: "Plan my next few hours." },
      { role: "assistant", text: recs.length === 0 ? "Nothing to plan yet." : "Here's a calm plan:\n" + recs.map((r, i) => `${i + 1}. ${r.task.title} (${r.task.estimatedMinutes}m)`).join("\n") },
    ]);
    store.incDecisionsAvoided(recs.length + 1);
    toast.success("Plan generated");
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
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="icon" className="rounded-full" onClick={() => toast("Voice input is a UI demo", { description: "Coming soon." })}>
          <Mic className="size-4" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything…"
          className="rounded-full"
        />
        <Button onClick={send} className="rounded-full">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
