import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListTodo, Sparkles, Focus, BarChart3, Settings as SettingsIcon, Bot, Brain, LogIn, LogOut, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/recommend", label: "What's next", icon: Sparkles },
  { to: "/focus", label: "Focus", icon: Focus },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/assistant", label: "Assistant", icon: Bot },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function AppLayout() {
  const { settings, setSettings } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-gradient-soft overflow-x-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 lg:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:p-5 gap-6 sticky top-0 h-screen overflow-y-auto">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Brain className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Clarity</div>
            <div className="text-xs text-muted-foreground">Decide less. Do more.</div>
          </div>
        </NavLink>

        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-sidebar-border bg-card/60 p-4">
            <div className="text-xs text-muted-foreground mb-2">Mood</div>
            <div className="flex flex-wrap gap-1.5">
              {(["focused", "energetic", "tired", "stressed"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSettings({ mood: m })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-smooth ${
                    settings.mood === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:bg-secondary"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Auth section */}
          {user ? (
            <div className="rounded-2xl border border-sidebar-border bg-card/60 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="size-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium truncate">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="shrink-0 text-muted-foreground hover:text-destructive transition-smooth"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-sidebar-border hover:bg-sidebar-accent/60 transition-smooth"
            >
              <LogIn className="size-3.5" /> Sign in to sync
            </NavLink>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14">
          <NavLink to="/" className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-lg bg-gradient-hero flex items-center justify-center shrink-0">
              <Brain className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display truncate">Clarity</span>
          </NavLink>
          {user ? (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-muted-foreground hover:text-destructive transition-smooth p-2 -mr-2"
            >
              <LogOut className="size-4" />
            </button>
          ) : (
            <Button asChild size="sm" variant="ghost"><NavLink to="/login">Sign in</NavLink></Button>
          )}
        </div>
        <div className="flex gap-1 px-2 pb-2 overflow-x-auto no-scrollbar">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`
              }
            >
              <Icon className="size-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <main key={loc.pathname} className="flex-1 min-w-0 pt-24 sm:pt-28 md:pt-0 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
