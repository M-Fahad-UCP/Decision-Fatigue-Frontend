import { Link } from "react-router-dom";
import { ArrowRight, Brain, Sparkles, Focus, BarChart3, Timer, Heart } from "lucide-react";
import heroImg from "@/assets/hero-calm.jpg";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Brain, title: "Cognitive Load Meter", desc: "See your mental load in real time and let the app reduce it for you." },
  { icon: Sparkles, title: "Smart Recommendations", desc: "Always know the next best thing to do — with the reason why." },
  { icon: Focus, title: "Focus Mode", desc: "One task. One timer. One outcome. Zero decisions." },
  { icon: Timer, title: "Decision Timer", desc: "Stuck choosing? We'll auto-pick after 30 seconds — momentum beats perfection." },
  { icon: Heart, title: "Mood-Based Plans", desc: "Tired, stressed, or energetic — your plan adapts to you, not the other way around." },
  { icon: BarChart3, title: "Decision Insights", desc: "Track decisions saved, streaks built, and where your time has the most impact." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="container mx-auto flex items-center justify-between py-4 sm:py-5 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="size-8 sm:size-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow shrink-0">
              <Brain className="size-4 sm:size-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg sm:text-xl truncate">Clarity</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-smooth">How it works</a>
            <Button asChild variant="ghost"><Link to="/dashboard">Try Demo</Link></Button>
            <Button asChild><Link to="/dashboard">Get Started <ArrowRight className="ml-1 size-4" /></Link></Button>
          </nav>
          <Button asChild className="md:hidden" size="sm"><Link to="/dashboard">Open</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-soft" />
        <img
          src={heroImg}
          alt=""
          width={1280}
          height={1280}
          className="absolute -right-20 sm:-right-32 -top-10 sm:-top-20 w-[380px] sm:w-[560px] lg:w-[720px] max-w-none opacity-60 sm:opacity-80 animate-float pointer-events-none select-none"
        />
        <div className="container mx-auto pt-28 sm:pt-36 md:pt-40 pb-20 sm:pb-32 md:pb-48 relative px-4 sm:px-6">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur text-xs">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              <span className="truncate">The average adult makes 35,000 decisions a day</span>
            </div>
            <h1 className="mt-5 sm:mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Stop overthinking. <br />
              <span className="gradient-text">Start doing.</span>
            </h1>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-xl">
              Clarity quietly removes the small choices that drain you — what to do next, when to rest,
              what to ignore — so you can spend your energy on the work that matters.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6 sm:px-7 shadow-glow">
                <Link to="/dashboard">Get Started Free <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6 sm:px-7">
                <Link to="/dashboard">Try the Demo</Link>
              </Button>
            </div>
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-5 sm:gap-x-6 gap-y-4 text-xs text-muted-foreground">
              <div><span className="font-display text-xl sm:text-2xl text-foreground">87%</span><div>fewer micro-decisions</div></div>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div><span className="font-display text-xl sm:text-2xl text-foreground">2.4x</span><div>more deep work</div></div>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div><span className="font-display text-xl sm:text-2xl text-foreground">12min</span><div>saved per task</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Decision fatigue explainer */}
      <section id="how" className="py-16 sm:py-20 md:py-24 bg-card/40">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center px-4 sm:px-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary mb-3">What is decision fatigue?</div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">
              Every choice spends energy. <br className="hidden sm:block" />By 3pm, you're running on fumes.
            </h2>
            <p className="mt-4 sm:mt-5 text-muted-foreground text-base sm:text-lg">
              Studies show willpower and focus deplete with each decision. Clarity acts like a calm assistant
              that has already decided for you — so when you sit down, the next move is obvious.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              ["35k", "Daily decisions"],
              ["−40%", "Focus by afternoon"],
              ["3", "Choices is the sweet spot"],
              ["+2hr", "Reclaimed per day"],
            ].map(([n, l]) => (
              <div key={l} className="surface-card rounded-2xl p-4 sm:p-6 border border-border/60">
                <div className="font-display text-3xl sm:text-4xl gradient-text">{n}</div>
                <div className="mt-2 text-xs sm:text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <div className="text-xs uppercase tracking-widest text-primary mb-3">How it helps</div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">A quiet system that thinks for you.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="surface-card rounded-2xl p-5 sm:p-6 border border-border/60 hover:-translate-y-1 transition-smooth">
                <div className="size-10 sm:size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 sm:mb-4">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display text-lg sm:text-xl mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-hero p-8 sm:p-10 md:p-16 text-center text-primary-foreground shadow-elegant relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 20%, white, transparent 40%)" }} />
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl relative">Ready to decide less?</h2>
            <p className="mt-4 text-sm sm:text-base text-primary-foreground/80 max-w-xl mx-auto relative">
              Open Clarity and let it plan the rest of your day in under 30 seconds.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 sm:mt-8 rounded-full px-6 sm:px-7 relative">
              <Link to="/dashboard">Open Dashboard <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-8 sm:py-10 border-t border-border">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground px-4 sm:px-6">
          <div>© {new Date().getFullYear()} Clarity. Decide less. Do more.</div>
          <div className="flex gap-4 sm:gap-6">
            <a href="#features" className="hover:text-foreground transition-smooth">Features</a>
            <Link to="/dashboard" className="hover:text-foreground transition-smooth">App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
